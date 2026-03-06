import { useProducts } from "../hooks/useProducts";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { getApiBase } from "../utils/apiBase";
import PricingDisplay from "../components/PricingDisplay";
import ScrollReveal from "../components/ScrollReveal";
import {
  getProductRating,
  getProductReviewCount,
  hasVerifiedReviews,
} from "../utils/product_reviews";
import { useProductReviewStats } from "../hooks/useProductReviewStats";
import VerifiedBadge from "../components/VerifiedBadge";
import WishlistButton from "../components/WishlistButton";

export default function Shop() {
  const { items, loading, error } = useProducts();
  const cartContext = useCart();
  const { isAuthenticated } = useAuth();
  const addItem = cartContext?.addItem;

  const sortedItems = [...items];

  return (
    <main className="min-h-screen py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Page Title */}

        <div className="text-center mb-16">
          <h1
            className="text-5xl md:text-6xl font-normal mb-6 text-center"
            style={{
              fontFamily: "'Great Vibes', cursive",
              color: "#5b8fb9",
            }}
          >
            Shop here..
          </h1>

          <p className="text-gray-500 max-w-xl mx-auto">
            Discover our curated collection of premium skincare and haircare
            essentials.
          </p>
        </div>

        {loading && (
          <div className="text-center py-20">Loading products...</div>
        )}

        {error && <div className="text-center py-20 text-red-500">{error}</div>}

        {/* Product Grid */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {sortedItems.map((product) => {
            return (
              <article
                key={product.slug}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-xl hover:border-[#5b8fb9] transition-all duration-300 group"
              >
                {/* Image Area */}

                <div className="relative bg-gray-200 rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
                  {/* NEW badge */}

                  <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs px-3 py-1 rounded-lg">
                    New
                  </span>

                  {/* Wishlist */}

                  <div
                    className="absolute top-4 right-4    p-2 
opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  >
                    <WishlistButton productId={product.id!} />
                  </div>

                  {/* Product Image */}

                  {product.listImage && (
                    <img
                      src={product.listImage}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Hover Add To Cart */}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          window.location.hash = "#/user/login";
                          return;
                        }

                        addItem && addItem(product);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>

                {/* Product Info */}

                <div className="mt-5">
                  {/* Brand */}

                  {/* <p className="text-xs tracking-[0.35em] text-gray-400 uppercase mb-1">
                    {product.brand || "Brand"}
                  </p> */}

                  {/* Title */}

                  <a href={`#/user/product/${product.slug}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:opacity-70 transition">
                      {product.title}
                    </h3>
                  </a>

                  {/* Subtitle */}

                  {product.details?.subtitle && (
                    <p className="text-sm text-gray-500 mb-4">
                      {product.details.subtitle}
                    </p>
                  )}

                  {/* Pricing */}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{product.details?.websitePrice || product.price}
                    </span>

                    {product.details?.mrp && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.details.mrp}
                      </span>
                    )}
                  </div>

                  {/* Discount */}

                  <span className="border border-blue-400 text-blue-500 text-xs px-2 py-1 rounded">
                    25% OFF
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
