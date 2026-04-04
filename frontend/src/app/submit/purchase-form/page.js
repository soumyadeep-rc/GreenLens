'use client'
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ethers } from 'ethers';
import axios from 'axios';
import Link from 'next/link';

// ==========================================
// 🔐 Now pulling securely from .env.local
// ==========================================
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function PurchaseForm() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Energy Efficient Appliance',
    amount: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verify Web3 & MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask to verify purchases on-chain.");
      }

      // 2. Connect to MetaMask Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 3. Verify Contract Exists on Current Network
      if (!CONTRACT_ADDRESS) {
        throw new Error("Developer Error: NEXT_PUBLIC_CONTRACT_ADDRESS is missing from Frontend/.env.local");
      }

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x' || code === '0x0') {
        throw new Error("Contract not deployed on current network. Please switch MetaMask to Sepolia.");
      }

      // 4. Get Clerk Auth Token
      const token = await getToken();
      if (!token) throw new Error("Please log in to submit purchases.");

      // 5. Send to Backend
      await axios.post("http://localhost:8000/api/v1/form/purchase", formData, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      // 6. Success State
      setSuccess(true);
      
    } catch (error) {
      console.error("Submission Error:", error);
      alert(error.message || "Failed to submit purchase.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#EAF7F3] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-lg max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🛒</div>
          <h2 className="text-3xl font-bold text-[#145C42] mb-4">Purchase Verified!</h2>
          <p className="text-gray-600 mb-8">Your eco-friendly purchase has been logged. Tokens are being minted to your wallet.</p>
          <Link href="/home" className="bg-[#145C42] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#0E422F] transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF7F3] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Button */}
        <Link href="/home" className="inline-flex items-center text-[#145C42] font-semibold hover:text-[#0E422F] mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-[2rem] shadow-md p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
              🛒
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Eco-Friendly Purchase</h1>
              <p className="text-gray-500 mt-1 text-sm">Verify sustainable products & EV purchases for Green Tokens.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              >
                <option value="Energy Efficient Appliance">Energy Efficient Appliance (A+++)</option>
                <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
                <option value="Solar Equipment">Solar Panels / Equipment</option>
                <option value="Sustainable Materials">Sustainable / Recycled Goods</option>
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item Name / Model</label>
              <input 
                type="text" 
                name="itemName"
                placeholder="e.g., Tesla Model 3, Bosch Green Series Washer"
                value={formData.itemName}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Total Amount Spent ($)</label>
              <input 
                type="number" 
                name="amount"
                placeholder="e.g., 1200"
                min="1"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-8 font-bold text-white py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2
                ${loading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying on Blockchain...
                </>
              ) : (
                'Verify Purchase & Mint Tokens'
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Secured by Sepolia Testnet
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}