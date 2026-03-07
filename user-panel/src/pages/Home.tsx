import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
} from "lucide-react";
import { api, reviewsAPI } from "../services/api";
import SubscriptionModal from "../components/SubscriptionModal";
import { useCart } from "../contexts/CartContext";
import { useProducts } from "../hooks/useProducts";
import PricingDisplay from "../components/PricingDisplay";
import {
  getProductRating,
  getProductReviewCount,
  hasVerifiedReviews,
} from "../utils/product_reviews";
import { useProductReviewStats } from "../hooks/useProductReviewStats";
import VerifiedBadge from "../components/VerifiedBadge";
import { getSessionId } from "../utils/session";
import { getApiBase } from "../utils/apiBase";
import WishlistButton from "../components/WishlistButton";
import HotDeals from "../components/HotDeals";

// Social Media Videos Component with auto-slide in horizontal line
const SocialMediaVideos: React.FC<{
  videos: any[];
  scrollerRef: React.RefObject<HTMLDivElement>;
}> = ({ videos, scrollerRef }) => {
  const { user } = useAuth();
  const localVideos: string[] = [];

  // Map videos with their data and URLs
  const apiVideos = (videos || []).map((v: any) => ({
    ...v,
    videoUrl:
      v.video_type === "local"
        ? (() => {
            const apiBase = getApiBase();
            return `${apiBase.replace("/api", "")}/uploads/${v.video_url}`;
          })()
        : v.video_url,
  }));

  const allVideos = [...apiVideos];
  const [videoStats, setVideoStats] = useState<
    Record<number, { views: number; likes: number; liked: boolean }>
  >({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [carouselSettings, setCarouselSettings] = useState({
    autoAdvanceInterval: 3000,
    videoPlayDuration: 3000,
    animationDuration: 700,
    animationEasing: "ease-in-out",
    autoPlay: true,
    radius: 500,
    blurAmount: 12,
    minOpacity: 0.6,
    minScale: 0.85,
  });

  // Load carousel settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiBase = getApiBase();

        const response = await fetch(`${apiBase}/api/carousel-settings`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].settings) {
            setCarouselSettings(data[0].settings);
          }
        }
      } catch (error) {
        console.error("Failed to load carousel settings:", error);
        // Fallback to localStorage
        const saved = localStorage.getItem("carousel-settings");
        if (saved) {
          try {
            setCarouselSettings(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse saved settings:", e);
          }
        }
      }
    };
    loadSettings();
  }, []);

  // Calculate video width on mount and resize
  useEffect(() => {
    if (allVideos.length === 0) return;

    const updateDimensions = () => {
      if (videoContainerRef.current) {
        const container = videoContainerRef.current;
        const firstVideo = container.querySelector(
          ".video-item",
        ) as HTMLElement;
        if (firstVideo) {
          const width = firstVideo.offsetWidth;
          setVideoWidth(width);
        }
      }
    };

    // Wait for videos to render
    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener("resize", updateDimensions);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [allVideos.length]);

  // Auto-advance based on settings - use videoPlayDuration for timing
  useEffect(() => {
    if (allVideos.length === 0) return;
    if (!carouselSettings.autoPlay) return;

    const playDuration =
      carouselSettings.videoPlayDuration ||
      carouselSettings.autoAdvanceInterval ||
      3000;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // Loop back to start when reaching the end
        return nextIndex >= allVideos.length ? 0 : nextIndex;
      });
    }, playDuration);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    allVideos.length,
    carouselSettings.autoPlay,
    carouselSettings.videoPlayDuration,
    carouselSettings.autoAdvanceInterval,
  ]);

  // Load video stats
  useEffect(() => {
    if (allVideos.length === 0) return;

    const likedVideos = JSON.parse(
      localStorage.getItem("liked-videos") || "[]",
    );
    const stats: Record<
      number,
      { views: number; likes: number; liked: boolean }
    > = {};
    allVideos.forEach((video: any) => {
      if (video.id) {
        stats[video.id] = {
          views: video.views || 0,
          likes: video.likes || 0,
          liked: likedVideos.includes(video.id),
        };
      }
    });
    setVideoStats(stats);
  }, [allVideos.length]);

  // Track video view when it becomes center - one view per user
  useEffect(() => {
    if (allVideos.length === 0) return;

    const currentVideo = allVideos[currentIndex];
    if (!currentVideo || !currentVideo.id) return;

    // Track view only once when video becomes center
    trackVideoView(currentVideo.id);
  }, [currentIndex, allVideos.length]);

  const trackVideoView = async (videoId: number) => {
    try {
      const apiBase = getApiBase();

      const sessionId = getSessionId();
      const userId = user?.id || null;

      const response = await fetch(`${apiBase}/api/videos/${videoId}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update stats with the actual view count from server
        // Only update if this was a new view (not already_viewed)
        if (!data.already_viewed) {
          setVideoStats((prev) => ({
            ...prev,
            [videoId]: {
              ...(prev[videoId] || { views: 0, likes: 0, liked: false }),
              views: data.views || prev[videoId]?.views || 0,
            },
          }));
        } else {
          // View was already recorded, just update with current count
          setVideoStats((prev) => ({
            ...prev,
            [videoId]: {
              ...(prev[videoId] || { views: 0, likes: 0, liked: false }),
              views: data.views || prev[videoId]?.views || 0,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to track video view:", error);
      // Don't increment locally on error - let backend handle tracking
      // Just ensure stats object exists for this video
      setVideoStats((prev) => ({
        ...prev,
        [videoId]: {
          ...(prev[videoId] || { views: 0, likes: 0, liked: false }),
        },
      }));
    }
  };

  const handleLike = async (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // Just toggle liked status - likes are always 30% of views, so no need to update like count
    const isLiked = videoStats[videoId]?.liked || false;

    setVideoStats((prev) => ({
      ...prev,
      [videoId]: {
        ...(prev[videoId] || { views: 0, likes: 0, liked: false }),
        liked: !isLiked,
      },
    }));

    // Save liked status to localStorage per video
    const likedVideos = JSON.parse(
      localStorage.getItem("liked-videos") || "[]",
    );
    if (!isLiked) {
      localStorage.setItem(
        "liked-videos",
        JSON.stringify([...likedVideos, videoId]),
      );
    } else {
      localStorage.setItem(
        "liked-videos",
        JSON.stringify(likedVideos.filter((id: number) => id !== videoId)),
      );
    }
  };

  const handleVideoClick = (video: any) => {
    if (video.redirect_url) {
      window.open(video.redirect_url, "_blank");
    }
  };

  // Play/pause videos based on center position
  useEffect(() => {
    if (allVideos.length === 0) return;

    const videoElements = document.querySelectorAll(
      ".video-item video",
    ) as NodeListOf<HTMLVideoElement>;

    videoElements.forEach((video, idx) => {
      if (idx === currentIndex) {
        // Play center video
        video.play().catch((err) => {
          console.log("Video play error:", err);
        });
      } else {
        // Pause and reset other videos
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, allVideos.length]);

  // Don't render if no videos
  if (allVideos.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .video-carousel-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .video-carousel-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div
        className="relative w-full overflow-visible py-8 flex items-center justify-center"
        style={{ perspective: "1500px", perspectiveOrigin: "center center" }}
      >
        <div
          className="relative overflow-visible"
          style={{
            width: "100%",
            maxWidth: "100vw",
            height: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
          }}
        >
          <div
            ref={videoContainerRef}
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${-currentIndex * (360 / allVideos.length)}deg)`,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: `transform ${carouselSettings.animationDuration || 700}ms ${carouselSettings.animationEasing || "ease-in-out"}`,
            }}
          >
            {allVideos.map((video: any, idx) => {
              const src = video.videoUrl || video;
              const videoId = video.id;
              const stats = videoId ? videoStats[videoId] : null;
              const angle = (360 / allVideos.length) * idx;
              const isCenter = idx === currentIndex;
              const distanceFromCenter = Math.abs(idx - currentIndex);
              const minDistance = Math.min(
                distanceFromCenter,
                allVideos.length - distanceFromCenter,
              );
              const blurAmount = isCenter
                ? 0
                : Math.min(
                    minDistance * ((carouselSettings.blurAmount || 12) / 2),
                    carouselSettings.blurAmount || 12,
                  );
              const opacity = isCenter
                ? 1
                : Math.max(
                    1 - minDistance * 0.15,
                    carouselSettings.minOpacity || 0.6,
                  );
              const scale = isCenter
                ? 1
                : Math.max(
                    1 - minDistance * 0.05,
                    carouselSettings.minScale || 0.85,
                  );

              const videoWidthValue = videoWidth > 0 ? videoWidth : 350;

              return (
                <div
                  key={idx}
                  className="video-item absolute bg-white overflow-hidden rounded-xl shadow-lg transition-all duration-300 cursor-pointer"
                  style={{
                    width: `${videoWidthValue}px`,
                    aspectRatio: "9/16",
                    left: "50%",
                    top: "50%",
                    marginLeft: `-${videoWidthValue / 2}px`,
                    marginTop: `-${(videoWidthValue * (16 / 9)) / 2}px`,
                    transform: `
                      rotateY(${angle}deg) 
                      translateZ(${carouselSettings.radius || 500}px)
                      scale(${scale})
                    `,
                    filter: `blur(${blurAmount}px)`,
                    opacity: opacity,
                    zIndex: isCenter ? 10 : 5 - minDistance,
                    backfaceVisibility: "visible",
                    transformStyle: "preserve-3d",
                    pointerEvents: "auto",
                  }}
                  onClick={() => handleVideoClick(video)}
                >
                  <video
                    src={src}
                    className="block w-full h-full rounded-xl"
                    autoPlay={isCenter}
                    loop
                    muted
                    playsInline
                    controls={false}
                    onPlay={(e) => {
                      // Ensure video plays when it becomes center
                      const video = e.target as HTMLVideoElement;
                      if (isCenter) {
                        video.play().catch(() => {});
                      }
                    }}
                    onPause={(e) => {
                      // Resume if it's the center video
                      const video = e.target as HTMLVideoElement;
                      if (isCenter && carouselSettings.autoPlay) {
                        video.play().catch(() => {});
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Video Stats Overlay */}
                  {isCenter && videoId && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-20 pointer-events-none">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (video.redirect_url) {
                              window.open(video.redirect_url, "_blank");
                            }
                          }}
                          className="flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all pointer-events-auto hover:bg-black/70 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-white" />
                          <span className="text-sm font-semibold text-white">
                            {stats?.views || video.views || 0}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(videoId, e);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all pointer-events-auto ${
                            stats?.liked ? "bg-red-500/80" : "bg-black/50"
                          } hover:bg-red-500/80`}
                        >
                          <Heart
                            className={`h-4 w-4 ${stats?.liked ? "fill-white text-white" : "text-white"}`}
                          />
                          <span className="text-sm font-semibold text-white">
                            {Math.round(
                              (stats?.views || video.views || 0) * 0.3,
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};




// Promotional Banner Component with Slider
const PromotionalBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      title: "GALAXY S21 5G",
      subtitle: "PRE-ORDER NOW",
      label: "AVAILABLE 1.29",
      description: "Get up to $200 in Samsung Credit.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
      fallbackImage: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800",
      gradient: "from-gray-700 to-gray-800",
      buttonColor: "bg-yellow-500 text-gray-900 hover:bg-yellow-400",
    },
    {
      title: "IPHONE 14 PRO",
      subtitle: "NOW AVAILABLE",
      label: "LIMITED STOCK",
      description: "Experience the power of A16 Bionic chip.",
      image: "https://images.unsplash.com/photo-1592286927505-b0501739c61b?auto=format&fit=crop&q=80&w=800",
      fallbackImage: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
      gradient: "from-gray-800 to-gray-900",
      buttonColor: "bg-yellow-500 text-gray-900 hover:bg-yellow-400",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lg:col-span-2 relative overflow-hidden rounded-2xl shadow-xl h-[400px]">
      {banners.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient}`} />
          
          <div className="relative z-10 h-full p-8 sm:p-12 flex flex-col justify-center">
            <div className="max-w-md">
              <p className="text-white text-sm font-medium mb-2 uppercase tracking-wide">
                {banner.label}
              </p>
              <h2 className="text-white text-4xl sm:text-5xl font-bold mb-2 leading-tight">
                {banner.title}
              </h2>
              <h3 className="text-white text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                {banner.subtitle}
              </h3>
              <p className="text-white text-lg mb-6 opacity-90">
                {banner.description}
              </p>
              <button 
                onClick={() => window.location.hash = '#/user/shop'}
                className={`${banner.buttonColor} px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
              >
                SHOP NOW
              </button>
            </div>
          </div>

          {/* Product Image */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full pointer-events-none">
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = banner.fallbackImage;
              }}
            />
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 z-20"
        aria-label="Previous banner"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 z-20"
        aria-label="Next banner"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-8 flex gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Hot Deals Carousel Component
const HotDealsCarousel: React.FC = () => {
  const [currentDeal, setCurrentDeal] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 1,
    minutes: 50,
    seconds: 21,
  });

  const deals = [
    {
      name: "Flydigi Vader Wireless",
      image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=400",
      fallbackImage: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=400",
      originalPrice: 64.00,
      salePrice: 19.20,
      discount: 70,
      rating: 5,
      stock: 900,
      badges: ["On Sale!", "New"],
    },
    {
      name: "PlayStation 5 Console",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400",
      fallbackImage: "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?auto=format&fit=crop&q=80&w=400",
      originalPrice: 499.00,
      salePrice: 399.00,
      discount: 20,
      rating: 5,
      stock: 150,
      badges: ["Hot!", "New"],
    },
    {
      name: "Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
      fallbackImage: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=400",
      originalPrice: 199.00,
      salePrice: 149.00,
      discount: 25,
      rating: 4,
      stock: 500,
      badges: ["Sale!", "Popular"],
    },
  ];

  const currentProduct = deals[currentDeal];

  const nextDeal = () => {
    setCurrentDeal((prev) => (prev + 1) % deals.length);
  };

  const prevDeal = () => {
    setCurrentDeal((prev) => (prev - 1 + deals.length) % deals.length);
  };

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      
    </div>
  );
};


export default function Home() {
  const { items: products, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [csvProducts, setCsvProducts] = useState<any[]>([]);

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);

  useEffect(() => {
    const fetchCsvProducts = async () => {
      try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/products-csv`);
        if (response.ok) {
          const data = await response.json();
          setCsvProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch CSV products:", error);
      }
    };
    fetchCsvProducts();
  }, []);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/blog/posts`);
        if (response.ok) {
          const data = await response.json();
          // Filter approved posts and convert image paths
          const approvedPosts = data
            .filter((post: any) => post.status === 'approved')
            .map((post: any) => ({
              ...post,
              images: post.images.map((imagePath: string) => {
                if (imagePath.startsWith('/uploads/')) {
                  return `${apiBase}${imagePath}`;
                }
                return imagePath;
              }),
            }))
            .slice(0, 4); // Get only first 4 posts
          setBlogPosts(approvedPosts);
        }
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setBlogLoading(false);
      }
    };
    fetchBlogPosts();
  }, []);
  const [videos, setVideos] = useState<any[]>([]);
  const videoScrollerRef = useRef<HTMLDivElement>(null);
  const [justLandedIndex, setJustLandedIndex] = useState(0);

  // Get all product slugs for batch fetching review stats
  const productSlugs = useMemo(() => {
    return products.map((p) => p.slug || "").filter((slug) => slug);
  }, [products]);

  // Fetch review stats for all products
  const { stats: reviewStats } = useProductReviewStats(productSlugs);

  // CMS Sections State
  const [scrollingText, setScrollingText] = useState<string>("");
  const [topMediaImages, setTopMediaImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1571781926291-c477eb317dc0?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920",
  ]);
  const [topMediaSettings, setTopMediaSettings] = useState<any>({
    animationType: "fade",
    transitionDuration: 1000,
    autoPlay: true,
    autoPlayDelay: 7000,
    designStyle: "modern",
    showDots: true,
    showArrows: true,
    loop: true,
  });
  const [topMediaIndex, setTopMediaIndex] = useState(0);

  const [heroImages, setHeroImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1615397323226-f7035ce4c94f?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1556228720-1c2a4624dc2fb?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1920",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=1920",
  ]);
  const [heroSettings, setHeroSettings] = useState<any>({
    animationType: "fade",
    transitionDuration: 1000,
    autoPlay: true,
    autoPlayDelay: 7000,
    designStyle: "modern",
    showDots: true,
    showArrows: true,
    loop: true,
  });
  const [heroIndex, setHeroIndex] = useState(0);

  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({
    Body: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=400",
    Face: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    Hair: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=400",
    Combos: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400",
  });
  const [commitmentImages, setCommitmentImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1615397323226-f7035ce4c94f?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400",
  ]);
  const [completeKitImage, setCompleteKitImage] = useState<string>("https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200");
  const [marketplaceLogos, setMarketplaceLogos] = useState<string[]>([
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
  ]);
  const [nefolCollection, setNefolCollection] = useState<any>({
    image: "https://images.unsplash.com/photo-1608248593842-8021c6b12d5d?auto=format&fit=crop&q=80&w=800",
    title: "NEFOL COLLECTION",
    subtitle: "ELEVATE YOUR SKINCARE WITH",
    description:
      "Our premium collection combines the best of nature and science to deliver exceptional results for your skin.",
    buttonText: "SHOP NOW",
    buttonLink: "/shop",
  });
  const [whatsappSubscription, setWhatsappSubscription] = useState({
    image: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&q=80&w=600",
    logo: "",
    heading: "Join The NEFOL® Circle",
    description:
      "Stay ahead with exclusive style drops, member-only offers, and insider fashion updates.",
    footer:
      "By subscribing, you agree to receive WhatsApp messages from NEFOL®.",
    logoName: "NEFÖL",
  });
  const [foreverFavorites, setForeverFavorites] = useState<any>({
    title: "FOREVER FAVORITES",
    description:
      "Discover our most loved products that have become staples in skincare routines worldwide.",
    luxurySkincare: {
      image: "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?auto=format&fit=crop&q=80&w=600",
      title: "LUXURY SKINCARE",
      buttonText: "SHOP NOW",
    },
    naturalBeauty: {
      image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=600",
      title: "NATURAL BEAUTY",
      buttonText: "SHOP NOW",
    },
  });
  const [naturalBeauty, setNaturalBeauty] = useState<any>({
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800",
    title: "NATURAL BEAUTY",
    subtitle: "ELEVATE YOUR SKIN WITH",
    description: "infused with premium natural ingredients",
    buttonText: "SHOP NOW",
    buttonLink: "/shop",
  });

  // Helper function to normalize URLs
  const normalizeUrl = (url: string) => {
    if (!url) return "";
    let normalizedInput = url.trim().replace(/\\/g, "/");

    if (/^https?:\/\//i.test(normalizedInput)) {
      return normalizedInput;
    }

    // Serve local static assets (like /IMAGES) directly without rewriting extensions
    if (
      normalizedInput.startsWith("/IMAGES/") ||
      normalizedInput.startsWith("/favicon") ||
      normalizedInput.startsWith("/sw.js")
    ) {
      return normalizedInput;
    }

    let apiBase = getApiBase();
    
    // If the image is from the uploads directory, remove /api from apiBase
    if (normalizedInput.startsWith("/uploads/") || normalizedInput.startsWith("uploads/")) {
      const rootBase = apiBase.replace(/\/api\/?$/, "");
      const cleanInput = normalizedInput.startsWith("/") ? normalizedInput : `/${normalizedInput}`;
      return `${rootBase}${cleanInput}`;
    }

    if (normalizedInput.startsWith("/")) {
      return `${apiBase}${normalizedInput}`;
    }
    return `${apiBase}/${normalizedInput}`;
  };

  const getCmsApiBase = () => {
    const apiBase = getApiBase().replace(/\/$/, "");
    const normalized = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
    return `${normalized}/cms`;
  };

  // Fetch Top Media Carousel from CMS
  const fetchTopMediaCarousel = async () => {
    try {
      const cmsBase = getCmsApiBase();
      const response = await fetch(`${cmsBase}/sections/home`);
      if (response.ok) {
        const sections = await response.json();
        const topMediaSection = sections.find(
          (s: any) => s.section_type === "top_media_carousel",
        );

        if (topMediaSection && topMediaSection.content) {
          const content = topMediaSection.content;
          let mediaArray: string[] = [];

          if (content.media && Array.isArray(content.media)) {
            mediaArray = content.media.map((item: any) =>
              normalizeUrl(typeof item === "string" ? item : item.url),
            );
          } else if (
            content.images &&
            Array.isArray(content.images) &&
            content.images.length > 0
          ) {
            mediaArray = content.images.map(normalizeUrl);
          }

          if (mediaArray.length > 0) {
            setTopMediaImages(mediaArray);
          }

          if (content.settings) {
            setTopMediaSettings(content.settings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch top media carousel from CMS:", error);
    }
  };

  // Fetch Hero Banner from CMS
  const fetchHeroBanner = async () => {
    try {
      const cmsBase = getCmsApiBase();
      const response = await fetch(`${cmsBase}/sections/home`);
      if (response.ok) {
        const sections = await response.json();
        const heroSection = sections.find(
          (s: any) => s.section_type === "hero_banner",
        );

        if (heroSection && heroSection.content) {
          const content = heroSection.content;

          if (
            content.images &&
            Array.isArray(content.images) &&
            content.images.length > 0
          ) {
            const normalizedImages = content.images.map(normalizeUrl);
            setHeroImages(normalizedImages);
          }

          if (content.settings) {
            setHeroSettings(content.settings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch hero banner from CMS:", error);
    }
  };

  // Fetch all CMS sections
  const fetchCMSSections = async () => {
    try {
      const cmsBase = getCmsApiBase();
      const response = await fetch(`${cmsBase}/sections/home`);
      if (response.ok) {
        const sections = await response.json();

        // Extract category images from shop_categories section
        const categorySection = sections.find(
          (s: any) => s.section_type === "shop_categories",
        );
        if (
          categorySection &&
          categorySection.content &&
          categorySection.content.categories
        ) {
          const newCategoryImages: Record<string, string> = {};
          categorySection.content.categories.forEach((cat: any) => {
            if (cat.image) {
              newCategoryImages[cat.name] = normalizeUrl(cat.image);
            }
          });
          if (Object.keys(newCategoryImages).length > 0) {
            setCategoryImages((prev) => ({ ...prev, ...newCategoryImages }));
          }
        }

        // Extract commitment images from commitments section
        const commitmentSection = sections.find(
          (s: any) => s.section_type === "commitments",
        );
        if (
          commitmentSection &&
          commitmentSection.content &&
          commitmentSection.content.images
        ) {
          const images = Array.isArray(commitmentSection.content.images)
            ? commitmentSection.content.images.map(normalizeUrl)
            : [];
          if (images.length > 0) {
            setCommitmentImages(images);
          }
        }

        // Extract complete kit image from complete_kit section
        const completeKitSection = sections.find(
          (s: any) => s.section_type === "complete_kit",
        );
        if (
          completeKitSection &&
          completeKitSection.content &&
          completeKitSection.content.image
        ) {
          setCompleteKitImage(normalizeUrl(completeKitSection.content.image));
        }

        // Extract marketplace logos from marketplace_logos section
        const marketplaceSection = sections.find(
          (s: any) => s.section_type === "marketplace_logos",
        );
        if (
          marketplaceSection &&
          marketplaceSection.content &&
          marketplaceSection.content.logos
        ) {
          const logos = Array.isArray(marketplaceSection.content.logos)
            ? marketplaceSection.content.logos.map(normalizeUrl)
            : [];
          if (logos.length > 0) {
            setMarketplaceLogos(logos);
          }
        }

        // Extract Nefol Collection from nefol_collection section
        const nefolCollectionSection = sections.find(
          (s: any) => s.section_type === "nefol_collection",
        );
        if (nefolCollectionSection && nefolCollectionSection.content) {
          setNefolCollection({
            image: nefolCollectionSection.content.image
              ? normalizeUrl(nefolCollectionSection.content.image)
              : "",
            title: nefolCollectionSection.content.title || "NEFOL COLLECTION",
            subtitle:
              nefolCollectionSection.content.subtitle ||
              "ELEVATE YOUR SKINCARE WITH",
            description:
              nefolCollectionSection.content.description ||
              "Our premium collection combines the best of nature and science to deliver exceptional results for your skin.",
            buttonText: nefolCollectionSection.content.buttonText || "SHOP NOW",
            buttonLink: nefolCollectionSection.content.buttonLink || "/shop",
          });
        }

        // Extract Forever Favorites from forever_favorites section
        const foreverFavoritesSection = sections.find(
          (s: any) => s.section_type === "forever_favorites",
        );
        if (foreverFavoritesSection && foreverFavoritesSection.content) {
          const imagesArray = foreverFavoritesSection.content.images || [];
          const luxuryImg =
            foreverFavoritesSection.content.luxurySkincare?.image;
          const naturalImg =
            foreverFavoritesSection.content.naturalBeauty?.image;

          const luxuryImage = luxuryImg
            ? normalizeUrl(luxuryImg)
            : imagesArray[0]
              ? normalizeUrl(imagesArray[0])
              : "";
          const naturalImage = naturalImg
            ? normalizeUrl(naturalImg)
            : imagesArray[1]
              ? normalizeUrl(imagesArray[1])
              : "";

          setForeverFavorites({
            title: foreverFavoritesSection.content.title || "FOREVER FAVORITES",
            description:
              foreverFavoritesSection.content.description ||
              "Discover our most loved products that have become staples in skincare routines worldwide.",
            luxurySkincare: {
              image: luxuryImage,
              title:
                foreverFavoritesSection.content.luxurySkincare?.title ||
                "LUXURY SKINCARE",
              buttonText:
                foreverFavoritesSection.content.luxurySkincare?.buttonText ||
                "SHOP NOW",
            },
            naturalBeauty: {
              image: naturalImage,
              title:
                foreverFavoritesSection.content.naturalBeauty?.title ||
                "NATURAL BEAUTY",
              buttonText:
                foreverFavoritesSection.content.naturalBeauty?.buttonText ||
                "SHOP NOW",
            },
          });
        }

        // Extract Natural Beauty from natural_beauty section
        const naturalBeautySection = sections.find(
          (s: any) => s.section_type === "natural_beauty",
        );
        if (naturalBeautySection && naturalBeautySection.content) {
          setNaturalBeauty({
            image: naturalBeautySection.content.image
              ? normalizeUrl(naturalBeautySection.content.image)
              : "",
            title: naturalBeautySection.content.title || "NATURAL BEAUTY",
            subtitle:
              naturalBeautySection.content.subtitle || "ELEVATE YOUR SKIN WITH",
            description:
              naturalBeautySection.content.description ||
              "infused with premium natural ingredients",
            buttonText: naturalBeautySection.content.buttonText || "SHOP NOW",
            buttonLink: naturalBeautySection.content.buttonLink || "/shop",
          });
        }

        // Extract Scrolling Text Banner from scrolling_text_banner section
        const scrollingTextSection = sections.find(
          (s: any) => s.section_type === "scrolling_text_banner",
        );
        if (
          scrollingTextSection &&
          scrollingTextSection.content &&
          scrollingTextSection.content.text
        ) {
          setScrollingText(scrollingTextSection.content.text);
        }

        // Extract WhatsApp Subscription from whatsappsubscription section
        const whatsappSection = sections.find(
          (s: any) => s.section_type === "whatsappsubscription",
        );
        if (whatsappSection && whatsappSection.content) {
          setWhatsappSubscription({
            image: whatsappSection.content.image
              ? normalizeUrl(whatsappSection.content.image)
              : "/IMAGES/BANNER (1).webp",
            logo: whatsappSection.content.logo
              ? normalizeUrl(whatsappSection.content.logo)
              : "",
            heading:
              whatsappSection.content.heading || "Join The NEFOL® Circle",
            description:
              whatsappSection.content.description ||
              "Stay ahead with exclusive style drops, member-only offers, and insider fashion updates.",
            footer:
              whatsappSection.content.footer ||
              "By subscribing, you agree to receive WhatsApp messages from NEFOL®.",
            logoName: whatsappSection.content.logoName || "NEFOL®",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch CMS sections:", error);
    }
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      const data = await api.videos.getAll();
      setVideos(data);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    Promise.allSettled([
      fetchTopMediaCarousel(),
      fetchHeroBanner(),
      fetchCMSSections(),
      fetchVideos(),
    ]);
  }, []);

  // Auto-rotate top media carousel
  useEffect(() => {
    if (topMediaImages.length === 0) return;
    if (!topMediaSettings.autoPlay) return;

    const id = window.setInterval(() => {
      setTopMediaIndex((prev) => {
        if (topMediaSettings.loop) {
          return (prev + 1) % topMediaImages.length;
        } else {
          return prev < topMediaImages.length - 1 ? prev + 1 : prev;
        }
      });
    }, topMediaSettings.autoPlayDelay || 7000);

    return () => window.clearInterval(id);
  }, [
    topMediaImages.length,
    topMediaSettings.autoPlay,
    topMediaSettings.autoPlayDelay,
    topMediaSettings.loop,
  ]);

  // Auto-rotate hero images
  useEffect(() => {
    if (heroImages.length === 0) return;
    if (!heroSettings.autoPlay) return;

    const id = window.setInterval(() => {
      setHeroIndex((prev) => {
        if (heroSettings.loop) {
          return (prev + 1) % heroImages.length;
        } else {
          return prev < heroImages.length - 1 ? prev + 1 : prev;
        }
      });
    }, heroSettings.autoPlayDelay || 7000);

    return () => window.clearInterval(id);
  }, [
    heroImages.length,
    heroSettings.autoPlay,
    heroSettings.autoPlayDelay,
    heroSettings.loop,
  ]);

  // Subscription modal (appears 5s after landing, only if not dismissed before)
  useEffect(() => {
    const hasDismissedSubscription = localStorage.getItem(
      "nefol-subscription-dismissed",
    );
    if (!hasDismissedSubscription) {
      const id = window.setTimeout(() => setShowSubscriptionModal(true), 5000);
      return () => window.clearTimeout(id);
    }
  }, []);

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    localStorage.setItem("nefol-subscription-dismissed", "true");
  };

  // Get featured products (all products excluding COMBO category)
  const allFeaturedProducts = products.filter((product) => {
    const category = (product.category || "").toLowerCase();
    return (
      category !== "combo" &&
      category !== "combo pack" &&
      !category.includes("combo")
    );
  });

  // Get 4 products to display based on current index
  const productsPerPage = 4;
  const maxIndex = Math.max(
    0,
    Math.ceil(allFeaturedProducts.length / productsPerPage) - 1,
  );
  const currentIndex = Math.min(justLandedIndex, maxIndex);
  const featuredProducts = allFeaturedProducts.slice(
    currentIndex * productsPerPage,
    (currentIndex + 1) * productsPerPage,
  );

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  const handlePrevious = () => {
    setJustLandedIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setJustLandedIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <main
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "var(--font-body-family, Inter, sans-serif)" }}
    >
      <style>{`
        :root {
          --arctic-blue-primary: rgb(75,151,201);
          --arctic-blue-primary-hover: rgb(60,120,160);
          --arctic-blue-primary-dark: rgb(50,100,140);
          --arctic-blue-light: #E0F5F5;
          --arctic-blue-lighter: #F0F9F9;
          --arctic-blue-background: #F4F9F9;
        }
      `}</style>
      {/* Modern Carousel Slider */}
      <section className="relative w-full bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ height: '500px' }}>
            {/* Carousel Images */}
            {topMediaImages.map((image, index) => {
              const slides = [
                {
                  image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1920",
                  title: "Premium Headphones",
                  subtitle: "Experience Crystal Clear Sound",
                },
                {
                  image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1920",
                  title: "Latest Collection",
                  subtitle: "Latest Collection 2024",
                },
                {
                  image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=1920",
                  title: "Sport Collection",
                  subtitle: "Run Faster, Jump Higher",
                },
                {
                  image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=1920",
                  title: "Gaming Gear",
                  subtitle: "Level Up Your Game",
                },
                {
                  image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1920",
                  title: "Smart Devices",
                  subtitle: "Technology Meets Style",
                },
              ];

              const slide = slides[index % slides.length];
              
              // Different gradient colors for each slide
              const gradientColors = [
                'from-purple-600/0 to-blue-600/0 hover:from-purple-600/70 hover:to-blue-600/70', // Headphones
                'from-orange-500/0 to-pink-600/0 hover:from-orange-500/70 hover:to-pink-600/70', // Products
                'from-green-500/0 to-teal-600/0 hover:from-green-500/70 hover:to-teal-600/70', // Shoes
                'from-red-600/0 to-purple-600/0 hover:from-red-600/70 hover:to-purple-600/70', // Gaming
                'from-blue-600/0 to-indigo-700/0 hover:from-blue-600/70 hover:to-indigo-700/70', // Smart Devices
              ];
              
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out group ${
                    index === topMediaIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                >
                  {/* Background Image */}
                  <img
                    src={slide.image}
                    alt={slide.title || `Slide ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = image;
                    }}
                  />
                  
                  {/* Dark Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-black/30" />
                  
                  {/* Colored Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} transition-all duration-500`} />

                  {/* Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4 max-w-3xl">
                      {slide.title && (
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-2xl">
                          {slide.title}
                        </h2>
                      )}
                      <p className="text-xl sm:text-2xl md:text-3xl opacity-95 drop-shadow-lg font-light">
                        {slide.subtitle}
                      </p>
                      <button 
                        onClick={() => window.location.hash = '#/user/shop'}
                        className="mt-8 bg-yellow-500 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                      >
                        SHOP NOW
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Previous Button */}
            <button
              onClick={() => {
                setTopMediaIndex((prev) => 
                  prev === 0 ? topMediaImages.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-10 group"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6 text-gray-800 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={() => {
                setTopMediaIndex((prev) => 
                  prev === topMediaImages.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-10 group"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6 text-gray-800 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {topMediaImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setTopMediaIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === topMediaIndex
                      ? 'w-8 h-3 bg-white shadow-md'
                      : 'w-3 h-3 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Section with Featured Products and Hot Deals */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Banner - Promotional Slider */}
            <PromotionalBanner />

            {/* Right Column - Watch and Hot Deals */}
            <div className="space-y-6">
              {/* Smartwatch Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 p-6 shadow-xl h-48">
                <div className="relative z-10">
                  <h3 className="text-white text-2xl font-bold mb-2">
                    ZEBLAZE 3
                  </h3>
                  <p className="text-white text-sm mb-4 opacity-90">
                    SmartWatches Pro
                  </p>
                  <button 
                    onClick={() => window.location.hash = '#/user/shop'}
                    className="bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300"
                  >
                    SHOP NOW →
                  </button>
                </div>
                
                {/* Watch Image */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32">
                  <img
                    src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400"
                    alt="Smartwatch"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>
              </div>

              {/* Hot Deals Section */}
              <HotDealsCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ==================Hot Deals======================= */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <h1
          className="text-5xl sm:text-5xl text-[white] font-normal text-center"
          style={{ fontFamily: "'Great Vibes', cursive", textAlign:"center", marginRight:"2vh", backgroundColor:"#4f8fb8", padding:"4vh", borderRadius:"2vh"}}
        >
          Hot Deals <br/> will be end soon

        </h1>
        <HotDeals productIndex={0} />
        <HotDeals productIndex={1} />
        <HotDeals productIndex={2} />
      </div>


      {/* What's Just Landed Section - neudeskin.com style */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-light mb-12 sm:mb-16 text-center tracking-[0.15em]"
            style={{
              color: "#1a1a1a",
              fontFamily: "var(--font-heading-family)",
              letterSpacing: "0.15em",
            }}
          >
            What's Just Landed
          </h2>

          {productsLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Navigation Buttons */}
              {allFeaturedProducts.length > productsPerPage && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      canGoPrevious
                        ? "bg-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer"
                        : "bg-gray-200 cursor-not-allowed opacity-50"
                    }`}
                    style={{
                      backgroundColor: canGoPrevious ? "#fff" : "#e5e7eb",
                      color: canGoPrevious ? "#1a1a1a" : "#9ca3af",
                    }}
                    aria-label="Previous products"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      canGoNext
                        ? "bg-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer"
                        : "bg-gray-200 cursor-not-allowed opacity-50"
                    }`}
                    style={{
                      backgroundColor: canGoNext ? "#fff" : "#e5e7eb",
                      color: canGoNext ? "#1a1a1a" : "#9ca3af",
                    }}
                    aria-label="Next products"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {featuredProducts.map((product, index) => {
                  const slug = product.slug || "";
                  // Use database stats if available, otherwise fallback to static
                  const dbStats = reviewStats[slug];
                  const rating =
                    dbStats?.average_rating > 0
                      ? dbStats.average_rating
                      : getProductRating(slug);
                  const reviewCount =
                    dbStats?.review_count > 0
                      ? dbStats.review_count
                      : getProductReviewCount(slug);
                  const hasVerified =
                    dbStats?.verified_count > 0 || hasVerifiedReviews(slug);
                  // Calculate global index in the full product list
                  const globalIndex = currentIndex * productsPerPage + index;
                  const isBestSeller = globalIndex < 4; // Only first 4 products overall are best sellers
                  const isSoldOut = false; // You can add logic to check stock

                  return (
                    <div
                      key={product.slug || index}
                      className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-18 transition-all duration-300 hover:shadow-xl hover:border-[#4b97c9] overflow-hidden cursor-pointer"
                      onClick={() => window.location.hash = `#/user/product/${product.slug}`}
                    >
                      {/* HOVER ICONS */}
                      <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                        {/* Eye Icon */}
                        <a
                          href={`#/user/product/${product.slug}`}
                          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition"
                        >
                          <Eye className="w-5 h-5 text-gray-700" />
                        </a>

                        {/* Heart Icon */}
                        <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition">
                          <Heart className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>

                      {/* IMAGE AREA */}
                      <div className="relative bg-white rounded-2xl overflow-hidden mb-8">
                        {/* NEW BADGE */}
                        <span className="absolute top-4 left-4 bg-teal-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md z-10">
                          New
                        </span>

                        {/* SALE BADGE */}
                        {/* {product.comparePrice && (
                          <span className="absolute top-4 left-20 bg-red-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md z-10">
                            On Sale!
                          </span>
                        )} */}

                        <a href={`#/user/product/${product.slug}`}>
                          <div className="h-72 flex items-center justify-center p-8">
                            {product.listImage ? (
                              <img
                                src={product.listImage}
                                alt={product.title}
                                className="max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                  const fallbackImages = [
                                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
                                    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=400",
                                    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
                                    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400",
                                    "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?auto=format&fit=crop&q=80&w=400",
                                    "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400",
                                  ];
                                  e.currentTarget.src = fallbackImages[index % fallbackImages.length];
                                }}
                              />
                            ) : (
                              <img
                                src={`https://images.unsplash.com/photo-${['1620916566398-39f1143ab7be', '1556228578-8c89e6adf883', '1571019613454-1cb2f99b2d8b', '1598440947619-2c35fc9aa908', '1570554886111-e80fcca6a029', '1612817288484-6f916006741a'][index % 6]}?auto=format&fit=crop&q=80&w=400`}
                                alt={product.title}
                                className="max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            )}
                          </div>
                        </a>

                        {/* HOVER ADD TO CART */}
                        {!isSoldOut && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300">
                            <button className="bg-yellow-500 text-gray-900 mx-15 px-5 py-3 rounded-lg text-sm font-semibold shadow-lg hover:bg-yellow-400 transition">
                              Add To Cart
                            </button>
                          </div>
                        )}
                      </div>

                      {/* BRAND */}
                      <p className="text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-2">
                        BRAND {index + 1}
                      </p>

                      {/* TITLE */}
                      <a href={`#/user/product/${product.slug}`}>
                        <h3 className="text-[17px] font-semibold text-center mb-4 text-gray-800 hover:opacity-70 transition">
                          {product.title}
                        </h3>
                      </a>

                      {/* RATING */}
                      {rating > 0 && (
                        <div className="flex justify-center items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => {
                            const filled = i < Math.round(rating);
                            return (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  filled
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* PRICE */}
                      <div className="flex justify-center items-center gap-2">
                        {/* {product.comparePrice && (
                          <span className="text-gray-400 line-through text-sm">
                            ₹{product.comparePrice}
                          </span>
                        )} */}

                        <span className="text-red-500 font-semibold text-lg">
                          ₹{product.price}
                        </span>

                        {/* {product.comparePrice && (
                          <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-md font-semibold">
                            -20%
                          </span>
                        )} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white relative overflow-hidden">
        {/* Curve Effect at top */}
        <div
          className="absolute top-0 left-0 w-full h-12 sm:h-16 md:h-20"
          style={{
            background:
              "linear-gradient(to bottom, var(--arctic-blue-background) 0%, var(--arctic-blue-background) 50%, white 100%)",
            clipPath: "ellipse(100% 100% at 50% 0%)",
            transform: "scaleY(-1)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
  className="text-7xl font-normal mb-12 mt-12 sm:mb-16 text-center tracking-normal"
  style={{
    color: "#5999cd",
    fontFamily: "'Great Vibes', cursive",
    letterSpacing: "normal",
  }}
>
  Shop by Category
</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-6">
            {/* Body */}
            <div
              className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-4 sm:p-[18px] transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer"
              onClick={() => (window.location.hash = "#/user/body")}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden mb-6 sm:mb-8">
                <div className="h-48 sm:h-72 flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={categoryImages["Body"] || "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=400"}
                    alt="Body"
                    className="max-h-36 sm:max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>
              </div>
              <p className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-1 sm:mb-2">
                CATEGORY
              </p>
              <h3 className="text-[15px] sm:text-[17px] font-semibold text-center mb-2 sm:mb-4 text-gray-800 transition">
                Body
              </h3>
            </div>

            {/* Face */}
            <div
              className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-4 sm:p-[18px] transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer"
              onClick={() => (window.location.hash = "#/user/face")}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden mb-6 sm:mb-8">
                <div className="h-48 sm:h-72 flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={categoryImages["Face"] || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400"}
                    alt="Face"
                    className="max-h-36 sm:max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>
              </div>
              <p className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-1 sm:mb-2">
                CATEGORY
              </p>
              <h3 className="text-[15px] sm:text-[17px] font-semibold text-center mb-2 sm:mb-4 text-gray-800 transition">
                Face
              </h3>
            </div>

            {/* Hair */}
            <div
              className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-4 sm:p-[18px] transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer"
              onClick={() => (window.location.hash = "#/user/hair")}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden mb-6 sm:mb-8">
                <div className="h-48 sm:h-72 flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={categoryImages["Hair"] || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=400"}
                    alt="Hair"
                    className="max-h-36 sm:max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>
              </div>
              <p className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-1 sm:mb-2">
                CATEGORY
              </p>
              <h3 className="text-[15px] sm:text-[17px] font-semibold text-center mb-2 sm:mb-4 text-gray-800 transition">
                Hair
              </h3>
            </div>

            {/* Combos */}
            <div
              className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-4 sm:p-[18px] transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer"
              onClick={() => (window.location.hash = "#/user/combos")}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden mb-6 sm:mb-8">
                <div className="h-48 sm:h-72 flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={categoryImages["Combos"] || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400"}
                    alt="Combos"
                    className="max-h-36 sm:max-h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>
              </div>
              <p className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-1 sm:mb-2">
                CATEGORY
              </p>
              <h3 className="text-[15px] sm:text-[17px] font-semibold text-center mb-2 sm:mb-4 text-gray-800 transition">
                Combos
              </h3>
            </div>
          </div>
        </div>

        {/* Curve Effect at bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-12 sm:h-16 md:h-20"
          style={{
            background:
              "linear-gradient(to top, white 0%, white 50%, var(--arctic-blue-background) 100%)",
            clipPath: "ellipse(100% 100% at 50% 100%)",
          }}
        />
      </section>

      {/* Latest Blogs Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Latest Blogs</h2>
            <div className="flex gap-2">
              <button 
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 shadow-md flex items-center justify-center transition-all duration-300"
                aria-label="Previous blogs"
                onClick={() => window.location.hash = '#/user/blog'}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 shadow-md flex items-center justify-center transition-all duration-300"
                aria-label="Next blogs"
                onClick={() => window.location.hash = '#/user/blog'}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Blog Cards Grid */}
          {blogLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogPosts.map((post) => {
                const postImage = post.images && post.images.length > 0 
                  ? post.images[0] 
                  : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400';
                
                const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div 
                    key={post.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
                    onClick={() => window.location.hash = `#/user/blog/${post.id}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <span className="absolute top-3 left-3 bg-white text-gray-900 text-xs font-semibold px-3 py-1 rounded-full z-10">
                        {post.featured ? 'FEATURED' : 'MARKETPLACE'}
                      </span>
                      <img
                        src={postImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span>📅 {postDate}</span>
                        <span>•</span>
                        <span>✍️ {post.author_name || 'Anonymous'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt || post.content?.substring(0, 100) + '...'}
                      </p>
                      <button 
                        className="text-gray-900 text-sm font-semibold hover:text-yellow-600 flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.hash = `#/user/blog/${post.id}`;
                        }}
                      >
                        Read more
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No blog posts available yet.</p>
              <button
                onClick={() => window.location.hash = '#/user/blog'}
                className="mt-4 text-gray-900 hover:text-yellow-600 font-semibold"
              >
                Visit Blog Page
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Nefol Collection Section */}
      {nefolCollection.image && (
        <section className="py-12 sm:py-16 md:py-20 bg-white relative overflow-hidden">
          {/* Curve Effect at top */}
          <div
            className="absolute top-0 left-0 w-full h-12 sm:h-16 md:h-20"
            style={{
              background:
                "linear-gradient(to bottom, var(--arctic-blue-background) 0%, var(--arctic-blue-background) 50%, white 100%)",
              clipPath: "ellipse(100% 100% at 50% 0%)",
              transform: "scaleY(-1)",
            }}
          />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
              <div className="relative rounded-xl overflow-hidden w-full">
                <img
                  src={nefolCollection.image}
                  alt="Nefol Collection"
                  className="w-full h-auto rounded-xl"
                  style={{
                    display: "block",
                    objectFit: "contain",
                    objectPosition: "center",
                    maxWidth: "100%",
                    height: "auto",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1608248593842-8021c6b12d5d?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
              <div className="text-left">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6 tracking-[0.15em]"
                  style={{
                    color: "#1a1a1a",
                    fontFamily: "var(--font-heading-family)",
                    letterSpacing: "0.15em",
                  }}
                >
                  {nefolCollection.title}
                </h2>
                <h3
                  className="text-base sm:text-lg font-light mb-4 sm:mb-6 tracking-wide"
                  style={{ color: "#666", letterSpacing: "0.05em" }}
                >
                  {nefolCollection.subtitle}
                </h3>
                <p
                  className="text-sm sm:text-base font-light mb-8 sm:mb-10 leading-relaxed"
                  style={{ color: "#666", letterSpacing: "0.02em" }}
                >
                  {nefolCollection.description}
                </p>
                <button
                  onClick={() =>
                    (window.location.hash = `#/user${nefolCollection.buttonLink || "/shop"}`)
                  }
                  className="px-6 sm:px-8 py-3 text-white font-medium transition-all duration-300 text-xs sm:text-sm tracking-wide uppercase rounded-xl"
                  style={{ backgroundColor: "var(--arctic-blue-primary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--arctic-blue-primary-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--arctic-blue-primary)";
                  }}
                >
                  {nefolCollection.buttonText}
                </button>
              </div>
            </div>
          </div>

          {/* Curve Effect at bottom */}
          <div
            className="absolute bottom-0 left-0 w-full h-12 sm:h-16 md:h-20"
            style={{
              background:
                "linear-gradient(to top, white 0%, white 50%, var(--arctic-blue-background) 100%)",
              clipPath: "ellipse(100% 100% at 50% 100%)",
            }}
          />
        </section>
      )}

      {/* Forever Favorites Section */}
      {(foreverFavorites.luxurySkincare.image ||
        foreverFavorites.naturalBeauty.image) && (
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 tracking-[0.15em]"
                style={{
                  color: "#1a1a1a",
                  fontFamily: "var(--font-heading-family)",
                  letterSpacing: "0.15em",
                }}
              >
                {foreverFavorites.title}
              </h2>
              <p
                className="text-sm sm:text-base font-light max-w-2xl mx-auto tracking-wide"
                style={{ color: "#666", letterSpacing: "0.05em" }}
              >
                {foreverFavorites.description}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {foreverFavorites.luxurySkincare.image && (
                <div
                  className="relative group cursor-pointer"
                  onClick={() => (window.location.hash = "#/user/shop")}
                >
                  <img
                    src={foreverFavorites.luxurySkincare.image}
                    alt="Luxury Skincare"
                    className="w-full h-64 sm:h-80 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1615397323226-f7035ce4c94f?auto=format&fit=crop&q=80&w=600";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3
                      className="text-white text-lg sm:text-xl font-light tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-heading-family)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {foreverFavorites.luxurySkincare.title}
                    </h3>
                  </div>
                </div>
              )}
              {foreverFavorites.naturalBeauty.image && (
                <div
                  className="relative group cursor-pointer"
                  onClick={() => (window.location.hash = "#/user/shop")}
                >
                  <img
                    src={foreverFavorites.naturalBeauty.image}
                    alt="Natural Beauty"
                    className="w-full h-64 sm:h-80 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=600";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3
                      className="text-white text-lg sm:text-xl font-light tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-heading-family)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {foreverFavorites.naturalBeauty.title}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Promotional Banners Section - Before Footer */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nike Zoom Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 p-8 sm:p-10 shadow-xl h-[250px] group">
              <div className="relative z-10 h-full flex flex-col justify-center">
                <p className="text-white text-sm font-medium mb-2 uppercase tracking-wide opacity-90">
                  Up To 50% Off
                </p>
                <h2 className="text-white text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                  Nike Zoom Winflo<br />7 Premium
                </h2>
                <button 
                  onClick={() => window.location.hash = '#/user/shop'}
                  className="self-start bg-yellow-500 text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  SHOP NOW
                </button>
              </div>
              
              {/* Shoe Image */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800"
                  alt="Nike Zoom Winflo"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
            </div>

            {/* Samsung Galaxy Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-10 shadow-xl h-[250px] group">
              <div className="relative z-10 h-full flex flex-col justify-center">
                <p className="text-white text-sm font-medium mb-2 uppercase tracking-wide opacity-90">
                  Offering Smartphones
                </p>
                <h2 className="text-white text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                  Samsung Galaxy<br />At Smart Price!
                </h2>
                <button 
                  onClick={() => window.location.hash = '#/user/shop'}
                  className="self-start bg-yellow-500 text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  SHOP NOW
                </button>
              </div>
              
              {/* Phone Image */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&q=80&w=800"
                  alt="Samsung Galaxy"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
        image={whatsappSubscription.image}
        logo={whatsappSubscription.logo}
        logoName={whatsappSubscription.logoName}
        heading={whatsappSubscription.heading}
        description={whatsappSubscription.description}
        footer={whatsappSubscription.footer}
      />
    </main>
  );
}