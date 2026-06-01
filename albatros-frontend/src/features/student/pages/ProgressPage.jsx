import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import ProgressChart from "../../../components/charts/ProgressChart";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ProgressPage() {
  const { darkMode } = useSettings();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get("/student/results");
        const results = response.data;

        // Grouper les scores par jour et calculer la moyenne par jour (ou prendre le dernier score du jour)
        const dailyScores = {};
        results.forEach((result) => {
          const date = new Date(result.date).toLocaleDateString("en-CA"); // format YYYY-MM-DD
          if (!dailyScores[date]) {
            dailyScores[date] = { total: 0, count: 0 };
          }
          dailyScores[date].total += result.score;
          dailyScores[date].count += 1;
        });

        // Convertir en tableau pour le graphique (ex: dernières 7 jours)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString("en-CA");
          const dayName = d.toLocaleDateString("default", { weekday: "short" });
          const scoreData = dailyScores[dateStr];
          const avgScore = scoreData ? Math.round(scoreData.total / scoreData.count) : 0;
          last7Days.push({ day: dayName, score: avgScore });
        }

        setProgressData(last7Days);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données de progression.");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className={`text-center ${darkMode ? "text-red-400" : "text-red-500"}`}>{error}</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Progress Tracking
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Follow your improvement over time.
      </p>

      <Card className="mt-6">
        <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Weekly Performance
        </h2>
        <ProgressChart data={progressData} />
      </Card>
    </div>
  );
}