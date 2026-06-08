import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddExercisePage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();

  // État pour un tableau d'exercices
  const [exercises, setExercises] = useState([
    {
      course_id: "",
      question_text: "",
      correct_answer: "",
      explanation: "",
      difficulty: "easy",
      tags: "",
    },
  ]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  // Charger les cours de l'enseignant connecté
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/teacher/courses");
        setCourses(res.data);
        if (res.data.length > 0) {
          // Préremplir le premier exercice avec le premier cours
          setExercises((prev) =>
            prev.map((ex, idx) =>
              idx === 0 ? { ...ex, course_id: res.data[0].id } : ex
            )
          );
        }
      } catch (err) {
        console.error("Erreur chargement cours", err);
        setMessage("Impossible de charger vos cours.");
      }
    };
    fetchCourses();
  }, []);

  // Gérer le changement pour un champ spécifique d'un exercice
  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  // Ajouter un nouvel exercice vide
  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        course_id: courses.length > 0 ? courses[0].id : "",
        question_text: "",
        correct_answer: "",
        explanation: "",
        difficulty: "easy",
        tags: "",
      },
    ]);
  };

  // Supprimer un exercice
  const removeExercise = (index) => {
    if (exercises.length === 1) return;
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  // Soumettre tous les exercices un par un
  const handleSubmitAll = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessCount(0);

    // Validation basique
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.course_id || !ex.question_text.trim() || !ex.correct_answer.trim()) {
        setMessage(`Exercice ${i + 1} : veuillez remplir le cours, la question et la réponse.`);
        return;
      }
    }

    setLoading(true);
    let success = 0;
    let errors = [];

    for (let i = 0; i < exercises.length; i++) {
      try {
        await api.post("/teacher/exercises", exercises[i]);
        success++;
      } catch (err) {
        errors.push(`Exercice ${i + 1} : ${err.response?.data?.msg || err.message}`);
      }
    }

    setLoading(false);
    if (errors.length === 0) {
      setMessage(`✅ ${success} exercice(s) créé(s) avec succès !`);
      setSuccessCount(success);
      // Réinitialiser le formulaire après succès ?
      setExercises([
        {
          course_id: courses.length > 0 ? courses[0].id : "",
          question_text: "",
          correct_answer: "",
          explanation: "",
          difficulty: "easy",
          tags: "",
        },
      ]);
      // Redirection après 2 secondes
      setTimeout(() => navigate("/teacher/exercises"), 2000);
    } else {
      setMessage(`⚠️ ${success} succès, ${errors.length} échec(s) : ${errors.join("; ")}`);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  const isErrorMessage = (msg) => {
    const lowerMsg = msg.toLowerCase();
    return (
      lowerMsg.includes("erreur") ||
      lowerMsg.includes("unauthorized") ||
      lowerMsg.includes("non autorisé") ||
      lowerMsg.includes("échec") ||
      lowerMsg.includes("invalid")
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Ajouter des exercices
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          Créez un ou plusieurs exercices pour vos cours.
        </p>
      </div>

      <form onSubmit={handleSubmitAll} className="space-y-6">
        {exercises.map((ex, idx) => (
          <Card key={idx} className="relative">
            {exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeExercise(idx)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xl font-bold"
                title="Supprimer cet exercice"
              >
                ✕
              </button>
            )}
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-slate-800"}`}>
              Exercice #{idx + 1}
            </h3>

            <div className="space-y-4">
              {/* Sélection du cours */}
              <select
                value={ex.course_id}
                onChange={(e) => handleExerciseChange(idx, "course_id", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
                required
              >
                <option value="" disabled>Sélectionnez un cours</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} (ID: {course.id})
                  </option>
                ))}
              </select>

              {/* Question */}
              <textarea
                placeholder="Question de l'exercice"
                rows="3"
                value={ex.question_text}
                onChange={(e) => handleExerciseChange(idx, "question_text", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                }`}
                required
              />

              {/* Réponse correcte */}
              <input
                type="text"
                placeholder="Réponse correcte"
                value={ex.correct_answer}
                onChange={(e) => handleExerciseChange(idx, "correct_answer", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                }`}
                required
              />

              {/* Explication (optionnelle) */}
              <textarea
                placeholder="Explication (optionnelle)"
                rows="2"
                value={ex.explanation}
                onChange={(e) => handleExerciseChange(idx, "explanation", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                }`}
              />

              {/* Difficulté */}
              <select
                value={ex.difficulty}
                onChange={(e) => handleExerciseChange(idx, "difficulty", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>

              {/* Tags */}
              <input
                type="text"
                placeholder="Tags (séparés par des virgules, optionnel)"
                value={ex.tags}
                onChange={(e) => handleExerciseChange(idx, "tags", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                }`}
              />
            </div>
          </Card>
        ))}

        {/* Bouton pour ajouter un exercice */}
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={addExercise}>
            + Ajouter un autre exercice
          </Button>
        </div>

        {message && (
          <div
            className={`text-sm text-center font-medium ${
              isErrorMessage(message) ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/teacher/exercises")}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Création en cours..." : `Créer ${exercises.length} exercice(s)`}
          </Button>
        </div>
      </form>
    </div>
  );
}