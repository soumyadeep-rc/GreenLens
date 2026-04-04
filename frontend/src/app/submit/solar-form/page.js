'use client';
import { motion } from 'framer-motion';
import { Sun, Upload, CheckCircle, Loader2, Home, Maximize } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

export default function SolarForm() {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    company: '',
    unitsGenerated: '',
    unitsCharged: '', 
    homeType: '',
    carpetArea: '',
    billFile: null
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, billFile: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.company || !formData.unitsGenerated || !formData.homeType || 
        !formData.carpetArea || !formData.billFile) {
      alert("⚠️ Please fill in all required fields, including home details and the report.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("solarCompany", formData.company);
      data.append("unitsGenerated", formData.unitsGenerated);
      data.append("unitsCharged", formData.unitsCharged || 0);
      data.append("homeType", formData.homeType);
      data.append("carpetArea", formData.carpetArea);
      data.append("bill", formData.billFile);

      const token = await getToken();

      const res = await axios.post("http://localhost:8000/api/v1/form/solar", data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });

      console.log('Backend Sync Response:', res.data);
      
      const tokensEarned = res.data.data.tokensEarned;
      const newTotal = res.data.data.newTotalTokens;

      setResponseMsg(`✅ Success! Earned ${tokensEarned} GT. Your new on-chain balance is ${newTotal} GT.`);
      setSubmitted(true);
      
      setTimeout(() => {
        setSubmitted(false);
        setResponseMsg('');
        setFormData({
          company: '',
          unitsGenerated: '',
          unitsCharged: '',
          homeType: '',
          carpetArea: '',
          billFile: null
        });
      }, 5000);

    } catch (error) {
      console.error("Submission error:", error);
      const errMsg = error.response?.data?.message || "Check if your Address/Wallet is set correctly in the DB.";
      alert(`❌ Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 py-12 px-4">
      <motion.div
        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-amber-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-amber-900 tracking-tight">Solar Rewards</h1>
            <p className="text-amber-700 font-medium">Sync generation data with your Web3 Wallet</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Provider Field */}
          <div>
            <label className="block text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
              Solar Provider *
            </label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              // ✅ ADDED placeholder:text-amber-400
              className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-600 outline-none transition-all text-amber-900 placeholder:text-amber-400"
              placeholder="e.g., Tata Power Solar, Tesla"
            />
          </div>

          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
                Generated (kWh) *
              </label>
              <input
                type="number"
                required
                value={formData.unitsGenerated}
                onChange={(e) => setFormData({ ...formData, unitsGenerated: e.target.value })}
                // ✅ ADDED text-amber-900 placeholder:text-amber-400
                className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 rounded-2xl focus:border-amber-600 outline-none transition-all text-amber-900 placeholder:text-amber-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
                Charged (kWh)
              </label>
              <input
                type="number"
                value={formData.unitsCharged}
                onChange={(e) => setFormData({ ...formData, unitsCharged: e.target.value })}
                // ✅ ADDED text-amber-900 placeholder:text-amber-400
                className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 rounded-2xl focus:border-amber-600 outline-none transition-all text-amber-900 placeholder:text-amber-400"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Home Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-amber-50/30 rounded-3xl border border-amber-100">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
                <Home className="w-4 h-4" /> Home Type *
              </label>
              <select
                required
                value={formData.homeType}
                onChange={(e) => setFormData({ ...formData, homeType: e.target.value })}
                // ✅ ADDED text-amber-900
                className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-2xl focus:border-amber-600 outline-none text-amber-900"
              >
                <option value="" className="text-amber-400">Select...</option>
                <option value="Apartment">Apartment</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Villa">Villa</option>
                <option value="Independent House">Independent House</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
                <Maximize className="w-4 h-4" /> Area (Sq Ft) *
              </label>
              <input
                type="number"
                required
                value={formData.carpetArea}
                onChange={(e) => setFormData({ ...formData, carpetArea: e.target.value })}
                // ✅ ADDED text-amber-900 placeholder:text-amber-400
                className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-2xl focus:border-amber-600 outline-none text-amber-900 placeholder:text-amber-400"
                placeholder="e.g. 1200"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">
              Verification Document *
            </label>
            <input
              type="file"
              id="bill-upload"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="bill-upload"
              className="w-full py-10 border-2 border-dashed border-amber-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-all group"
            >
              <Upload className="w-10 h-10 text-amber-400 group-hover:text-amber-600 mb-3" />
              <span className="text-amber-900 font-bold">
                {formData.billFile ? formData.billFile.name : 'Upload Generation Report'}
              </span>
              <span className="text-xs text-amber-500 mt-1">PDF, JPG, or PNG (Max 5MB)</span>
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={loading || submitted}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Syncing with Blockchain...</>
            ) : submitted ? (
              <><CheckCircle className="w-6 h-6" /> Success!</>
            ) : (
              'Verify & Mint Tokens'
            )}
          </motion.button>
        </form>

        {responseMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-center font-semibold"
          >
            {responseMsg}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}