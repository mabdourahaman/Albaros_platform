import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get("/student/recommendations");
        setRecommendations(response.data);
      } catch (err) {
        setError("Impossible de charger les recommandations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleOpen = (item) => {
    if (item.type === "Exercises") {
      navigate(`/student/exercises/${item.id}`);
    } else if (item.type === "Quiz") {
      navigate(`/student/quiz/${item.id}`);
    } else if (item.type === "Course") {
      navigate(`/student/courses/${item.id}`);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">
        AI Recommendations
      </h1>
      <p className="mt-2 text-slate-500">
        Personalized suggestions based on your progress.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {recommendations.map((item) => (
          <Card key={item.id}>
            <p className="text-sm text-cyan-600 font-bold">{item.subject}</p>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">
              {item.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Type: {item.type}
            </p>
            <p className="mt-3 text-slate-500">{item.description}…</p>
            <Button className="mt-5 w-full" onClick={() => handleOpen(item)}>
              Open
            </Button>
          </Card>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center text-slate-500 mt-10">
          Aucune recommandation pour le moment. Continuez à apprendre !
        </div>
      )}
    </div>
  );
}