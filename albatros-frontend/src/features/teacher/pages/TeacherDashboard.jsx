import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardList, Users, GraduationCap } from "lucide-react";
import StatsCard from "../../../components/charts/StatsCard";
import Card from "../../../components/common/Card";
import ProgressChart from "../../../components/charts/ProgressChart";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function TeacherDashboard() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ courses: 0, exercises: 0, students: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, quizzesRes] = await Promise.all([
          api.get("/teacher/stats"),
          api.get("/teacher/quizzes")
        ]);
        setStats({
          courses: statsRes.data.courses || 0,
          exercises: statsRes.data.exercises || 0,
          students: statsRes.data.students || 0,
          quizzes: quizzesRes.data.length || 0
        });
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
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Teacher Dashboard
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Manage your courses and monitor student progress.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        <StatsCard
          title="Courses"
          value={stats.courses}
          icon={<BookOpen />}
          onClick={() => navigate("/teacher/courses")}
        />
        <StatsCard
          title="Exercises"
          value={stats.exercises}
          icon={<ClipboardList />}
          onClick={() => navigate("/teacher/exercises")}
        />
        <StatsCard
          title="Quizzes"
          value={stats.quizzes}
          icon={<GraduationCap />}
          onClick={() => navigate("/teacher/quizzes")}
        />
        <StatsCard
          title="Students"
          value={stats.students}
          icon={<Users />}
          onClick={() => navigate("/teacher/students")}
        />
      </div>

      <Card className="mt-6">
        <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Class Progress
        </h2>
        <ProgressChart />
      </Card>
    </div>
  );
}