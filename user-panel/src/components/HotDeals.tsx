import React, { useEffect, useState } from "react";

type Product = {
  id: number;
  brand: string;
  name: string;
  image: string;
  rating: number;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
  availability: number;
  saleEndsAt: Date;
};

const products: Product[] = [
  {
    id: 1,
    brand: "BRAND 1",
    name: "Gamesir T4 Pro Wireless",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=400",
    rating: 4,
    oldPrice: 749.0,
    newPrice: 711.55,
    discountPercent: 5,
    availability: 999,
    saleEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    brand: "BRAND 2",
    name: "Wireless Headphones Pro",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    oldPrice: 1299.0,
    newPrice: 899.0,
    discountPercent: 31,
    availability: 450,
    saleEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    brand: "BRAND 3",
    name: "Smart Watch Series 7",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    oldPrice: 2499.0,
    newPrice: 1999.0,
    discountPercent: 20,
    availability: 250,
    saleEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    brand: "BRAND 4",
    name: "Mechanical Keyboard RGB",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400",
    rating: 4,
    oldPrice: 899.0,
    newPrice: 649.0,
    discountPercent: 28,
    availability: 680,
    saleEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 5,
    brand: "BRAND 5",
    name: "Wireless Mouse Gaming",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    oldPrice: 599.0,
    newPrice: 399.0,
    discountPercent: 33,
    availability: 890,
    saleEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    brand: "BRAND 6",
    name: "Portable Speaker Bluetooth",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400",
    rating: 4,
    oldPrice: 1499.0,
    newPrice: 999.0,
    discountPercent: 33,
    availability: 320,
    saleEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
  },
];

interface HotDealsProps {
  productIndex?: number;
}

const HotDeals: React.FC<HotDealsProps> = ({ productIndex = 0 }) => {
  const product = products[productIndex % products.length];
  const [timeLeft, setTimeLeft] = useState(
    getTimeRemaining(product.saleEndsAt),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(product.saleEndsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [product.saleEndsAt]);

  return (
    <div className="w-[320px] font-sans item-center">
      {/* Card */}
      <div className="bg-[#f8f8f8] p-5 rounded-xl mt-4 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Badges */}
        <div className="flex gap-2 justify-start">
          <span className="bg-[#e53935] text-white px-2 py-1 text-xs rounded">
            On Sale!
          </span>
          <span className="bg-[#29b6f6] text-white px-2 py-1 text-xs rounded">
            New
          </span>
        </div>

        {/* Image */}
        <div className="w-full h-[160px] flex items-center justify-center my-4 bg-white rounded-xl overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-xl"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
            }}
          />
        </div>

        {/* Brand */}
        <p className="text-gray-500 text-xs">{product.brand}</p>

        {/* Title */}
        <h3 className="my-1 text-lg font-semibold">{product.name}</h3>

        {/* Rating */}
        <div className="my-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg ${
                i < product.rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="my-2">
          <span className="line-through text-gray-500 mr-2">
            ₹{product.oldPrice.toFixed(2)}
          </span>
          <span className="text-[#e53935] font-bold mr-2">
            ₹{product.newPrice.toFixed(2)}
          </span>
          <span className="bg-[#e53935] text-white px-2 py-[2px] text-xs rounded">
            -{product.discountPercent}%
          </span>
        </div>

        {/* Availability */}
        <p className="text-gray-500 text-sm">
          Availability: {product.availability} In Stock
        </p>

        {/* Countdown */}
        <div className="bg-gray-800 text-white rounded-full p-4 flex justify-around mt-4">
          <TimeBox value={timeLeft.days} label="days" />
          <TimeBox value={timeLeft.hours} label="hours" />
          <TimeBox value={timeLeft.minutes} label="mins" />
          <TimeBox value={timeLeft.seconds} label="secs" />
        </div>
      </div>
    </div>
  );
};

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="text-center">
    <span className="text-lg font-bold block">{value}</span>
    <small className="text-xs">{label}</small>
  </div>
);

function getTimeRemaining(endTime: Date) {
  const total = endTime.getTime() - new Date().getTime();

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days: days > 0 ? days : 0,
    hours: hours > 0 ? hours : 0,
    minutes: minutes > 0 ? minutes : 0,
    seconds: seconds > 0 ? seconds : 0,
  };
}

export default HotDeals;
