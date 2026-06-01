import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useSettings } from "../../context/SettingsContext";

export default function ProgressChart({ data = [] }) {
  const { darkMode } = useSettings();

  // Couleurs adaptatives
  const axisColor = darkMode ? "#94a3b8" : "#64748b";
  const gridColor = darkMode ? "#334155" : "#e2e8f0";
  const lineColor = "#2563eb"; // bleu constant, mais on pourrait le changer

  // Personnalisation du tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 rounded shadow border dark:border-slate-700">
          <p className="text-sm font-bold dark:text-white">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Score : {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Si aucune donnée, afficher un message
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="h-72 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" stroke={axisColor} tick={{ fill: axisColor }} />
          <YAxis
            stroke={axisColor}
            tick={{ fill: axisColor }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke={lineColor}
            strokeWidth={4}
            dot={{ r: 5, fill: lineColor, stroke: lineColor }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}