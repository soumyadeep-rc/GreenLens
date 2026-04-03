'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Lenis from 'lenis'
import axios from 'axios'
import { useAuth } from '@clerk/nextjs'

export default function Navbar() {
  const { getToken } = useAuth()
  
  const [activeSection, setActiveSection] = useState('#home')
  const [lenisInstance, setLenisInstance] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const leftNavItems = [
    { name: 'About', href: '#about' },
    { name: 'Our Impact', href: '#impact' }, 
  ]
  const rightNavItems = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Connect', href: '#connect' },
  ]
  const allNavItems = [...leftNavItems, ...rightNavItems]

  // --- 1. MANUAL CONNECT ---
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);

        const token = await getToken();
        if (token) {
          await axios.patch("http://localhost:8000/api/v1/users/update-wallet", 
            { walletAddress: address }, 
            { headers: { "Authorization": `Bearer ${token}` } }
          );
          alert("Wallet Connected & Saved!");
        }
      } catch (error) {
        console.error("Error saving wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // --- 2. AUTO-SYNC LISTENER ---
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAddress = accounts[0];
        setWalletAddress(newAddress);
        
        try {
          const token = await getToken();
          if (token) {
            await axios.patch("http://localhost:8000/api/v1/users/update-wallet", 
              { walletAddress: newAddress }, 
              { headers: { "Authorization": `Bearer ${token}` } }
            );
            console.log("Navbar: Auto-synced new wallet:", newAddress);
          }
        } catch (error) {
          console.error("Auto-sync failed:", error);
        }
      } else {
        setWalletAddress('');
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

  // --- 3. SCROLL LOGIC ---
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    setLenisInstance(lenis) 
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf)

    const handleScroll = () => {
      const sections = document.querySelectorAll('#home, #about, #impact, #how-it-works, #connect')
      let current = '#home'
      const scrollPos = window.scrollY + window.innerHeight / 2
      sections.forEach((section) => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
          current = `#${section.id}`
        }
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('scroll', handleScroll); lenis.destroy(); }
  }, [])

  const handleClick = (e, href) => {
    e.preventDefault()
    setIsMobileMenuOpen(false) 
    const target = document.querySelector(href)
    if (target && lenisInstance) lenisInstance.scrollTo(target)
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[1000px] bg-white/20 backdrop-blur-xl border border-white/30 rounded-full shadow-lg px-6 py-3 flex items-center justify-between gap-4'
    >
      <div className='hidden md:flex space-x-6'>
        {leftNavItems.map((item, i) => (
          <a key={i} href={item.href} onClick={(e) => handleClick(e, item.href)} className={`font-semibold transition-all hover:text-[#2E7D32] ${activeSection === item.href ? 'text-[#2E7D32]' : 'text-[#1B5E20]'}`}>{item.name}</a>
        ))}
      </div>

      <Link href="#home" onClick={(e) => handleClick(e, '#home')} className='md:mx-6 flex-shrink-0'>
        <div className='w-10 h-10 bg-[#1B5E20] rounded-full hover:scale-110 transition-transform cursor-pointer shadow-md'></div>
      </Link>

      <div className='hidden md:flex items-center space-x-6'>
        {rightNavItems.map((item, i) => (
          <a key={i} href={item.href} onClick={(e) => handleClick(e, item.href)} className={`font-semibold transition-all hover:text-[#2E7D32] ${activeSection === item.href ? 'text-[#2E7D32]' : 'text-[#1B5E20]'}`}>{item.name}</a>
        ))}

        <button onClick={connectWallet} className='bg-[#FF8F00] text-white font-bold text-sm px-4 py-2 rounded-full shadow-md hover:bg-[#F57C00]'>
          {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
        </button>
        <Link href="/auth" className='bg-[#1B5E20] text-white font-semibold px-5 py-2 rounded-full hover:bg-[#2E7D32]'>Login</Link>
      </div>

      <button className="md:hidden text-[#1B5E20]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="absolute top-full mt-4 left-0 w-full bg-white/90 backdrop-blur-2xl rounded-3xl p-6 flex flex-col gap-4 md:hidden">
            {allNavItems.map((item, i) => (
              <a key={i} href={item.href} onClick={(e) => handleClick(e, item.href)} className="text-[#1B5E20] font-bold border-b pb-2">{item.name}</a>
            ))}
            <button onClick={connectWallet} className='bg-[#FF8F00] text-white font-bold py-3 rounded-xl'>
              {walletAddress ? `${walletAddress.substring(0, 6)}...` : 'Connect Wallet'}
            </button>
            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className='bg-[#1B5E20] text-white text-center py-3 rounded-xl font-bold'>Log In</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}