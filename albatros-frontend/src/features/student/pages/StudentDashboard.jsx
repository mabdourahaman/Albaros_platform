import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, GraduationCap, Trophy } from "lucide-react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import ProgressChart from "../../../components/charts/ProgressChart";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function StudentDashboard() {
  const { darkMode } = useSettings();
  const [user, setUser] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, gapsRes, exercisesRes, scoresRes] = await Promise.all([
          api.get("/user/me"),
          api.get("/student/gaps"),
          api.get("/student/exercises"),
          api.get("/student/results"),
        ]);
        setUser(userRes.data);
        setGaps(gapsRes.data);
        setExercises(exercisesRes.data);
        setScores(scoresRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  // Calcul du progrès global : moyenne des scores des quiz
  const totalProgress = scores.length
    ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length)
    : 0;

  // Transforme les lacunes en format attendu par l'affichage
  const weakTopics = gaps.map((gap) => ({
    name: gap.concept,
    score: Math.floor(100 - gap.mastery_level),
  }));

  // Recommandations : on utilise les exercices personnalisés
  const recommendations = exercises.map((ex, idx) => ({
    id: ex.id,
    subject:
      ex.difficulty === "easy"
        ? "Beginner"
        : ex.difficulty === "medium"
        ? "Intermediate"
        : "Advanced",
    type: "Exercises",
    description: ex.question,
    title: `Exercise ${idx + 1}`,
  }));

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
          <div className="w-36 h-36 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white text-blue-700 flex items-center justify-center text-3xl font-extrabold">
              {totalProgress}%
            </div>
          </div>
        </div>
      </motion.div>

      {weakTopics.length > 0 && (
        <Card className="bg-orange-500 text-white border-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h2 className="text-2xl font-extrabold">Weak Topics</h2>
              <div className="mt-4 bg-white/90 text-slate-900 rounded-2xl p-4 space-y-2 max-w-md">
                {weakTopics.map((topic) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between text-lg font-bold"
                  >
                    <span>{topic.name}</span>
                    <span>{topic.score}%</span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="secondary" className="text-lg px-8">
              Review now
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h2
          className={`text-2xl font-extrabold mb-4 ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Recommendations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendations.map((item) => {
            const icons = {
              Course: <BookOpen size={42} />,
              Exercises: <ClipboardList size={42} />,
              Quiz: <GraduationCap size={42} />,
            };
            const colors = {
              Course: "bg-sky-100 text-sky-700",
              Exercises: "bg-yellow-100 text-yellow-700",
              Quiz: "bg-violet-100 text-violet-700",
            };
            const type = item.type;
            return (
              <Card key={item.id} className="hover:-translate-y-1 transition">
                <div
                  className={`h-28 rounded-3xl flex items-center justify-center ${colors[type]}`}
                >
                  {icons[type]}
                </div>
                <h3
                  className={`mt-4 text-xl font-extrabold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {item.subject}
                </h3>
                <p className="text-sm font-bold text-cyan-600">{type}</p>
                <p
                  className={`mt-2 text-sm ${
                    darkMode ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {item.description.substring(0, 80)}...
                </p>
              </Card>
            );
          })}
          {recommendations.length === 0 && (
            <div
              className={`col-span-full text-center py-10 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              No recommendations yet. Complete more exercises to get personalized
              suggestions.
            </div>
          )}
        </div>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500" />
          <h2
            className={`text-xl font-extrabold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Weekly Progress
          </h2>
        </div>
        <ProgressChart />
      </Card>
    </div>
  );
}