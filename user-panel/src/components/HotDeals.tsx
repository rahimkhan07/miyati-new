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

const product: Product = {
  id: 1,
  brand: "BRAND 3",
  name: "Gamesir T4 Pro Wireless",
  image: "https://via.placeholder.com/250x150",
  rating: 4,
  oldPrice: 749.0,
  newPrice: 711.55,
  discountPercent: 5,
  availability: 999,
  saleEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
};

const HotDeals: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(
    getTimeRemaining(product.saleEndsAt),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(product.saleEndsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[320px] font-sans item-center">
      {/* Header */}
      <div className="flex justify-between items-center">
        
        {/* <div className="flex gap-2">
          <button className="text-lg cursor-pointer bg-transparent border-none">
            {"<"}
          </button>
          <button className="text-lg cursor-pointer bg-transparent border-none">
            {">"}
          </button>
        </div> */}
      </div>

      {/* Card */}
      <div className="bg-[#f8f8f8] p-5 rounded-xl mt-4 text-center">
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
        <img
          src={product.image}
          alt={product.name}
          className="w-full max-h-[160px] object-contain my-4"
        />

        {/* Brand */}
        <p className="text-gray-500 text-xs">{product.brand}</p>

        {/* Title */}
        <h3 className="my-1 text-lg">{product.name}</h3>

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
        <div className="bg-[#4f8fb8] text-white rounded-full p-4 flex justify-around mt-4">
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
