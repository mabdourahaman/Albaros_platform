import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddExercisePage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();

  // Structure d’un exercice : contient une liste de questions
  const [exercises, setExercises] = useState([
    {
      course_id: "",
      difficulty: "easy",
      xp_reward: 20,
      tags: "",
      questions: [
        { text: "", correct_answer: "", explanation: "" }
      ]
    }
  ]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Charger les cours de l'enseignant connecté
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/teacher/courses");
        setCourses(res.data);
        if (res.data.length > 0) {
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

  // Gestion des champs de l'exercice (cours, difficulté, XP, tags)
  const handleExerciseChange = (exIndex, field, value) => {
    const updated = [...exercises];
    updated[exIndex][field] = value;
    setExercises(updated);
  };

  // Gestion des champs d'une question spécifique
  const handleQuestionChange = (exIndex, qIndex, field, value) => {
    const updated = [...exercises];
    updated[exIndex].questions[qIndex][field] = value;
    setExercises(updated);
  };

  // Ajouter une question à un exercice
  const addQuestion = (exIndex) => {
    const updated = [...exercises];
    updated[exIndex].questions.push({ text: "", correct_answer: "", explanation: "" });
    setExercises(updated);
  };

  // Supprimer une question d'un exercice (au moins une question reste)
  const removeQuestion = (exIndex, qIndex) => {
    const updated = [...exercises];
    if (updated[exIndex].questions.length > 1) {
      updated[exIndex].questions.splice(qIndex, 1);
      setExercises(updated);
    }
  };

  // Ajouter un nouvel exercice (vide)
  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        course_id: courses.length > 0 ? courses[0].id : "",
        difficulty: "easy",
        xp_reward: 20,
        tags: "",
        questions: [{ text: "", correct_answer: "", explanation: "" }]
      }
    ]);
  };

  // Supprimer un exercice
  const removeExercise = (exIndex) => {
    if (exercises.length === 1) return;
    const updated = [...exercises];
    updated.splice(exIndex, 1);
    setExercises(updated);
  };

  // Validation et soumission
  const handleSubmitAll = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validation : tous les champs doivent être remplis
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.course_id) {
        setMessage(`Exercice ${i + 1} : veuillez sélectionner un cours.`);
        setLoading(false);
        return;
      }
      for (let j = 0; j < ex.questions.length; j++) {
        const q = ex.questions[j];
        if (!q.text.trim() || !q.correct_answer.trim()) {
          setMessage(`Exercice ${i + 1}, question ${j + 1} : veuillez remplir le texte et la réponse correcte.`);
          setLoading(false);
          return;
        }
      }
    }

    let success = 0;
    let errors = [];

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      // Format attendu par le backend pour les exercices multi‑questions
      const payload = {
        course_id: ex.course_id,
        difficulty: ex.difficulty,
        xp_reward: ex.xp_reward,
        tags: ex.tags,
        multi_question: true,
        questions: ex.questions
      };
      try {
        await api.post("/teacher/exercises", payload);
        success++;
      } catch (err) {
        errors.push(`Exercice ${i + 1} : ${err.response?.data?.msg || err.message}`);
      }
    }

    setLoading(false);
    if (errors.length === 0) {
      setMessage(`✅ ${success} exercice(s) multi‑questions créé(s) avec succès !`);
      // Réinitialiser le formulaire
      setExercises([
        {
          course_id: courses.length > 0 ? courses[0].id : "",
          difficulty: "easy",
          xp_reward: 20,
          tags: "",
          questions: [{ text: "", correct_answer: "", explanation: "" }]
        }
      ]);
      setTimeout(() => navigate("/teacher/exercises"), 2000);
    } else {
      setMessage(`⚠️ ${success} succès, ${errors.length} échec(s) : ${errors.join("; ")}`);
    }
  };

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
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Ajouter des exercices (multi‑questions)
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          Chaque exercice peut contenir plusieurs questions.
        </p>
      </div>

      <form onSubmit={handleSubmitAll} className="space-y-8">
        {exercises.map((ex, exIdx) => (
          <Card key={exIdx} className="relative">
            {/* Bouton supprimer l'exercice */}
            {exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeExercise(exIdx)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xl font-bold"
                title="Supprimer cet exercice"
              >
                ✕
              </button>
            )}
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-slate-800"}`}>
              Exercice #{exIdx + 1}
            </h3>

            {/* Infos générales de l'exercice */}
            <div className="space-y-4">
              <select
                value={ex.course_id}
                onChange={(e) => handleExerciseChange(exIdx, "course_id", e.target.value)}
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

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={ex.difficulty}
                  onChange={(e) => handleExerciseChange(exIdx, "difficulty", e.target.value)}
                  className={`border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                    darkMode
                      ? "bg-slate-800 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>

                <input
                  type="number"
                  placeholder="XP (récompense)"
                  value={ex.xp_reward}
                  onChange={(e) => handleExerciseChange(exIdx, "xp_reward", parseInt(e.target.value) || 0)}
                  className={`border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                    darkMode
                      ? "bg-slate-800 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <input
                type="text"
                placeholder="Tags (séparés par des virgules, optionnel)"
                value={ex.tags}
                onChange={(e) => handleExerciseChange(exIdx, "tags", e.target.value)}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                }`}
              />
            </div>

            {/* Liste des questions */}
            <div className="mt-6">
              <h4 className={`text-lg font-bold mb-3 ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                Questions de l'exercice
              </h4>
              {ex.questions.map((q, qIdx) => (
                <div key={qIdx} className="relative border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                  {ex.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(exIdx, qIdx)}
                      className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-sm font-bold"
                    >
                      ✕ Supprimer cette question
                    </button>
                  )}
                  <div className="space-y-3">
                    <textarea
                      placeholder="Texte de la question"
                      rows="2"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(exIdx, qIdx, "text", e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                        darkMode
                          ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                          : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                      }`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Réponse correcte"
                      value={q.correct_answer}
                      onChange={(e) => handleQuestionChange(exIdx, qIdx, "correct_answer", e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                        darkMode
                          ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                          : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                      }`}
                      required
                    />
                    <textarea
                      placeholder="Explication (optionnelle)"
                      rows="1"
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(exIdx, qIdx, "explanation", e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                        darkMode
                          ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                          : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => addQuestion(exIdx)}
              >
                + Ajouter une question à cet exercice
              </Button>
            </div>
          </Card>
        ))}

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