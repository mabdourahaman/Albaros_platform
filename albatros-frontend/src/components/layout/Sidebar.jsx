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
  Settings,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function Sidebar({ role, onLinkClick }) {
  const { t } = useSettings();

  const links = {
    student: [
      { label: t.dashboard || "Dashboard", to: "/student", icon: LayoutDashboard },
      { label: t.courses || "Courses", to: "/student/courses", icon: BookOpen },
      { label: t.quiz || "Quiz", to: "/student/quiz", icon: ClipboardList },
      { label: t.exercises || "Exercises", to: "/student/exercises", icon: FilePlus },
      { label: t.recommendations || "Recommendations", to: "/student/recommendations", icon: GraduationCap },
      { label: t.progress || "Progress", to: "/student/progress", icon: BarChart3 },
      { label: t.scores || "Scores", to: "/student/scores", icon: BarChart3 },
    ],

    teacher: [
      { label: t.dashboard || "Dashboard", to: "/teacher", icon: LayoutDashboard },
      { label: t.courses || "Courses", to: "/teacher/courses", icon: BookOpen },
      { label: t.addCourse || "Add Course", to: "/teacher/courses/add", icon: FilePlus },
      { label: t.addExercise || "Add Exercise", to: "/teacher/exercises/add", icon: ClipboardList },
      { label: t.students || "Students", to: "/teacher/students", icon: Users },
      { label: t.monitoring || "Monitoring", to: "/teacher/monitoring", icon: BarChart3 },
    ],

    admin: [
      { label: t.dashboard || "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: t.users || "Users", to: "/admin/users", icon: Users },
      { label: t.pendingUsers || "Pending Users", to: "/admin/pending-users", icon: Clock },
      { label: t.subjects || "Subjects", to: "/admin/subjects", icon: BookOpen },
      { label: t.content || "Content", to: "/admin/content", icon: FilePlus },
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