import React, { useState, useEffect, useMemo } from 'react'
import { getApiBase } from '../utils/apiBase'
import { Heart, Package } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import PricingDisplay from '../components/PricingDisplay'
import { getProductRating, getProductReviewCount, hasVerifiedReviews } from '../utils/product_reviews'
import { useProductReviewStats } from '../hooks/useProductReviewStats'
import VerifiedBadge from '../components/VerifiedBadge'
import WishlistButton from '../components/WishlistButton'

interface Product {
  id?: number
  slug: string
  title: string
  category: string
  price: string
  list_image: string
  description: string
  created_at?: string
  details?: {
    mrp?: string
    websitePrice?: string
    discountPercent?: string
    productType?: string
    [key: string]: any
  }
}

export default function Face() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Product[]>([])
  const [csvProducts, setCsvProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  
  // Get all product slugs for batch fetching review stats
  const allProductSlugs = useMemo(() => {
    return [...products, ...combos].map(p => p.slug || '').filter(slug => slug)
  }, [products, combos])
  
  // Fetch review stats for all products
  const { stats: reviewStats } = useProductReviewStats(allProductSlugs)

  useEffect(() => {
    fetchProducts()
    fetchCsvProducts()
  }, [])

  const fetchCsvProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products-csv`)
      if (response.ok) {
        const data = await response.json()
        setCsvProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch CSV products:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/api/products`)
      if (response.ok) {
        const data = await response.json()
        // Filter products for face category - ONLY show products tagged as Face Care
        const faceProducts = data.filter((product: any) => {
          const category = (product.category || '').toLowerCase()
          return category === 'face care' || category === 'facecare'
        })
        setProducts(faceProducts)

        // Filter combos related to face
        const faceCombos = data.filter((product: any) => {
          const category = (product.category || '').toLowerCase()
          const title = (product.title || '').toLowerCase()
          const productType = (product.details?.productType || '').toLowerCase()
          
          // Check if it's a combo
          if (category !== 'combo' && category !== 'combo pack') return false
          
          // Check if it's face-related
          return title.includes('face') || 
                 title.includes('glow') ||
                 title.includes('radiance') ||
                 title.includes('hydration') ||
                 title.includes('deep clean') ||
                 title.includes('acne') ||
                 productType === 'face' ||
                 productType === 'acne'
        })
        setCombos(faceCombos)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to create simplified product data from CSV for listings
  const getSimplifiedProductData = (csvProduct: any) => {
    return {
      slug: csvProduct['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
      title: csvProduct['Product Name'] || '',
      brand: csvProduct['Brand Name'] || 'NEFOL',
      mrp: csvProduct['MRP '] || csvProduct['MRP'] || '',
      websitePrice: csvProduct['website price'] || '',
      category: 'Face Care'
    }
  }

  return (
    <main className="py-12 sm:py-16 md:py-20 min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-light mb-6 tracking-[0.15em]" 
            style={{
              color: '#1a1a1a',
              fontFamily: 'var(--font-heading-family)',
              letterSpacing: '0.15em'
            }}
          >
            Face Care
          </h1>
          <p className="text-sm sm:text-base font-light max-w-2xl mx-auto tracking-wide" style={{ color: '#666', letterSpacing: '0.05em' }}>
            Discover our range of natural face care products designed to enhance your natural beauty.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10 md:gap-12 auto-rows-fr mb-16">
          {loading ? (
            <div className="col-span-full text-center py-20">
              <p className="text-sm font-light tracking-wide" style={{color: '#999', letterSpacing: '0.1em'}}>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="rounded-2xl p-12" style={{ backgroundColor: '#D0E8F2' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgb(75,151,201)' }}>
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: '#1B4965' }}>
                  Coming Soon!
                </h3>
                <p className="text-xl mb-6" style={{ color: '#9DB4C0' }}>
                  We're working on amazing face care products for you.
                </p>
                <div className="bg-white rounded-lg p-6 inline-block">
                  <p className="text-lg font-semibold" style={{ color: '#1B4965' }}>
                    🚀 Upcoming Very Soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            products.map((product, index) => {
              return (
                <article 
                  key={product.slug || index} 
                  className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-18 transition-all duration-300 hover:shadow-xl hover:border-[#4b97c9] overflow-hidden"
                >
                  {/* HOVER ICONS */}
                  <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                    <a
                      href={`#/user/product/${product.slug}`}
                      className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition"
                    >
                      <Heart className="w-5 h-5 text-gray-700" />
                    </a>
                  </div>

                  <div className="relative bg-white rounded-2xl overflow-hidden mb-8">
                    {/* NEW BADGE */}
                    <span className="absolute top-4 left-4 bg-teal-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md z-10">
                      New
                    </span>
                    <a href={`#/user/product/${product.slug}`}>
                      <div className="h-72 flex items-center justify-center p-8">
                        {product.list_image ? (
                          <img 
                            src={product.list_image}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }} 
                            alt={product.title}
                            className="max-h-56 object-contain transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </a>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (addItem) {
                            try {
                              addItem({
                                slug: product.slug,
                                title: product.title,
                                price: product.price,
                                listImage: product.list_image,
                                pdpImages: [],
                                category: product.category,
                                description: product.description
                              })
                            } catch (error) {
                              console.log('Authentication required for cart operation')
                            }
                          }
                        }}
                        className="bg-blue-600 text-white mx-15 px-5 py-3 rounded-full text-sm font-semibold shadow-lg hover:bg-blue-400 transition"
                      >
                        Add To Cart
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-2">
                    BRAND {index + 1}
                  </p>

                  <a href={`#/user/product/${product.slug}`} className="block">
                    <h3 className="text-[17px] font-semibold text-center mb-4 text-gray-800 hover:opacity-70 transition">
                      {product.title}
                    </h3>
                  </a>

                  {/* Subtitle */}
                  {(() => {
                    const csvMatch = csvProducts.find((csv: any) => {
                      const csvSlug = csv['Slug'] || csv['Product Name']?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
                      return csvSlug === product.slug
                    })
                    const subtitle = csvMatch?.['Subtitle / Tagline'] || 
                                     (product.details && typeof product.details === 'object' ? product.details.subtitle : null) ||
                                     (product.details && typeof product.details === 'string' ? JSON.parse(product.details)?.subtitle : null)
                    return subtitle ? (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2 text-center" style={{color: '#666', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                        {subtitle}
                      </p>
                    ) : null
                  })()}

                  {(() => {
                    const rating = getProductRating(product.slug || '')
                    const reviewCount = getProductReviewCount(product.slug || '')
                    if (rating > 0) {
                      return (
                        <div className="flex justify-center items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => {
                            const filled = i < Math.round(rating)
                            return (
                              <svg key={i} className={`w-4 h-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )
                          })}
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="flex justify-center items-center gap-2">
                    <PricingDisplay 
                      product={product} 
                      csvProduct={undefined}
                    />
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Face Combos Section */}
        {combos.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 tracking-[0.15em]" 
                style={{
                  color: '#1a1a1a',
                  fontFamily: 'var(--font-heading-family)',
                  letterSpacing: '0.15em'
                }}
              >
                Face Care Combos
              </h2>
              <p className="text-sm sm:text-base font-light max-w-2xl mx-auto tracking-wide" style={{ color: '#666', letterSpacing: '0.05em' }}>
                Complete skincare routines in curated combo packs. Get the perfect combination of products for glowing, healthy skin.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10 md:gap-12 auto-rows-fr">
              {combos.map((combo, index) => (
                <article 
                  key={combo.slug || index} 
                  className="group relative bg-[#f7f7f7] border border-gray-200 rounded-3xl p-18 transition-all duration-300 hover:shadow-xl hover:border-[#4b97c9] overflow-hidden"
                >
                  {/* HOVER ICONS */}
                  <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                    <a
                      href={`#/user/product/${combo.slug}`}
                      className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition"
                    >
                      <Heart className="w-5 h-5 text-gray-700" />
                    </a>
                  </div>

                  <div className="relative bg-white rounded-2xl overflow-hidden mb-8">
                    {/* COMBO BADGE */}
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md z-10">
                      Combo Offer
                    </span>
                    <a href={`#/user/product/${combo.slug}`}>
                      <div className="h-72 flex items-center justify-center p-8">
                        {combo.list_image ? (
                          <img 
                            src={combo.list_image}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }} 
                            alt={combo.title}
                            className="max-h-56 object-contain transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </a>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (addItem) {
                            try {
                              addItem({
                                slug: combo.slug,
                                title: combo.title,
                                price: combo.price || combo.details?.websitePrice || '₹1,299',
                                listImage: combo.list_image,
                                pdpImages: [],
                                category: combo.category,
                                description: combo.description || 'Premium combo pack'
                              })
                            } catch (error) {
                              console.log('Authentication required for cart operation')
                            }
                          }
                        }}
                        className="bg-blue-600 text-white mx-15 px-5 py-3 rounded-full text-sm font-semibold shadow-lg hover:bg-blue-400 transition"
                      >
                        Add To Cart
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.25em] text-center mb-2">
                    BRAND {index + 1}
                  </p>

                  <a href={`#/user/product/${combo.slug}`} className="block">
                    <h3 className="text-[17px] font-semibold text-center mb-4 text-gray-800 hover:opacity-70 transition">
                      {combo.title}
                    </h3>
                  </a>

                  {(() => {
                    const slug = combo.slug || ''
                    const dbStats = reviewStats[slug]
                    const rating = dbStats?.average_rating > 0 ? dbStats.average_rating : getProductRating(slug)
                    
                    if (rating > 0) {
                      return (
                        <div className="flex justify-center items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => {
                            const filled = i < Math.round(rating)
                            return (
                              <svg key={i} className={`w-4 h-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )
                          })}
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="flex justify-center items-center gap-2">
                    <PricingDisplay 
                      product={combo} 
                      csvProduct={combo.details ? {
                        'MRP': combo.details.mrp || '',
                        'website price': combo.details.websitePrice || combo.price || ''
                      } : undefined}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center rounded-2xl p-12 text-white" style={{ backgroundColor: 'rgb(75,151,201)' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Glow?</h2>
          <p className="text-xl mb-8 opacity-90">
            Transform your skincare routine with Nefol's natural face care products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/user/shop" 
              className="inline-block bg-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors" style={{ color: '#4B97C9' }}
            >
              Shop Face Care
            </a>
            <a 
              href="#/user/contact" 
              className="inline-block border-2 border-white px-8 py-3 rounded-xl font-semibold hover:bg-white transition-colors" style={{ color: 'white' }}
            >
              Get Skincare Advice
            </a>
          </div>
        </div>
      </div>
    </main>
  )
} 