// src/components/layout/DashboardLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSettings } from "../../context/SettingsContext";

export default function DashboardLayout({ role }) {
  const { darkMode } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Sidebar for desktop - fixed, ne défile pas avec la page */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-72">
        <Sidebar role={role} />
      </div>

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      {/* Sidebar mobile - fixed également */}
      <div
        className={`fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar role={role} onLinkClick={closeMobileMenu} />
      </div>

      {/* Contenu principal avec marge gauche sur desktop pour éviter le recouvrement */}
      <div className="lg:ml-72 min-h-screen flex flex-col">
        <Navbar role={role} onMenuClick={toggleMobileMenu} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}