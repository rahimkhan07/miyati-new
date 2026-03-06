import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Menu, X, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react'
import SplashScreen from './components/SplashScreen'
import CartIcon from './components/CartIcon'
import ProfileAvatar from './components/ProfileAvatar'
import { useCart } from './contexts/CartContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WishlistProvider, useWishlist } from './contexts/WishlistContext'
import { CartProvider } from './contexts/CartContext'
import { userSocketService } from './services/socket'
import LiveChatWidget from './components/LiveChatWidget'
import SmoothScroll from './components/SmoothScroll'
import SearchButton from './components/SearchButton'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import BottomNavigation from './components/BottomNavigation'
import SwipeNavigation from './components/SwipeNavigation'

// Lazy load all pages for code splitting
const LoginPage = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const NefolCoins = lazy(() => import('./pages/NefolCoins'))
const CoinWithdrawal = lazy(() => import('./pages/CoinWithdrawal'))
const UserOrders = lazy(() => import('./pages/UserOrders'))
const SavedCards = lazy(() => import('./pages/SavedCards'))
const ManageAddress = lazy(() => import('./pages/ManageAddress'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const CancelOrder = lazy(() => import('./pages/CancelOrder'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const FAQ = lazy(() => import('./pages/FAQ'))
const BlueTeaBenefits = lazy(() => import('./pages/BlueTeaBenefits'))
const USP = lazy(() => import('./pages/USP'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Face = lazy(() => import('./pages/Face'))
const Body = lazy(() => import('./pages/Body'))
const Hair = lazy(() => import('./pages/Hair'))
const Orders = lazy(() => import('./pages/Orders'))
const Account = lazy(() => import('./pages/Account'))
const Community = lazy(() => import('./pages/Community'))
const Notifications = lazy(() => import('./pages/Notifications'))
const PrivacySecurity = lazy(() => import('./pages/PrivacySecurity'))
const PaymentMethods = lazy(() => import('./pages/PaymentMethods'))
const LoyaltyRewards = lazy(() => import('./pages/LoyaltyRewards'))
const Combos = lazy(() => import('./pages/Combos'))
const Cart = lazy(() => import('./pages/Cart'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'))

function AppContent() {
  const { items: cartItems } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [affiliateId, setAffiliateId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  // Use separate state for desktop & mobile "Collections" dropdown
  const [showDesktopCollections, setShowDesktopCollections] = useState(false)
  const [showMobileCollections, setShowMobileCollections] = useState(false)
  const [cartToast, setCartToast] = useState<{ message: string; id: number } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const desktopCollectionsRef = useRef<HTMLDivElement>(null)


  // Capture referral parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refParam = urlParams.get('ref')
    if (refParam) {
      console.log('🎯 Referral link detected:', refParam)
      setAffiliateId(refParam)
      // Store in localStorage for persistence across page navigation
      localStorage.setItem('affiliate_ref', refParam)
    } else {
      // Check if we have a stored affiliate ref
      const storedRef = localStorage.getItem('affiliate_ref')
      if (storedRef) {
        setAffiliateId(storedRef)
        console.log('🎯 Using stored affiliate ref:', storedRef)
      }
    }
  }, [])

  // Handle scroll for navbar shadow effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize socket connection for real-time updates
  useEffect(() => {
    console.log('🔌 Initializing user socket connection...')
    userSocketService.connect(user?.id?.toString())

    // Listen for real-time notifications
    const unsubscribeNotification = userSocketService.subscribe('notification', (data: any) => {
      console.log('📬 Notification received:', data)
      // You can add toast notification here
      if (data.message) {
        alert(`Notification: ${data.message}`)
      }
    })

    // Listen for cart sync
    const unsubscribeCartSync = userSocketService.subscribe('cart-sync', (data: any) => {
      console.log('🛒 Cart sync received:', data)
    })

    // Listen for order updates
    const unsubscribeOrderUpdate = userSocketService.subscribe('order-update', (data: any) => {
      console.log('📦 Order update received:', data)
      if (data.message) {
        alert(`Order Update: ${data.message}`)
      }
    })

    // Listen for product updates (when admin changes products)
    const unsubscribeProductUpdate = userSocketService.subscribe('products-updated', (data: any) => {
      console.log('🛍️ Product updated:', data)
      // Refresh product data if on product page
      window.dispatchEvent(new CustomEvent('product-updated', { detail: data }))
      // Also dispatch to refresh all pages
      window.dispatchEvent(new CustomEvent('refresh-products', { detail: data }))
    })

    // Also listen for the new event name
    const unsubscribeProductUpdateAlt = userSocketService.subscribe('product-updated', (data: any) => {
      console.log('🛍️ Product updated (alt):', data)
      window.dispatchEvent(new CustomEvent('product-updated', { detail: data }))
      window.dispatchEvent(new CustomEvent('refresh-products', { detail: data }))
    })

    // Listen for product creation
    const unsubscribeProductCreated = userSocketService.subscribe('products-created', (data: any) => {
      console.log('✨ New product created:', data)
      // Refresh product list
      window.dispatchEvent(new CustomEvent('product-created', { detail: data }))
    })

    // Listen for product deletion
    const unsubscribeProductDeleted = userSocketService.subscribe('products-deleted', (data: any) => {
      console.log('🗑️ Product deleted:', data)
      // Refresh product list
      window.dispatchEvent(new CustomEvent('product-deleted', { detail: data }))
    })

    // Listen for discount updates
    const unsubscribeDiscountUpdate = userSocketService.subscribe('discounts-updated', (data: any) => {
      console.log('💰 Discount updated:', data)
      window.dispatchEvent(new CustomEvent('discount-updated', { detail: data }))
    })

    // Listen for CMS updates (when admin updates homepage layout)
    const unsubscribeCMSUpdate = userSocketService.subscribe('cms-updated', (data: any) => {
      console.log('📝 CMS updated via socket:', data)
    })

    // Listen for cart add success events for lightweight toast
    const handleCartAdded = (event: Event) => {
      const custom = event as CustomEvent
      const title = custom.detail?.title as string | undefined
      const id = Date.now()
      setCartToast({
        message: title ? `“${title}” added to cart` : 'Item added to cart',
        id,
      })
      // Auto-hide after 4 seconds (only if still showing same toast) - increased for better visibility
      setTimeout(() => {
        setCartToast((prev) => (prev && prev.id === id ? null : prev))
      }, 4000)
    }

    window.addEventListener('cart:item-added', handleCartAdded)

    // Cleanup on unmount
    return () => {
      unsubscribeNotification()
      unsubscribeCartSync()
      unsubscribeOrderUpdate()
      unsubscribeProductUpdate()
      unsubscribeProductUpdateAlt()
      unsubscribeProductCreated()
      unsubscribeProductDeleted()
      unsubscribeDiscountUpdate()
      unsubscribeCMSUpdate()
      window.removeEventListener('cart:item-added', handleCartAdded)
    }
  }, [user])

  // Close desktop collections dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showDesktopCollections) return
      const target = event.target as Node | null
      if (desktopCollectionsRef.current && target && !desktopCollectionsRef.current.contains(target)) {
        setShowDesktopCollections(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDesktopCollections])

  // Update user ID when authentication changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      userSocketService.setUserId(user.id.toString())
    }
  }, [isAuthenticated, user])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect to search page with query
      window.location.hash = `#/user/search?q=${encodeURIComponent(searchQuery)}`
      setSearchQuery('')
      setShowSearch(false)
    }
  }


  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${showSplash ? 'overflow-hidden h-screen' : ''}`} style={{ backgroundColor: 'var(--color-screen-bg)', color: 'var(--color-text-secondary-on-teal)', fontFamily: 'var(--font-body-family)' }}>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <>
          <header
            className={`sticky top-0 z-50 w-full transition-shadow duration-300 ${isScrolled ? 'shadow-2xl' : 'shadow-md'}`}
            style={{
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              borderBottom: 'none',
            }}
          >
            {/* Top Bar */}
            <div className="flex h-16 sm:h-20 items-center justify-between relative w-full px-4 sm:px-6 md:px-8 lg:px-12 max-w-[1920px] mx-auto">
              {/* Mobile/Tablet Layout: Hamburger, Logo (centered), Account */}
              <div className="flex items-center gap-3 md:hidden">
                {/* Hamburger Menu */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="w-8 h-8 flex items-center justify-center transition-colors duration-300"
                  aria-label="Menu"
                  style={{ color: 'var(--color-text-secondary-on-teal)' }}
                >
                  {showMobileMenu ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              {/* Logo - Centered on mobile, left-aligned on desktop */}
              <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none flex-shrink-0 md:flex-none">
                <a
                  href="#/user/"
                  className="flex items-center justify-center md:justify-start"
                  aria-label="Go to homepage"
                >
                  {/* Mobile Logo */}
                  <img
                    src="/IMAGES/NEFOL wide.png"
                    alt="Nefol logo"
                    className="h-16 sm:h-20 w-auto object-contain md:hidden"
                    loading="eager"
                    style={{ maxWidth: '200px' }}
                  />
                  {/* Desktop Logo - Text Style */}
                  <span className="hidden md:block text-2xl font-bold tracking-wider" style={{ color: '#ffffff' }}>
                    MIYATI
                  </span>
                </a>
              </div>
              
              {/* Main Navigation - Premium Typography */}
              <nav
                className="hidden items-center gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 md:flex relative flex-wrap justify-center md:justify-start"
                style={{ maxWidth: '100%', overflow: 'visible' }}
              >
                <a
                  href="#/user/"
                  className="text-sm font-medium uppercase transition-colors duration-300 relative group whitespace-nowrap flex-shrink-0 hover:text-red-500"
                  style={{ color: '#ffffff' }}
                >
                  HOME
                </a>
                
                {/* Theme Features with HOT badge */}
                <a
                  href="#/user/features"
                  className="text-sm font-medium uppercase transition-colors duration-300 relative group whitespace-nowrap flex-shrink-0 hover:text-red-500 flex items-center gap-2"
                  style={{ color: '#ffffff' }}
                >
                  BEEST OFFERS
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">HOT</span>
                </a>
                
                {/* Shop Dropdown - Desktop */}
                <div 
                  ref={desktopCollectionsRef}
                  className="relative"
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) {
                      setShowDesktopCollections(true)
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth >= 768) {
                      setShowDesktopCollections(false)
                    }
                  }}
                >
                  <button 
                    className="text-sm font-medium uppercase transition-colors duration-300 flex items-center relative whitespace-nowrap group flex-shrink-0 hover:text-red-500"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowDesktopCollections((prev) => !prev)
                    }}
                    style={{ color: '#ffffff' }}
                  >
                    SHOP
                    <svg 
                      className={`ml-1 w-3 h-3 transform transition-transform duration-300 ${showDesktopCollections ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDesktopCollections && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 bg-transparent"
                      style={{ zIndex: 9999 }}
                      onMouseEnter={() => {
                        if (window.innerWidth >= 768) {
                          setShowDesktopCollections(true)
                        }
                      }}
                      onMouseLeave={() => {
                        if (window.innerWidth >= 768) {
                          setShowDesktopCollections(false)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div 
                        className="w-64 shadow-2xl transition-all duration-300"
                        style={{
                          backgroundColor: '#ffffff',
                          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        <div className="py-4">
                          <a 
                            href="#/user/face" 
                            className="block px-6 py-3 text-sm font-medium uppercase transition-all duration-300 hover:bg-gray-100"
                            onClick={(e) => {
                              setShowDesktopCollections(false)
                              e.stopPropagation()
                            }}
                            style={{ color: '#1a1a1a' }}
                          >
                            Face Care
                          </a>
                          <a 
                            href="#/user/hair" 
                            className="block px-6 py-3 text-sm font-medium uppercase transition-all duration-300 hover:bg-gray-100"
                            onClick={(e) => {
                              setShowDesktopCollections(false)
                              e.stopPropagation()
                            }}
                            style={{ color: '#1a1a1a' }}
                          >
                            Hair Care
                          </a>
                          <a 
                            href="#/user/body" 
                            className="block px-6 py-3 text-sm font-medium uppercase transition-all duration-300 hover:bg-gray-100"
                            onClick={(e) => {
                              setShowDesktopCollections(false)
                              e.stopPropagation()
                            }}
                            style={{ color: '#1a1a1a' }}
                          >
                            Body Care
                          </a>
                          <a 
                            href="#/user/combos" 
                            className="block px-6 py-3 text-sm font-medium uppercase transition-all duration-300 hover:bg-gray-100"
                            onClick={(e) => {
                              setShowDesktopCollections(false)
                              e.stopPropagation()
                            }}
                            style={{ color: '#1a1a1a' }}
                          >
                            Combos
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <a
                  href="#/user/blog"
                  className="text-sm font-medium uppercase transition-colors duration-300 relative group whitespace-nowrap flex-shrink-0 hover:text-red-500"
                  style={{ color: '#ffffff' }}
                >
                  BLOG
                </a>
                <a
                  href="#/user/about"
                  className="text-sm font-medium uppercase transition-colors duration-300 relative group whitespace-nowrap flex-shrink-0 hover:text-red-500"
                  style={{ color: '#ffffff' }}
                >
                  ABOUT US
                </a>
                <a
                  href="#/user/contact"
                  className="text-sm font-medium uppercase transition-colors duration-300 relative group whitespace-nowrap flex-shrink-0 hover:text-red-500"
                  style={{ color: '#ffffff' }}
                >
                  CONTACT US
                </a>
              </nav>
              
              {/* Right Side Icons - Desktop: Search, Wishlist, Cart, Phone | Mobile/Tablet: Account, Cart */}
              <div className="flex items-center gap-3 md:gap-4 lg:gap-6" style={{ color: '#ffffff' }}>
                {/* Desktop: Search Icon */}
                <button 
                  onClick={() => {
                    const event = new CustomEvent('open-search')
                    window.dispatchEvent(event)
                  }}
                  className="hidden md:flex w-8 h-8 items-center justify-center transition-colors duration-300 hover:text-red-500"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Desktop: Wishlist Icon */}
                <button 
                  onClick={() => window.location.hash = '#/user/wishlist'}
                  className="hidden md:flex w-8 h-8 items-center justify-center transition-colors duration-300 relative hover:text-red-500"
                  aria-label="Wishlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center bg-red-600 text-white">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>
                
                {/* Cart Icon */}
                <button
                  onClick={() => window.location.hash = '#/user/cart'}
                  className="hidden md:flex w-8 h-8 items-center justify-center transition-colors duration-300 relative hover:text-red-500"
                  aria-label="Cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-600 text-white">
                      {cartItems.length}
                    </span>
                  )}
                </button>

                {/* Phone with Call Us */}
                <div className="hidden lg:flex items-center gap-2 ml-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-300">CALL US:</span>
                    {/* <span className="text-sm font-bold">(+800) 345 678</span> */}
                  </div>
                </div>
                
                {/* Account Icon - Visible on all screens */}
                <button 
                  onClick={() => window.location.hash = isAuthenticated ? '#/user/profile' : '#/user/login'}
                  className="w-[50px] h-[50px] flex items-center justify-center transition-colors duration-300 relative group md:hidden"
                  aria-label="Account"
                  style={{ touchAction: 'manipulation' }}
                >
                  {isAuthenticated && user ? (
                    <ProfileAvatar 
                      profilePhoto={user.profile_photo}
                      name={user.name}
                      size="50px"
                      className="border border-slate-200"
                    />
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Bar with Search and Categories */}
            <div className="hidden md:flex items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-12 max-w-[1920px] mx-auto py-3" style={{ backgroundColor: '#111827', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {/* All Categories Dropdown */}
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium uppercase whitespace-nowrap"
                style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-4 h-4" />
                ALL CATEGORIES
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-4 py-2 pr-12 text-sm border-none outline-none"
                    style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full px-4 flex items-center justify-center"
                    style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </header>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowMobileMenu(false)
                setShowMobileCollections(false)
              }}
            >
              <div
                className="fixed top-20 left-0 right-0 bottom-0 shadow-2xl overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 80px)', backgroundColor: '#ffffff' }}
              >
                <nav className="flex flex-col px-6 py-12" style={{ backgroundColor: '#ffffff' }}>
                  <a 
                    href="#/user/" 
                    className="py-4 text-sm font-medium uppercase border-b border-gray-200 transition-colors duration-300 hover:text-red-500"
                    style={{ color: '#1a1a1a' }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    HOME
                  </a>
                  <a 
                    href="#/user/features" 
                    className="py-4 text-sm font-medium uppercase border-b border-gray-200 transition-colors duration-300 hover:text-red-500 flex items-center gap-2"
                    style={{ color: '#1a1a1a' }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    THEME FEATURES
                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">HOT</span>
                  </a>
                  <div>
                    <button
                      className="py-4 text-sm font-medium uppercase border-b border-gray-200 w-full flex items-center justify-between transition-colors duration-300 hover:text-red-500"
                      style={{ color: '#1a1a1a' }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowMobileCollections((prev) => !prev)
                      }}
                    >
                      SHOP
                      <svg 
                        className={`w-4 h-4 transform transition-transform duration-300 ${showMobileCollections ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: '#1a1a1a' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showMobileCollections && (
                      <div className="bg-gray-50" onClick={(e) => e.stopPropagation()}>
                        <a 
                          href="#/user/face" 
                          className="block py-3 px-8 text-sm font-medium uppercase transition-all duration-300 hover:text-red-500"
                          style={{ color: '#1a1a1a' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMobileMenu(false)
                            setShowMobileCollections(false)
                          }}
                        >
                          Face Care
                        </a>
                        <a 
                          href="#/user/hair" 
                          className="block py-3 px-8 text-sm font-medium uppercase transition-all duration-300 hover:text-red-500"
                          style={{ color: '#1a1a1a' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMobileMenu(false)
                            setShowMobileCollections(false)
                          }}
                        >
                          Hair Care
                        </a>
                        <a 
                          href="#/user/body" 
                          className="block py-3 px-8 text-sm font-medium uppercase transition-all duration-300 hover:text-red-500"
                          style={{ color: '#1a1a1a' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMobileMenu(false)
                            setShowMobileCollections(false)
                          }}
                        >
                          Body Care
                        </a>
                        <a 
                          href="#/user/combos" 
                          className="block py-3 px-8 text-sm font-medium uppercase transition-all duration-300 hover:text-red-500 border-b border-gray-200"
                          style={{ color: '#1a1a1a' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMobileMenu(false)
                            setShowMobileCollections(false)
                          }}
                        >
                          Combos
                        </a>
                      </div>
                    )}
                  </div>
                  <a 
                    href="#/user/blog"
                    className="py-4 text-sm font-medium uppercase border-b border-gray-200 transition-colors duration-300 hover:text-red-500"
                    style={{ color: '#1a1a1a' }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    BLOG
                  </a>
                  <a 
                    href="#/user/about"
                    className="py-4 text-sm font-medium uppercase border-b border-gray-200 transition-colors duration-300 hover:text-red-500"
                    style={{ color: '#1a1a1a' }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    ABOUT US
                  </a>
                  <a 
                    href="#/user/contact"
                    className="py-4 text-sm font-medium uppercase border-b border-gray-200 transition-colors duration-300 hover:text-red-500"
                    style={{ color: '#1a1a1a' }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    CONTACT US
                  </a>
                </nav>
              </div>
            </div>
          )}

        <SmoothScroll>
          <div className="main-content-wrapper">
            <Suspense fallback={<PageLoader />}>
              <RouterView affiliateId={affiliateId} />
            </Suspense>
          </div>
        </SmoothScroll>

      <footer
        className="py-8 sm:py-12 md:py-16 text-sm w-full overflow-x-hidden"
        style={{ backgroundColor: 'var(--color-nav-bg)', color: 'var(--color-text-secondary-on-teal)', borderTop: '1px solid rgba(232, 245, 247, 0.16)' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-light tracking-wide" style={{ color: 'var(--color-text-on-nav)', fontFamily: 'var(--font-heading-family)' }}>MIYATI®</h3>
              <p className="text-xs sm:text-sm font-light leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Natural and safe skincare for every skin type. Made with love and care.</p>
            </div>

            {/* Categories Section */}
            <div>
              <h4 className="mb-3 text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-on-nav)' }}>Categories</h4>
              <ul className="space-y-2">
                <li><a href="#/user/" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Home</a></li>
                <li><a href="#/user/offers" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Offers</a></li>
                <li><a href="#/user/new-arrivals" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>New Arrivals</a></li>
                <li><a href="#/user/face" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Face</a></li>
                <li><a href="#/user/body" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Body</a></li>
                <li><a href="#/user/hair" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Hair</a></li>
                <li><a href="#/user/combos" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Combos</a></li>
                <li><a href="#/user/best-sellers" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Best Seller</a></li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h4 className="mb-3 text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-on-nav)' }}>Company</h4>
              <ul className="space-y-2">
                <li><a href="#/user/about" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>About us</a></li>
                <li><a href="#/user/faq" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>FAQ</a></li>
                <li><a href="#/user/blog" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Blogs</a></li>
                <li>
  <a
    href="#/user/affiliate-partner"
    onClick={() => {
      sessionStorage.setItem('affiliate_referrer', 'home')
    }}
    className="text-xs sm:text-sm font-light transition-colors hover:opacity-80"
    style={{ color: 'var(--color-text-secondary-on-teal)' }}
  >
    Affiliate Program
  </a>
</li>

                <li><a href="#/user/contact" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Contact Us</a></li>
              </ul>
            </div>

            {/* Legal & Social Section */}
            <div>
              <h4 className="mb-3 text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-on-nav)' }}>Legal</h4>
              <ul className="space-y-2 mb-6">
                <li><a href="#/user/privacy-policy" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Privacy Policy</a></li>
                <li><a href="#/user/refund-policy" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Refund Policy</a></li>
                <li><a href="#/user/shipping-policy" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Shipping Policy</a></li>
                <li><a href="#/user/terms-of-service" className="text-xs sm:text-sm font-light transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary-on-teal)' }}>Terms of Service</a></li>
              </ul>
              
              {/* Social Media Icons */}
              <div className="mt-6">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--color-text-on-nav)' }}>SOCIALLY CONNECT WITH US</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="https://www.instagram.com/nefol_official?igsh=d2NkaXk2NW92emhq&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on Instagram"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <Instagram className="w-4 h-4" style={{ stroke: 'currentColor', fill: 'none' }} />
                  </a>
                  <a
                    href="https://www.facebook.com/share/1H3dWrPgcY/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on Facebook"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <Facebook className="w-4 h-4" style={{ stroke: 'currentColor', fill: 'none' }} />
                  </a>
                  <a
                    href="https://x.com/nefol_official?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on X"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--color-text-secondary-on-teal)' }}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com/@nefol.official?si=4kDfx02DoJ8Lpx9F"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on YouTube"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <Youtube className="w-4 h-4" style={{ stroke: 'currentColor', fill: 'none' }} />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/nefol-aesthetics-pvt-ltd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on LinkedIn"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <Linkedin className="w-4 h-4" style={{ stroke: 'currentColor', fill: 'none' }} />
                  </a>
                  <a
                    href="https://vk.com/nefolclub"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® club on VK"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors text-[11px] font-semibold"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    VK
                  </a>
                  <a
                    href="https://pin.it/hfoLEqFgB"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="NEFOL® on Pinterest"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 transition-colors"
                    style={{ color: 'var(--color-text-secondary-on-teal)' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--color-text-secondary-on-teal)' }}>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.619 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 12-5.373 12-12S18.627.001 12 .001z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-white/10 pt-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <small 
                className="text-[10px] xs:text-[11px] sm:text-xs font-light text-center sm:text-left leading-relaxed block w-full" 
                style={{ 
                  color: 'var(--color-text-secondary-on-teal)',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}
              >
                <span className="inline-block max-w-full">
                  ©2024-{new Date().getFullYear()} NEFOL® • powered by{' '}
                  <span className="inline-block">Divyan Technologies</span>{' '}
                  <span className="inline-block">Private Limited</span>
                </span>
              </small>
            </div>
          </div>
        </div>
      </footer>

      {/* Global cart toast notification */}
      {cartToast && (
        <div 
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-white shadow-lg flex items-center gap-2 transition-all duration-300 cart-toast-mobile sm:bg-slate-900/90"
        >
          <span>✅</span>
          <span>{cartToast.message}</span>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20">
          <div
            className="w-full max-w-2xl rounded-xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-body)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-body)', fontFamily: 'var(--font-heading-family)' }}>
                Search Products
              </h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, ingredients, or categories..."
                  className="flex-1 rounded-lg px-4 py-3"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg px-6 py-3 font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-button-primary-bg)',
                    color: 'var(--color-button-primary-text)',
                  }}
                >
                  Search
                </button>
              </div>
            </form>
            <div className="text-center" style={{ color: 'var(--color-text-body)' }}>
              <p>Search functionality will be implemented with backend integration</p>
            </div>
          </div>
        </div>
      )}

          <LiveChatWidget />
          <SearchButton />
          <PWAInstallPrompt />
          <BottomNavigation />
          <SwipeNavigation />
        </>
      )}
    </div>
  )
}

// Lightweight hash-based router to avoid external deps - lazy load all pages
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Skincare = lazy(() => import('./pages/Skincare'))
const Ingredients = lazy(() => import('./pages/Ingredients'))
const IngredientDetail = lazy(() => import('./pages/IngredientDetail'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const ProductPage = lazy(() => import('./pages/Product'))
const CategoryPage = lazy(() => import('./pages/Category'))
const Affiliate = lazy(() => import('./pages/Affiliate'))
const AffiliatePartner = lazy(() => import('./pages/AffiliatePartner'))
const ReferralHistory = lazy(() => import('./pages/ReferralHistory'))
const Reports = lazy(() => import('./pages/Reports'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Confirmation = lazy(() => import('./pages/Confirmation'))
const OffersPage = lazy(() => import('./pages/Offers'))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivals'))
const BestSellersPage = lazy(() => import('./pages/BestSellers'))
const GiftingPage = lazy(() => import('./pages/Gifting'))
const StoreLocatorPage = lazy(() => import('./pages/StoreLocator'))
const ShadeFinderPage = lazy(() => import('./pages/ShadeFinder'))
const SkinQuizPage = lazy(() => import('./pages/SkinQuiz'))
const TrackOrderPage = lazy(() => import('./pages/TrackOrder'))
const SustainabilityPage = lazy(() => import('./pages/Sustainability'))
const PressMediaPage = lazy(() => import('./pages/PressMedia'))
const Forms = lazy(() => import('./pages/Forms'))

// Loading fallback component - minimal to avoid showing during page transitions
const PageLoader = () => null

interface RouterViewProps {
  affiliateId?: string | null
}

function RouterView({ affiliateId }: RouterViewProps) {
  const { isAuthenticated } = useAuth()
  const RequiredAuth = (component: JSX.Element): JSX.Element | null => {
  if (!isAuthenticated) {
    if (!window.location.hash.startsWith('#/user/login')) {
      sessionStorage.setItem('post_login_redirect', window.location.hash)
      window.location.hash = '#/user/login'
    }
    return null
  }
  return component
}

  const [hash, setHash] = useState(window.location.hash || '#/user/')
  
  
  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/user/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  
  // Scroll to top whenever the route changes
  React.useEffect(() => {
    // Scroll to top immediately when route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    
    // Also ensure document and body are scrolled to top
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }
  }, [hash])
  
  // Track page views whenever the route changes
  React.useEffect(() => {
    const path = hash.replace('#', '') || '/user/'
    console.log('📊 Tracking page view:', path)
    userSocketService.trackPageView(path)
  }, [hash])
  
  const path = hash.replace('#', '')
  const lower = path.toLowerCase()
    const requireAuth = (component: JSX.Element) => {
    if (!isAuthenticated) {
      // redirect to login
      window.location.hash = '#/user/login'
      return null
    }
    return component
  }

  
  // Extract path without query parameters
  const pathWithoutQuery = lower.split('?')[0]
  
  if (lower.startsWith('/user/product/')) return <ProductPage />
  if (lower.startsWith('/user/category/')) return <CategoryPage />
  if (lower.startsWith('/user/blog/') && lower !== '/user/blog') return <BlogDetail />
  if (lower.startsWith('/user/ingredients/') && lower !== '/user/ingredients') return <IngredientDetail />
  if (lower.startsWith('/user/confirmation')) return <Confirmation />
  if (lower.startsWith('/user/order/')) return <OrderDetails />
  if (lower.startsWith('/user/cancel-order/')) return <CancelOrder />
  
  switch (pathWithoutQuery) {
    case '/user/product':
    case '/user/':
    case '/user':
      return <Home />
    case '/user/shop': return <Shop />
    case '/user/skincare': return <Skincare />
    case '/user/ingredients': return <Ingredients />
    case '/user/blog': return <Blog />
    case '/user/contact': return <Contact />
    case '/user/checkout': return <Checkout affiliateId={affiliateId} />
    case '/user/affiliate':
  return RequiredAuth(<Affiliate />)

case '/user/affiliate-partner':
  return RequiredAuth(<AffiliatePartner />)

case '/user/referral-history':
  return RequiredAuth(<ReferralHistory />) 

    case '/user/reports': return <Reports />
    case '/user/profile': return <Profile />
    case '/user/nefol-coins': return <NefolCoins />
    case '/user/coin-withdrawal': return <CoinWithdrawal />
    case '/user/user-orders': return <UserOrders />
    case '/user/saved-cards': return <SavedCards />
    case '/user/manage-address': return <ManageAddress />
    case '/user/wishlist': return <Wishlist />
    case '/user/login': return <LoginPage />
    case '/user/about': return <AboutUs />
    case '/user/faq': return <FAQ />
    case '/user/blue-tea-benefits': return <BlueTeaBenefits />
    case '/user/usp': return <USP />
    case '/user/privacy-policy': return <PrivacyPolicy />
    case '/user/refund-policy': return <RefundPolicy />
    case '/user/shipping-policy': return <ShippingPolicy />
    case '/user/terms-of-service': return <TermsOfService />
    case '/user/face': return <Face />
    case '/user/body': return <Body />
    case '/user/hair': return <Hair />
    case '/user/orders': return <Orders />
    case '/user/account': return <Account />
    case '/user/community': return <Community />
    case '/user/notifications': return <Notifications />
    case '/user/privacy-security': return <PrivacySecurity />
    case '/user/payment-methods': return <PaymentMethods />
    case '/user/loyalty-rewards': return <LoyaltyRewards />
    case '/user/combos': return <Combos />
    case '/user/gifting': return <GiftingPage />
    case '/user/cart': return <Cart />
    case '/user/search': return <SearchPage />
    case '/user/reset-password': return <ResetPasswordPage />
    case '/user/offers': return <OffersPage />
    case '/user/new-arrivals': return <NewArrivalsPage />
    case '/user/best-sellers': return <BestSellersPage />
    case '/user/store-locator': return <StoreLocatorPage />
    case '/user/shade-finder': return <ShadeFinderPage />
    case '/user/skin-quiz': return <SkinQuizPage />
    case '/user/track-order': return <TrackOrderPage />
    case '/user/sustainability': return <SustainabilityPage />
    case '/user/press': return <PressMediaPage />
    case '/user/forms': return <Forms />
    default:
      return <Home />
  }
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

      <footer className="bg-[#2a2a2a] text-white w-full overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div>
              <h3 className="text-2xl font-bold mb-4 tracking-wide">OPTIMA</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                We specialise in delivery and supply of organic food products, produced by local farmers.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">NEED HELP?</div>
                    <div className="text-white font-medium">(+800) 345 678, (+800) 123 456</div>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/share/1H3dWrPgcY/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://x.com/nefol_official?s=21" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/nefol_official?igsh=d2NkaXk2NW92emhq&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://youtube.com/@nefol.official?si=4kDfx02DoJ8Lpx9F" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/nefol-aesthetics-pvt-ltd/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://pin.it/hfoLEqFgB" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.619 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 12-5.373 12-12S18.627.001 12 .001z"/>
                  </svg>
                </a>
                <a href="https://vk.com/nefolclub" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.18 14.14h-1.41c-.68 0-.89-.54-2.11-1.76-1.06-1.06-1.53-1.2-1.8-1.2-.37 0-.47.1-.47.59v1.61c0 .43-.14.69-1.27.69-1.87 0-3.94-1.13-5.4-3.24-2.2-3-2.81-5.25-2.81-5.71 0-.27.1-.52.59-.52h1.41c.44 0 .61.2.78.67.85 2.37 2.27 4.45 2.85 4.45.22 0 .32-.1.32-.66V9.47c-.07-1.15-.67-1.25-.67-1.65 0-.22.18-.43.47-.43h2.22c.37 0 .51.2.51.63v3.42c0 .37.17.51.27.51.22 0 .4-.14.81-.54 1.26-1.41 2.16-3.59 2.16-3.59.12-.25.32-.49.81-.49h1.41c.53 0 .65.27.53.63-.19.89-2.18 3.99-2.18 3.99-.18.3-.25.43 0 .77.18.25.78.76 1.18 1.22.73.82 1.3 1.51 1.45 1.99.16.47-.09.71-.61.71z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Information Links */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">INFORMATION</h4>
              <ul className="space-y-2.5">
                <li><a href="#/user/shipping-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Delivery</a></li>
                <li><a href="#/user/about" className="text-sm text-gray-400 hover:text-white transition-colors">About us</a></li>
                <li><a href="#/user/payment" className="text-sm text-gray-400 hover:text-white transition-colors">Secure payment</a></li>
                <li><a href="#/user/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact us</a></li>
                <li><a href="#/user/sitemap" className="text-sm text-gray-400 hover:text-white transition-colors">Sitemap</a></li>
                <li><a href="#/user/stores" className="text-sm text-gray-400 hover:text-white transition-colors">Stores</a></li>
              </ul>
            </div>

            {/* Custom Links */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">CUSTOM LINKS</h4>
              <ul className="space-y-2.5">
                <li><a href="#/user/legal-notice" className="text-sm text-gray-400 hover:text-white transition-colors">Legal Notice</a></li>
                <li><a href="#/user/offers" className="text-sm text-gray-400 hover:text-white transition-colors">Prices drop</a></li>
                <li><a href="#/user/new-arrivals" className="text-sm text-gray-400 hover:text-white transition-colors">New products</a></li>
                <li><a href="#/user/best-sellers" className="text-sm text-gray-400 hover:text-white transition-colors">Best sales</a></li>
                <li><a href="#/user/account" className="text-sm text-gray-400 hover:text-white transition-colors">My account</a></li>
                <li><a href="#/user/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">Terms and conditions</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">NEWSLETTER</h4>
              <p className="text-sm text-gray-400 mb-4">Sign up for our e-mail to get latest news.</p>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2.5 bg-white text-gray-900 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                  Subscribe
                </button>
              </div>

              {/* App Store Badges */}
              <div className="flex gap-3">
                <a href="#" className="block">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                    alt="Download on App Store" 
                    className="h-10 w-auto"
                  />
                </a>
                <a href="#" className="block">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play" 
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Bottom Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-gray-500">
                <a href="#/user/" className="hover:text-white transition-colors">Online Shopping</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/promotions" className="hover:text-white transition-colors">Promotions</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/help" className="hover:text-white transition-colors">Help</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/customer-service" className="hover:text-white transition-colors">Customer Service</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/support" className="hover:text-white transition-colors">Support</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/popular" className="hover:text-white transition-colors">Most Populars</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/manufacturers" className="hover:text-white transition-colors">Manufacturers</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/shipping" className="hover:text-white transition-colors">Shipping</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/payments" className="hover:text-white transition-colors">Payments</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/refunds" className="hover:text-white transition-colors">Refunds</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/discount" className="hover:text-white transition-colors">Discount</a>
                <span className="text-gray-700">|</span>
                <a href="#/user/policy" className="hover:text-white transition-colors">Policy</a>
              </div>

              {/* Payment Icons */}
              <div className="flex items-center gap-2">
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <span className="text-blue-600 font-bold text-xs">Skrill</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <span className="text-orange-500 font-bold text-xs">Klarna</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" className="h-4 w-auto" />
                </div>
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 w-auto" />
                </div>
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 w-auto" />
                </div>
                <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center" style={{ minWidth: '50px', height: '32px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-4 w-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
