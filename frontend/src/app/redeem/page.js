'use client';
import React, { useState, useEffect } from "react";
import { products } from "../data/product.js";
import axios from "axios";
import { useAuth } from "@clerk/nextjs"; // ✅ ADDED CLERK AUTH
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  productId: products[0]?.id ?? "",
  quantity: 1,
  notes: "",
  agree: false,
};

const validateEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).toLowerCase());

export default function SubmitPage() {
  const { getToken } = useAuth(); // ✅ INITIALIZE CLERK
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (!form.productId && products.length) {
      setForm((f) => ({ ...f, productId: products[0].id }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim() || !validateEmail(form.email)) errs.email = "Valid email required";
    if (!form.address.trim()) errs.address = "Shipping address is required";
    if (!form.agree) errs.agree = "You must confirm to burn tokens";
    if (!form.productId) errs.productId = "Select a product";
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Quantity must be >= 1";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    
    const selectedProduct = products.find((p) => p.id === Number(form.productId));
    const totalCost = selectedProduct ? selectedProduct.price * form.quantity : 0;
    
    try {
      const token = await getToken(); // ✅ GRAB AUTH TOKEN
      if (!token) throw new Error("Please log in to redeem items.");

      // ✅ SEND TO BACKEND FOR WEB3 BURNING
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/store/redeem`, {
    productId: form.productId,
    quantity: form.quantity,
    totalCost: totalCost,
    shippingDetails: {
      name: form.name,
      address: form.address,
      phone: form.phone
    }
}, {
    headers: { "Authorization": `Bearer ${token}` } // ✅ INJECT AUTH
});

      setSuccess(true);
      alert(`🔥 Redeemed successfully! New Balance: ${res.data.data.newTotalTokens} GT`);
      
      setForm((f) => ({ ...initialForm, productId: f.productId }));
    } catch (error) {
      console.error("Redemption failed:", error);
      alert(error.response?.data?.message || `Failed to redeem. You need ${totalCost} GT.`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#E8F5E9] flex flex-col items-center justify-center p-6">
        <CheckCircle className="w-24 h-24 text-[#2E7D32] mb-6" />
        <h1 className="text-4xl font-bold text-[#1B5E20] mb-4">Redemption Successful!</h1>
        <p className="text-[#2E7D32] text-lg mb-8 text-center max-w-md">
          Your tokens have been successfully burned on the blockchain and your order has been sent to fulfillment.
        </p>
        <Link href="/store" className="bg-[#1B5E20] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#0E3311] transition-all shadow-lg">
          Return to Store
        </Link>
      </div>
    );
  }

  // Calculate current cart cost dynamically
  const currentProduct = products.find((p) => p.id === Number(form.productId));
  const currentCost = currentProduct ? currentProduct.price * form.quantity : 0;

  return (
      <div className="min-h-screen py-12 bg-gradient-to-b from-[#A5D6A7] to-[#E8F5E9]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 relative">
          
          <Link href="/store" className="absolute -top-6 left-4 flex items-center gap-2 text-green-900 font-bold hover:text-green-700 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Store
          </Link>

          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-green-900 mb-8 mt-6">
            Checkout & Redeem
          </h2>
          
          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm border border-green-200 shadow-xl rounded-3xl p-8 md:p-10">
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                Please fill all required fields correctly.
              </div>
            )}
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div className="md:col-span-2 p-6 bg-green-50 rounded-2xl border border-green-100 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="w-full">
                  <label className="text-sm font-bold text-green-900 mb-2 block">Select Reward *</label>
                  <select name="productId" value={form.productId} onChange={handleChange} className="w-full p-3 rounded-xl border border-green-300 bg-white text-green-900 outline-none focus:border-green-600">
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.price} GT</option>
                    ))}
                  </select>
                 </div>
                 <div className="w-full md:w-32">
                  <label className="text-sm font-bold text-green-900 mb-2 block">Quantity *</label>
                  <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="w-full p-3 rounded-xl border border-green-300 bg-white text-green-900 outline-none focus:border-green-600" />
                 </div>
                 <div className="w-full md:w-48 text-right bg-white p-3 rounded-xl border border-green-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Cost</p>
                    <p className="text-2xl font-black text-green-800">{currentCost} GT</p>
                 </div>
              </div>

              {/* Shipping Details */}
              <div className="md:col-span-2"><h3 className="text-xl font-bold text-green-900 border-b border-green-100 pb-2 mt-4">Shipping Details</h3></div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className={`w-full p-3 rounded-xl border bg-gray-50 outline-none focus:border-green-600 ${errors.name ? "border-red-500" : "border-gray-200"}`} placeholder="John Doe" />
              </div>
  
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Email *</label>
                <input name="email" value={form.email} onChange={handleChange} className={`w-full p-3 rounded-xl border bg-gray-50 outline-none focus:border-green-600 ${errors.email ? "border-red-500" : "border-gray-200"}`} placeholder="john@example.com" type="email" />
              </div>
  
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-green-600" placeholder="+91 98765 43210" />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-700 block mb-1">Delivery Address *</label>
                <textarea name="address" value={form.address} onChange={handleChange} className={`w-full p-3 rounded-xl border bg-gray-50 outline-none focus:border-green-600 ${errors.address ? "border-red-500" : "border-gray-200"}`} rows="3" placeholder="Full shipping address..." />
              </div>
            </div>
  
            <div className="mt-8 p-5 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
              <input type="checkbox" id="agree" name="agree" checked={form.agree} onChange={handleChange} className="mt-1 w-5 h-5 accent-orange-600" />
              <label htmlFor="agree" className="text-sm text-orange-900 font-medium cursor-pointer">
                I confirm that my shipping details are accurate. I understand that clicking submit will permanently deduct (burn) <strong>{currentCost} GT</strong> from my Web3 wallet. *
              </label>
            </div>
  
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#1B5E20] hover:bg-[#0E3311] transition-colors"}`}
            >
              {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Processing Transaction...</> : `Pay ${currentCost} GT to Redeem`}
            </button>
          </form>
        </div>
      </div>
    );
}