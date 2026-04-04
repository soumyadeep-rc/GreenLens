'use client';
import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#2E7D32", "#66BB6A", "#81C784", "#A5D6A7"];

export default function GraphComponent({ monthlyTokens = [], activityBreakdown = [] }) {
  const totalTokens = monthlyTokens.reduce((sum, m) => sum + m.tokens, 0);
  const lastMonthTokens = monthlyTokens.length > 1 ? monthlyTokens[monthlyTokens.length - 2].tokens : 0;
  const currentMonthTokens = monthlyTokens.length > 0 ? monthlyTokens[monthlyTokens.length - 1].tokens : 0;

  // Custom label for the pie chart to make it cleaner
  const renderCustomizedLabel = ({ name, percent }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    // Removed min-h-screen, reduced padding, softened shadow
    <div className="w-full bg-gradient-to-b from-[#A5D6A7] to-[#E8F5E9] p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-emerald-900">
        Your Activity Overview
      </h2>
      
      {/* Top Stat Cards - Made slightly more compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow-sm p-4 rounded-xl border-t-4 border-green-700">
          <h3 className="text-sm text-gray-500 font-medium">Total Tokens Earned (6mo)</h3>
          <p className="text-2xl font-bold text-green-800 mt-1">{totalTokens}</p>
        </div>
        <div className="bg-white shadow-sm p-4 rounded-xl border-t-4 border-emerald-600">
          <h3 className="text-sm text-gray-500 font-medium">Last Month</h3>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{lastMonthTokens}</p>
        </div>
        <div className="bg-white shadow-sm p-4 rounded-xl border-t-4 border-lime-600">
          <h3 className="text-sm text-gray-500 font-medium">Current Month</h3>
          <p className="text-2xl font-bold text-lime-800 mt-1">{currentMonthTokens}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm h-[350px] flex flex-col">
          <h3 className="text-md font-bold mb-4 text-green-800">
            Monthly Green Tokens
          </h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTokens} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <Line type="monotone" dataKey="tokens" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm h-[350px] flex flex-col">
          <h3 className="text-md font-bold mb-2 text-green-800">
            Token Breakdown
          </h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={90} /* REDUCED FROM 150 SO LABELS FIT */
                  innerRadius={45} /* Added inner radius for a modern donut look */
                  fill="#2E7D32"
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={true}
                  paddingAngle={2}
                >
                  {activityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Tokens`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}