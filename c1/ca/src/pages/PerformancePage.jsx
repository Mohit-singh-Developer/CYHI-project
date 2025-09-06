import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function PerformancePage({ token, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/performance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data available</p>;

  const chartData = [
    { name: "Completed", value: data.completed },
    { name: "Remaining", value: data.total - data.completed },
  ];

  const COLORS = ["#4caf50", "#f44336"]; // green, red

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📊 Your Performance</h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={5}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>

            {/* Centered Label */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: "22px", fontWeight: "bold" }}
            >
              {data.completionRate}%
            </text>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 text-lg">
        <p>✅ Completed: {data.completed}</p>
        <p>📌 Total Tasks: {data.total}</p>
        <p>⏰ Overdue: {data.overdue}</p>
      </div>

      <button
        onClick={onBack}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        🔙 Back
      </button>
    </div>
  );
}
