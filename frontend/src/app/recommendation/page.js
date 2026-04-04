'use client';
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const recommendations = [
  {
    id: 1,
    title: "Switch to Renewable Energy",
    description: "Install solar panels or opt for a renewable energy provider to cut your emissions significantly.",
    image: "/solar-energy.png",
  },
  {
    id: 2,
    title: "Use Public Transport",
    description: "Reduce carbon emissions by choosing buses, trains, cycling, or carpooling instead of solo drives.",
    image: "/train.png", // Added leading slash
  },
  {
    id: 3,
    title: "Reduce Food Waste",
    description: "Plan your meals, store food properly, and compost organic waste to lower methane emissions.",
    image: "/compost.png", // Added leading slash
  },
  {
    id: 4,
    title: "Switch to Reusable Items",
    description: "Replace single-use plastics with reusable bottles, bags, and containers for everyday use.",
    image: "/recycle.png", // Added leading slash
  },
  {
    id: 5,
    title: "Plant a Tree",
    description: "Join local tree-planting drives — every tree absorbs about 22 kg of CO₂ per year.",
    image: "/plant.png", // Added leading slash
  },
  {
    id: 6,
    title: "Buy Local Products",
    description: "Support local farmers and reduce transport emissions by choosing local and seasonal produce.",
    image: "/healthy.png", // Added leading slash
  },
];

export default function RecommendationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5D6A7] to-[#E8F5E9] py-12 px-6 md:px-12 relative">
      
      {/* Back to Dashboard Button */}
      <Link href="/home" className="absolute top-8 left-8 flex items-center gap-2 text-green-900 font-bold hover:text-green-700 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>

      <div className="max-w-6xl mx-auto mt-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-green-900 mb-4">
          Lower Your Carbon Footprint
        </h1>
        <p className="text-center text-green-800 mb-12 max-w-2xl mx-auto">
          Every small action adds up. Explore these highly effective ways to reduce your emissions and earn more Green Tokens on our platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-green-100 flex flex-col items-center p-8 text-center"
            >
              <div className="w-24 h-24 mb-6 bg-green-50 rounded-full flex items-center justify-center p-4">
                <img
                  src={rec.image}
                  alt={rec.title}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h2 className="text-xl text-green-900 font-bold mb-3">
                {rec.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                {rec.description}
              </p>
              
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}