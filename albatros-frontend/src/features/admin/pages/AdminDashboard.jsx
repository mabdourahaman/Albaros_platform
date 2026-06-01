import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Users, Clock } from "lucide-react";
import StatsCard from "../../../components/charts/StatsCard";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AdminDashboard() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, subjects: 0, content: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await api.get("/admin/stats/users");
        const subjectsRes = await api.get("/admin/stats/subjects");
        const contentRes = await api.get("/admin/stats/content");

        setStats({
          users: usersRes.data.total,
          subjects: subjectsRes.data.count,
          content: contentRes.data.total,
        });
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className={`text-center py-10 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Chargement...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Admin Dashboard
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Manage users, subjects, and content.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <StatsCard title="Users" value={stats.users} icon={<Users />} />
        <StatsCard title="Subjects" value={stats.subjects} icon={<BookOpen />} />
        <StatsCard title="Content Items" value={stats.content} icon={<FileText />} />
      </div>

      {/* Carte d’accès rapide - inscriptions en attente */}
      <div className={`mt-8 rounded-2xl p-5 flex items-center justify-between ${
        darkMode ? "bg-blue-950 border border-blue-800" : "bg-blue-50 border border-blue-200"
      }`}>
        <div className="flex items-center gap-3">
          <Clock size={28} className="text-blue-600" />
          <div>
            <h3 className={`font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
              Pending Registrations
            </h3>
            <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              Validate or reject new user accounts
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/pending-users")}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Manage
        </button>
      </div>
    </div>
  );
}