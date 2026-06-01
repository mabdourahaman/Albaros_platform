import { useSettings } from "../../context/SettingsContext";

export default function Card({ children, className = "" }) {
  const { darkMode } = useSettings();

  return (
    <div
      className={`rounded-3xl border shadow-sm p-5 transition ${
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}