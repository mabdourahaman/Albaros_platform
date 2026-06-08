import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import SettingsControls from "../common/SettingsControls";
import ChangePasswordModal from "../common/ChangePasswordModal";
import { useSettings } from "../../context/SettingsContext";
import { logoutUser } from "../../services/authService";
import api from "../../services/api";

export default function Navbar({ role, onMenuClick }) {
  const { darkMode, t } = useSettings();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userInitial, setUserInitial] = useState("A");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/me");
        if (res.data?.username) {
          setUserInitial(res.data.username.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.error("Could not fetch user");
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <header className={`h-20 border-b flex items-center justify-between px-4 md:px-8 ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-slate-900" : "bg-slate-100"}`}>
          <Menu size={22} />
        </button>
        <div>
          <h2 className="text-lg font-bold capitalize">
            {role === "student" ? "Student Dashboard" : role === "teacher" ? "Teacher Dashboard" : "Admin Dashboard"}
          </h2>
          <p className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Albatros</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SettingsControls />

        <button className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center ${darkMode ? "bg-slate-900" : "bg-slate-100"}`}>
          <Bell size={20} />
        </button>

        {/* Avatar avec menu déroulant */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold hover:bg-cyan-600 transition"
          >
            {userInitial}
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-20 ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowPasswordModal(true);
                  }}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition ${darkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-100 text-slate-700"}`}
                >
                  <Settings size={16} />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition ${darkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-100 text-slate-700"}`}
                >
                  <LogOut size={16} />
                  <span>{t.logout || "Logout"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </header>
  );
}