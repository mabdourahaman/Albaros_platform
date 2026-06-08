import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSettings } from "../../context/SettingsContext";

export default function DashboardLayout({ role }) {
  const { darkMode } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen((prev) => !prev);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop (pleine hauteur, ne défile pas) */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar role={role} />
      </div>

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar mobile (tiroir) */}
      <div
        className={`fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar role={role} onLinkClick={closeMobileMenu} />
      </div>

      {/* Contenu principal (occupe tout l'espace, défilement interne) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role={role} onMenuClick={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}