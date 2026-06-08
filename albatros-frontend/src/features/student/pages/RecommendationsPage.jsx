import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function RecommendationsPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedConcept, setExpandedConcept] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gapsRes, recosRes] = await Promise.all([
          api.get("/student/gaps"),
          api.get("/student/recommendations"),
        ]);
        setGaps(Array.isArray(gapsRes.data) ? gapsRes.data : []);
        setRecommendations(Array.isArray(recosRes.data) ? recosRes.data : []);
      } catch (err) {
        setError("Unable to load recommendations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Regrouper les recommandations par concept (tag)
  const groupedByConcept = recommendations.reduce((acc, item) => {
    const concept = item.concept || "general";
    if (!acc[concept]) acc[concept] = [];
    acc[concept].push(item);
    return acc;
  }, {});

  // Ne garder que les gaps qui ont au moins une recommandation
  const gapsWithRecommendations = gaps.filter(gap => groupedByConcept[gap.concept]?.length > 0);

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
      <div className="mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          AI Recommendations
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          Personalized exercises to strengthen your weak topics.
        </p>
      </div>

      {gapsWithRecommendations.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No recommendations yet. Complete more quizzes to identify weak topics.
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {gapsWithRecommendations.map((gap) => {
            const concept = gap.concept;
            const exercises = groupedByConcept[concept] || [];
            const isExpanded = expandedConcept === concept;
            return (
              <div key={concept}>
                {/* Bloc du gap (cliquable) */}
                <div
                  onClick={() => setExpandedConcept(isExpanded ? null : concept)}
                  className={`cursor-pointer rounded-2xl p-6 shadow-md border transition hover:scale-[1.01] ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <h2 className="text-2xl font-bold">{concept}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Weakness level: {Math.floor(100 - (gap.level || 0))}%
                  </p>
                  <p className="mt-3 text-sm text-blue-500">Click to see recommendations →</p>
                </div>

                {/* Liste des exercices (visible si expand) */}
                {isExpanded && (
                  <div className="mt-4 pl-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {exercises.map((item) => (
                        <Card key={item.id} className="hover:-translate-y-1 transition">
                          <p className="text-sm text-cyan-600 font-bold">{item.subject}</p>
                          <h3 className={`mt-2 text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">Type: {item.type}</p>
                          <p className={`mt-3 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                            {item.description}…
                          </p>
                          <Button className="mt-5 w-full" onClick={() => handleOpen(item)}>
                            Open
                          </Button>
                        </Card>
                      ))}
                      {exercises.length === 0 && (
                        <div className="col-span-full text-center text-slate-500">
                          No exercises available for this topic.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}