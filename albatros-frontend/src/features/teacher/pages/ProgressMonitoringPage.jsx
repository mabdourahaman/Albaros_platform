import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import ProgressChart from "../../../components/charts/ProgressChart";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ProgressMonitoringPage() {
  const { darkMode } = useSettings();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/teacher/progress");
        setProgressData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Progress Monitoring
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Monitor the global progress of students.
      </p>
      <Card className="mt-6">
        <ProgressChart data={progressData} />
      </Card>
    </div>
  );
}