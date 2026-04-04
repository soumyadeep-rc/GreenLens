'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, UserButton } from '@clerk/nextjs'; 
import Link from 'next/link';
import dynamic from 'next/dynamic'; // ✅ IMPORT DYNAMIC

// ✅ DYNAMICALLY IMPORT GRAPH TO PREVENT NEXT.JS SSR ERRORS
const GraphComponent = dynamic(() => import('./GraphComponent'), { ssr: false });

// --- HELPER ICONS ---
const Icons = {
  Lightning: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Sun: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Car: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12.5M3 17h18M5 17a2 2 0 114 0m10 0a2 2 0 114 0M9 13h6" /></svg>,
  Tree: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Cart: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Verified: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

export default function UserProfile() {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DASHBOARD DATA ---
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const res = await axios.get("http://localhost:8000/api/v1/users/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setDashboardData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [getToken]);

  // --- 2. AUTO-SYNC WALLET LISTENER ---
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAddress = accounts[0];
        try {
          const token = await getToken();
          if (token) {
            await axios.patch("http://localhost:8000/api/v1/users/update-wallet", 
              { walletAddress: newAddress }, 
              { headers: { "Authorization": `Bearer ${token}` } }
            );
            fetchDashboard(); 
          }
        } catch (error) {
          console.error("Dashboard auto-sync failed:", error);
        }
      }
    };

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [getToken]);

  // --- 3. IN-DASHBOARD CONNECT BUTTON ---
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const token = await getToken();
        if (token && accounts.length > 0) {
          await axios.patch("http://localhost:8000/api/v1/users/update-wallet", 
            { walletAddress: accounts[0] }, 
            { headers: { "Authorization": `Bearer ${token}` } }
          );
          fetchDashboard(); 
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  if (loading) return <div className="text-center p-10 font-bold text-[#1B5E20]">Loading Dashboard...</div>;
  if (!dashboardData) return <div className="text-center p-10">Failed to load data. Please refresh.</div>;

  // --- EXTRACT DATA ---
  const { 
    profile, 
    totalGreenTokens, 
    totalSubmissions, 
    co2Saved, 
    monthlyTokens = [], // Pulling chart data
    activityBreakdown = [] 
  } = dashboardData;
  
  const firstName = profile?.fullName?.split(' ')[0] || 'User';

  // ✅ FALLBACK DUMMY DATA: If backend isn't sending graph data yet, use this so it doesn't render blank!
  const displayMonthlyTokens = monthlyTokens.length > 0 ? monthlyTokens : [
    { month: "Jan", tokens: 120 }, { month: "Feb", tokens: 250 }, { month: "Mar", tokens: 410 }
  ];
  const displayActivityBreakdown = activityBreakdown.length > 0 ? activityBreakdown : [
    { name: "Electricity", value: 300 }, { name: "Transport", value: 200 }, { name: "Purchases", value: 150 }, { name: "Plantation", value: 100 }
  ];

  return (
    <div className="min-h-screen bg-[#EAF7F3] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#145C42] flex items-center gap-2">
              Welcome back, {firstName}! 🍃
            </h1>
            <p className="text-[#3A7B62] mt-1 text-sm">Track your sustainability journey and earn rewards.</p>
          </div>
          
          {/* Top right Avatar */}
          <div className="shadow-md rounded-full border-2 border-white flex items-center justify-center">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: Profile & Balance --- */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-purple-500 text-white flex items-center justify-center text-4xl font-bold shadow-inner mb-4 overflow-hidden border-4 border-purple-100">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  firstName.charAt(0)
                )}
              </div>
              <h2 className="text-xl font-extrabold text-gray-800">{profile?.fullName}</h2>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mt-1">
                ✉️ {profile?.email}
              </p>

              {/* Web3 Wallet Section */}
              <div className="w-full mt-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Web3 Wallet
                </h3>
                
                {profile?.walletAddress ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-green-600 font-mono break-all px-2 text-center">
                      {profile.walletAddress}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      CONNECTED
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={connectWallet}
                    className="w-full bg-[#145C42] text-white text-xs font-bold py-2 rounded-xl shadow-md hover:bg-[#0E422F] transition-all"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>
            </div>

            {/* Tokens Balance Card */}
            <div className="bg-[#145C42] text-white rounded-[2rem] shadow-lg p-8 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              </div>
              <h3 className="text-green-100 font-medium mb-1 relative z-10">Green Tokens Balance</h3>
              <p className="text-6xl font-extrabold mb-2 relative z-10">{totalGreenTokens}</p>
              
              <div className="flex items-center gap-1 text-xs text-green-200 font-medium mb-6 relative z-10">
                <Icons.Verified /> Verified on-chain
              </div>

              <Link href="/store" className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 rounded-xl transition-all relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                Redeem Rewards
              </Link>
            </div>

          </div>


          {/* --- RIGHT COLUMN: Actions & Impact --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Log Activity & Earn */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#145C42] flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Log Activity & Earn
                </h2>
                <p className="text-gray-500 text-sm mt-1">Select an eco-friendly action below to verify your impact and mint tokens.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Electricity */}
                <Link href="/submit/electricity-form" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-yellow-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Lightning />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Electricity Bill</h4>
                    <p className="text-xs text-gray-500">Earn for staying below average</p>
                  </div>
                </Link>

                {/* 2. Solar */}
                <Link href="/submit/solar-form" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Sun />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Solar Power</h4>
                    <p className="text-xs text-gray-500">Log your renewable generation</p>
                  </div>
                </Link>

                {/* 3. Travel */}
                <Link href="/submit/transport-form" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Car />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Sustainable Travel</h4>
                    <p className="text-xs text-gray-500">EVs, Public Transit, or Cycling</p>
                  </div>
                </Link>

                {/* 4. Tree Plantation */}
                <Link href="/submit/plantation-form" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Tree />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Tree Plantation</h4>
                    <p className="text-xs text-gray-500">Upload geotagged photos</p>
                  </div>
                </Link>

                {/* 5. Eco Purchases */}
                <Link href="/submit/purchase-form" className="md:col-span-2 group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Cart />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Eco-Friendly Purchases</h4>
                    <p className="text-xs text-gray-500">Verify sustainable products & EV purchases</p>
                  </div>
                </Link>

              </div>
            </div>

            {/* --- LIFETIME IMPACT --- */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8">
               <h2 className="text-2xl font-bold text-[#145C42] mb-6">Your Lifetime Impact</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-xs text-gray-500 font-semibold mb-1">Total Submissions</p>
                   <p className="text-2xl font-black text-gray-800">{totalSubmissions || 0}</p>
                 </div>
                 
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                   <p className="text-xs text-blue-600 font-semibold mb-1">Trust Score</p>
                   <p className="text-2xl font-black text-blue-700">{profile?.trustLevel || 0}</p>
                 </div>
                 
                 <div className="col-span-2 p-4 bg-green-50 rounded-2xl border border-green-100">
                   <p className="text-xs text-green-700 font-semibold mb-1">Estimated CO2 Saved</p>
                   <p className="text-2xl font-black text-[#145C42]">{co2Saved || 0} kg</p>
                 </div>

               </div>
            </div>
            
             

          </div>
        
        

        </div>
          
        
          
        {/* ✅ ADDED GRAPH SECTION HERE */}
        <div className="mt-8">
          <GraphComponent 
            monthlyTokens={displayMonthlyTokens} 
            activityBreakdown={displayActivityBreakdown} 
          />
        </div>
        <div className="bg-gradient-to-r from-[#145C42] to-[#1B5E20] rounded-[2rem] shadow-md p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Boost Your Impact
                </h3>
                <p className="text-green-100 text-sm max-w-md">
                  Want to increase your token earnings and lower your CO2 emissions even further? Check out our top sustainability tips.
                </p>
              </div>
              <Link 
                href="/recommendation" 
                className="w-full md:w-auto bg-white text-[#145C42] font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors text-center whitespace-nowrap shadow-lg"
              >
                View Recommendations
              </Link>
            </div>
      </div>
    </div>
  );
}