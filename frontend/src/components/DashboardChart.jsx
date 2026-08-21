import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";

export const DashboardChart = ({ distribution = [], trend = [] }) => {
  const COLORS = {
    "Likely Real": "#059669",
    "Likely Manipulated": "#dc2626",
    "Inconclusive": "#d97706",
  };

  const hasDistributionData = distribution.some((d) => d.value > 0);

  const customPieData = hasDistributionData
    ? distribution
    : [{ name: "No Data Yet", value: 1, color: "#e2e8f0" }];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
      
      {/* Donut Chart: Verdict Distribution */}
      <div className="saas-card" style={{ padding: "20px 24px", minHeight: "340px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-primary-light)",
            color: "var(--color-primary)",
            display: "flex"
          }}>
            <PieIcon size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>Verification Distribution</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>Likely Real vs Manipulated breakdown</p>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={customPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {customPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || entry.color || "#2563eb"}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  color: "#0f172a",
                  fontSize: "0.85rem"
                }}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(val) => <span style={{ color: "#475569", fontSize: "0.8rem", fontWeight: 500 }}>{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart */}
      <div className="saas-card" style={{ padding: "20px 24px", minHeight: "340px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "8px",
            background: "var(--color-purple-bg)",
            color: "var(--color-accent-purple)",
            display: "flex"
          }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>Verification Activity Trend</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>7-day media verification volume</p>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: "220px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  color: "#0f172a",
                  fontSize: "0.85rem"
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Total Scans"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
