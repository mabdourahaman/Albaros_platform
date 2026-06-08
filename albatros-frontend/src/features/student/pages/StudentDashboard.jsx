import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Trophy } from "lucide-react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function StudentDashboard() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, gapsRes, leaderboardRes] = await Promise.all([
          api.get("/user/me"),
          api.get("/student/gaps"),
          api.get("/leaderboard/global"),
        ]);
        setUser(userRes.data);
        setGaps(Array.isArray(gapsRes.data) ? gapsRes.data : []);
        setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  const weakTopics = gaps.map((gap) => {
    const level = typeof gap.level === 'number' ? gap.level : 0;
    const score = Math.floor(100 - level);
    return {
      name: gap.concept || "Unknown",
      score: isNaN(score) ? 0 : score,
    };
  });

  const handleTopicClick = (concept) => {
    navigate(`/student/recommendations?concept=${encodeURIComponent(concept)}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-3xl p-6 md:p-8 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-100 font-medium">Smart School Assistant</p>
            <h1 className="text-3xl md:text-5xl font-extrabold mt-2">
              Welcome back, {user?.username || "Student"}!
            </h1>
            <p className="mt-3 text-blue-100">
              Continue learning and improve your weak topics today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={24} />
              <h2 className="text-2xl font-extrabold">Weak Topics</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weakTopics.map((topic) => (
                <div
                  key={topic.name}
                  onClick={() => handleTopicClick(topic.name)}
                  className="bg-white/20 rounded-xl p-3 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{topic.name}</span>
                    <span className="text-lg font-bold">{topic.score}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${topic.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-yellow-500" size={28} />
          <h2 className={`text-2xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
            Student Ranking
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`border-b ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <tr>
                <th className="py-2 text-left">Rank</th>
                <th className="py-2 text-left">Student</th>
                <th className="py-2 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((student, idx) => (
                <tr key={student.id} className={`border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
                  <td className="py-2 font-bold">{idx + 1}</td>
                  <td className="py-2">{student.username}</td>
                  <td className="py-2 text-right">{student.total_xp} XP</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-slate-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}