import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import StatsCard from "../../../components/charts/StatsCard";
import Card from "../../../components/common/Card";
import ProgressChart from "../../../components/charts/ProgressChart";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/teacher/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Teacher Dashboard</h1>
      <p className="mt-2 text-slate-500">Manage your courses and monitor student progress.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <StatsCard title="Courses" value={stats?.courses || 0} icon={<BookOpen />} />
        <StatsCard title="Exercises" value={stats?.exercises || 0} icon={<ClipboardList />} />
        <StatsCard title="Students" value={stats?.students || 0} icon={<Users />} />
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-extrabold text-slate-900">Class Progress</h2>
        <ProgressChart />
      </Card>
    </div>
  );
}