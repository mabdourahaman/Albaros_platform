import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import SettingsControls from "../common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { logoutUser } from "../../services/authService";

export default function Navbar({ role, onMenuClick }) {
  const { darkMode, t } = useSettings();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const title = {
    student: t.studentDashboard || "Student Dashboard",
    teacher: t.teacherDashboard || "Teacher Dashboard",
    admin: t.adminDashboard || "Admin Dashboard",
  };

  function handleLogout() {
    logoutUser();
    navigate("/");
  }

  function handleSettings() {
    setShowDropdown(false);
    navigate(`/${role}/settings`);
  }

  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : "A";

  return (
    <header
      className={`h-20 border-b flex items-center justify-between px-4 md:px-8 ${
        darkMode
          ? "bg-slate-950 border-slate-800 text-white"
          : "bg-white border-slate-100 text-slate-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition ${
            darkMode
              ? "bg-slate-900 hover:bg-slate-800"
              : "bg-slate-100 hover:bg-slate-200"
          }`}
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-bold capitalize">{title[role]}</h2>
          <p
            className={`text-sm ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Albatros
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SettingsControls />

        <button
          type="button"
          className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center transition ${
            darkMode
              ? "bg-slate-900 hover:bg-slate-800"
              : "bg-slate-100 hover:bg-slate-200"
          }`}
        >
          <Bell size={20} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold hover:bg-cyan-600 transition"
          >
            {avatarLetter}
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              <div
                className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-20 overflow-hidden ${
                  darkMode
                    ? "bg-slate-900 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`px-4 py-3 border-b ${
                    darkMode ? "border-slate-700" : "border-slate-100"
                  }`}
                >
                  <p className="font-bold text-sm">
                    {user.username || "Albatros User"}
                  </p>
                  <p
                    className={`text-xs capitalize ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {user.role || role}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSettings}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-bold transition ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-200"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Settings size={18} />
                  <span>{t.settings || "Settings"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-bold transition border-t ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-200 border-slate-700"
                      : "hover:bg-slate-100 text-slate-700 border-slate-100"
                  }`}
                >
                  <LogOut size={18} />
                  <span>{t.logout || "Logout"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}