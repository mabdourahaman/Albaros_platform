import { Languages, Moon, Sun } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function SettingsControls() {
  const { language, setLanguage, darkMode, setDarkMode } = useSettings();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-white"
            : "bg-white border-slate-200 text-slate-700"
        }`}
      >
        <Languages size={18} />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent outline-none text-sm font-semibold"
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">AR</option>
        </select>
      </div>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-yellow-300"
            : "bg-white border-slate-200 text-slate-700"
        }`}
      >
        {darkMode ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}