import React from "react";
import { products } from "../data/product.js";
import ProductCard from "../components/ProductCard.jsx";
import Link from 'next/link';
import { Users } from 'lucide-react';

const RedeemPage = () => {
    const ha = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes floatY {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
  return (
        <div
      className="min-h-screen flex justify-center items-center"
      style={{
        background: "linear-gradient(135deg, #a7f3d0 0%, #d9f99d 100%)",
      }}
    >
        <style>{ha}</style>
       <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
       <h1
          className="text-5xl sm:text-6xl md:text-6xl font-extrabold text-center mb-10"
          style={{
            background: "linear-gradient(90deg, #0B3D2E, #1B5E20, #FFC107, #1B5E20)",
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradientShift 6s ease-in-out infinite, floatY 4s ease-in-out infinite",
          }}
        >
          Shop Sustainably, Support Our Planet
        </h1>
        <div className="mt-16 mb-8 max-w-6xl mx-auto bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] border border-green-200 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow">
  <div className="text-center md:text-left mb-6 md:mb-0">
    <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 mb-3">
      <Users className="w-4 h-4 text-green-800" />
      <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Join The Network</span>
    </div>
    <h3 className="text-2xl md:text-3xl font-extrabold text-[#1B5E20] mb-2">
      Are you an NGO or Eco-Brand?
    </h3>
    <p className="text-green-800/80 max-w-xl">
      Partner with GreenLens to feature your sustainable products and connect with our massive audience of eco-conscious users.
    </p>
  </div>
  
  <Link 
    href="/ngo" 
    className="bg-[#1B5E20] hover:bg-[#0E3311] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-900/20 whitespace-nowrap flex items-center gap-2"
  >
    View Partnership Details
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
  </Link>
</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default RedeemPage;