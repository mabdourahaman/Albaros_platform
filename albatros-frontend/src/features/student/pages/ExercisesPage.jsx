import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function ExercisesPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await api.get("/student/exercises");
        setExercises(response.data);
      } catch (err) {
        setError("Impossible de charger les exercices.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const handleStartExercise = (exerciseId) => {
    // Redirige vers une page d'exercice dédiée (à créer)
    navigate(`/student/exercises/${exerciseId}`);
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">
        Personalized Exercises
      </h1>
      <p className="mt-2 text-slate-500">
        Practice exercises recommended for your level.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <h2 className="text-xl font-extrabold text-slate-900">
              Exercise #{exercise.id}
            </h2>
            <p className="mt-2 text-slate-500 line-clamp-2">
              {exercise.question}
            </p>
            <p className="mt-1 text-slate-500">
              Difficulty: {exercise.difficulty || "medium"}
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() => handleStartExercise(exercise.id)}
            >
              Start Exercise
            </Button>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center text-slate-500 mt-10">
          No exercises available at the moment. Check back later.
        </div>
      )}
    </div>
  );
}