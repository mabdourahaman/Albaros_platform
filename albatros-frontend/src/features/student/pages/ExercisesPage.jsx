import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ExercisesPage() {
  const { darkMode } = useSettings();
  const [subjects, setSubjects] = useState([]);
  const [newExercises, setNewExercises] = useState([]);
  const [revisionExercises, setRevisionExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isRevision, setIsRevision] = useState(false);

  // Afficher le message d'avertissement pendant 10 secondes
  useEffect(() => {
    setShowWarning(true);
    const timer = setTimeout(() => setShowWarning(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, newRes, revisionRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/student/exercises"),
        api.get("/student/exercises/revision"),
      ]);
      setSubjects(subjectsRes.data);
      setNewExercises(newRes.data);
      setRevisionExercises(revisionRes.data);
    } catch (err) {
      setError("Unable to load exercises.");
    } finally {
      setLoading(false);
    }
  };

  // Récupère les exercices d'une matière (nouveaux)
  const getNewExercisesBySubject = (subjectId) => {
    // Il faudrait que l'objet exercise contienne subject_id. Actuellement ce n'est pas le cas.
    // On doit donc enrichir les données en faisant une jointure. Pour l'instant, on simule avec un filtre vide.
    // Idéalement, le backend devrait retourner subject_id. Si ce n'est pas le cas, on peut faire un deuxième appel.
    // Solution simple : récupérer les cours et associer. Mais pour rester simple, je suppose que l'exercice a un champ subject_id.
    // Si ce n'est pas le cas, il faut modifier le backend.
    // Je propose une approche alternative : on récupère les cours et on fait le mapping.
    // Pour ne pas surcharger, je fournis une version qui suppose que les exercices ont subject_id.
    // Si ce n'est pas le cas, vous devrez adapter le backend.
    return newExercises.filter(ex => ex.subject_id === subjectId);
  };

  const getRevisionExercisesBySubject = (subjectId) => {
    return revisionExercises.filter(ex => ex.subject_id === subjectId);
  };

  const openExerciseModal = (exercise, isRev = false) => {
    setCurrentExercise(exercise);
    setUserAnswer("");
    setFeedback(null);
    setIsRevision(isRev);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentExercise(null);
    setUserAnswer("");
    setFeedback(null);
    if (feedback?.completed) {
      fetchData();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("Please enter your answer.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(`/student/exercises/${currentExercise.id}/submit`, {
        answer: userAnswer,
        is_revision: isRevision,
      });
      setFeedback(response.data);
      if (!isRevision && response.data.correct) {
        // Recharger les listes
        fetchData();
      }
    } catch (err) {
      alert("Error submitting answer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>Exercises</h1>
        {showWarning && (
          <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm">
            ⚠️ Write the answer fully, including the variable name if needed. Example: "x = 4" is different from "4".
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {subjects.map((subject) => {
          const newEx = newExercises.filter(ex => ex.subject_id === subject.id);
          const revEx = revisionExercises.filter(ex => ex.subject_id === subject.id);
          const hasExercises = newEx.length > 0 || revEx.length > 0;
          if (!hasExercises) return null;

          const isExpanded = expandedSubject === subject.id;
          return (
            <div key={subject.id}>
              {/* Bloc matière */}
              <div
                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                className={`cursor-pointer rounded-2xl p-6 shadow-md border transition hover:scale-[1.01] ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <h2 className="text-2xl font-bold">{subject.name}</h2>
                {subject.description && (
                  <p className={`mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    {subject.description}
                  </p>
                )}
                <p className="mt-3 text-sm text-blue-500">Click to see exercises →</p>
              </div>

              {/* Liste des exercices (visible si expand) */}
              {isExpanded && (
                <div className="mt-4 pl-4 space-y-6">
                  {newEx.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-white" : "text-slate-800"}`}>
                        New Exercises
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {newEx.map((ex) => (
                          <Card key={ex.id}>
                            <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                              Exercise #{ex.id}
                            </h4>
                            <p className="mt-2 text-sm line-clamp-2">{ex.question}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Difficulty: {ex.difficulty || "medium"}
                            </p>
                            <Button className="mt-3 w-full" onClick={() => openExerciseModal(ex, false)}>
                              Start
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {revEx.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-white" : "text-slate-800"}`}>
                        Revision
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {revEx.map((ex) => (
                          <Card key={ex.id}>
                            <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                              Exercise #{ex.id}
                            </h4>
                            <p className="mt-2 text-sm line-clamp-2">{ex.question}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Difficulty: {ex.difficulty || "medium"}
                            </p>
                            <Button className="mt-3 w-full" variant="outline" onClick={() => openExerciseModal(ex, true)}>
                              Review
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {subjects.filter(s => {
          const newEx = newExercises.filter(ex => ex.subject_id === s.id);
          const revEx = revisionExercises.filter(ex => ex.subject_id === s.id);
          return newEx.length > 0 || revEx.length > 0;
        }).length === 0 && (
          <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            No exercises available.
          </div>
        )}
      </div>

      {/* Modal (inchangé) */}
      {modalOpen && currentExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`rounded-2xl w-full max-w-2xl shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                Exercise #{currentExercise.id}
              </h2>
              <button onClick={closeModal} className="text-red-500 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className={`text-lg ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                {currentExercise.question}
              </p>
              <textarea
                rows="3"
                placeholder="Your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={!!feedback}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" : "bg-white border-slate-300 text-black"
                } ${feedback ? "opacity-70" : ""}`}
              />
              {feedback && (
                <div className={`p-4 rounded-xl ${feedback.correct ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}>
                  <p className="font-bold">{feedback.correct ? "✓ Correct!" : "✗ Incorrect"}</p>
                  <p className="mt-1">Correct answer: {feedback.correct_answer}</p>
                  <p className="mt-1">{feedback.explanation}</p>
                  <p className="mt-2 text-sm">+{feedback.xp_earned} XP{!isRevision && feedback.gems_earned > 0 ? `, +${feedback.gems_earned} gems` : ""}</p>
                </div>
              )}
              {!feedback && (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleSubmitAnswer} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
              )}
              {feedback && (
                <div className="flex justify-end">
                  <Button onClick={closeModal}>Close</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}