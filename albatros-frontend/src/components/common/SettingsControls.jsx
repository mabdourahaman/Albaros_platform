import { useSettings } from "../../context/SettingsContext";

export default function SettingsControls() {
  const { language, setLanguage, darkMode, setDarkMode } = useSettings();

  return (
    <div className="flex items-center gap-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`px-3 py-2 rounded-xl border text-sm font-bold outline-none cursor-pointer ${
          darkMode
            ? "bg-slate-900 text-white border-slate-700"
            : "bg-white text-slate-900 border-slate-200"
        }`}
      >
        <option
          value="en"
          className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
        >
          EN
        </option>

        <option
          value="fr"
          className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
        >
          FR
        </option>

        <option
          value="ar"
          className={darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}
        >
          AR
        </option>
      </select>

      <button
        type="button"
        onClick={() => setDarkMode(!darkMode)}
        className={`px-3 py-2 rounded-xl border text-sm font-bold transition ${
          darkMode
            ? "bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
            : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
    </div>
  );
}