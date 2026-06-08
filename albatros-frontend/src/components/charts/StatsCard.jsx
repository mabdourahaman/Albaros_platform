import Card from "../common/Card";
import { useSettings } from "../../context/SettingsContext";

export default function StatsCard({ title, value, icon, color = "bg-blue-50 text-blue-700", onClick }) {
  const { darkMode } = useSettings();

  return (
    <div onClick={onClick} className="cursor-pointer transition-transform hover:scale-105">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {title}
            </p>
            <h3 className={`mt-2 text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
              {value}
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </Card>
    </div>
  );
}