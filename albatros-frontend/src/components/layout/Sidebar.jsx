import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  FilePlus,
  GraduationCap,
  Clock,
  FileText
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function Sidebar({ role, onLinkClick }) {
  const { t } = useSettings();

  const links = {
    student: [
      { label: t.dashboard, to: "/student", icon: LayoutDashboard },
      { label: t.courses, to: "/student/courses", icon: BookOpen },
      { label: t.quiz, to: "/student/quizzes", icon: ClipboardList },
      { label: t.exercises, to: "/student/exercises", icon: FilePlus },
      { label: t.recommendations, to: "/student/recommendations", icon: GraduationCap },
      { label: t.progress, to: "/student/progress", icon: BarChart3 },
      { label: t.scores, to: "/student/scores", icon: BarChart3 },
    ],

    teacher: [
      { label: t.dashboard, to: "/teacher", icon: LayoutDashboard },
      { label: t.courses, to: "/teacher/courses", icon: BookOpen },
      { label: "Exercices", to: "/teacher/exercises", icon: ClipboardList },
      { label: "Quiz", to: "/teacher/quizzes", icon: GraduationCap },
      { label: t.students, to: "/teacher/students", icon: Users },
      { label: t.monitoring, to: "/teacher/monitoring", icon: BarChart3 },

    ],

    admin: [
      { label: t.dashboard, to: "/admin", icon: LayoutDashboard },
      { label: t.users, to: "/admin/users", icon: Users },
      { label: t.pendingUsers, to: "/admin/pending-users", icon: Clock },
      { label: t.subjects, to: "/admin/subjects", icon: BookOpen },
      { label: t.content, to: "/admin/content", icon: FileText },
    ],
  };

  const currentLinks = links[role] || [];

  return (
    <aside className="group w-20 hover:w-72 bg-cyan-600 text-white min-h-screen p-4 flex flex-col transition-all duration-300 overflow-hidden">
      <div className="mb-8 flex items-center gap-3">
        <div className="min-w-12 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <GraduationCap size={28} />
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          <h1 className="text-xl font-extrabold leading-tight">Albatros</h1>
          <p className="text-sm text-cyan-100 capitalize">{role} space</p>
        </div>
      </div>

      <nav className="space-y-2">
        {currentLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => {
                if (onLinkClick) onLinkClick();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-cyan-700"
                    : "text-cyan-50 hover:bg-white/10"
                }`
              }
            >
              <Icon size={21} className="min-w-6" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}