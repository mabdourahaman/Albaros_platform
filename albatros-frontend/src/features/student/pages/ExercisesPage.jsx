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

  const [modalOpen, setModalOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [multiAnswers, setMultiAnswers] = useState([]);
  const [singleAnswer, setSingleAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isRevision, setIsRevision] = useState(false);

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

  const openExerciseModal = (exercise, isRev = false) => {
    setCurrentExercise(exercise);
    setIsRevision(isRev);
    setFeedback(null);
    if (exercise.multi_question) {
      setMultiAnswers(new Array(exercise.questions.length).fill(""));
    } else {
      setSingleAnswer("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentExercise(null);
    setMultiAnswers([]);
    setSingleAnswer("");
    setFeedback(null);
    if (feedback?.completed) {
      fetchData();
    }
  };

  const handleMultiAnswerChange = (idx, value) => {
    const newAnswers = [...multiAnswers];
    newAnswers[idx] = value;
    setMultiAnswers(newAnswers);
  };

  const handleSubmitMulti = async () => {
    if (multiAnswers.some(a => !a.trim())) {
      alert("Please answer all questions.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(`/student/exercises/${currentExercise.id}/submit`, {
        answers: multiAnswers,
        is_revision: isRevision,
      });
      setFeedback(response.data);
      if (!isRevision && response.data.completed) {
        fetchData();
      }
    } catch (err) {
      alert("Error submitting answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSingle = async () => {
    if (!singleAnswer.trim()) {
      alert("Please enter your answer.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(`/student/exercises/${currentExercise.id}/submit`, {
        answer: singleAnswer,
        is_revision: isRevision,
      });
      setFeedback(response.data);
      if (!isRevision && response.data.correct) {
        fetchData();
      }
    } catch (err) {
      alert("Error submitting answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatXP = (xp) => {
    if (xp === undefined || xp === null) return "";
    if (xp > 0) return `+${xp}`;
    return `${xp}`;
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
              {/* Bloc matière avec texte dynamique */}
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
                <p className="mt-3 text-sm text-blue-500">
                  {isExpanded ? "Click to hide exercises ↑" : "Click to see exercises →"}
                </p>
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
                          <Card key={ex.id} className="flex flex-col justify-between">
                            <div>
                              {ex.multi_question ? (
                                <>
                                  <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    Exercise #{ex.id} (Multi)
                                  </h4>
                                  <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                    Contains {ex.questions.length} questions
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    Exercise #{ex.id}
                                  </h4>
                                  <p className={`mt-2 text-sm line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                    {ex.question}
                                  </p>
                                </>
                              )}
                              <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                Difficulty: {ex.difficulty || "medium"}
                              </p>
                            </div>
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
                          <Card key={ex.id} className="flex flex-col justify-between">
                            <div>
                              {ex.multi_question ? (
                                <>
                                  <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    Exercise #{ex.id} (Multi)
                                  </h4>
                                  <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                    Contains {ex.questions.length} questions
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    Exercise #{ex.id}
                                  </h4>
                                  <p className={`mt-2 text-sm line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                    {ex.question}
                                  </p>
                                </>
                              )}
                              <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                Difficulty: {ex.difficulty || "medium"}
                              </p>
                            </div>
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

      {/* Modal - corrigé pour le mode sombre */}
      {modalOpen && currentExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className={`rounded-2xl w-full max-w-4xl shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                {currentExercise.multi_question ? "Multi‑question Exercise" : `Exercise #${currentExercise.id}`}
              </h2>
              <button onClick={closeModal} className="text-red-500 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {currentExercise.multi_question ? (
                !feedback ? (
                  <div className="space-y-6">
                    {currentExercise.questions.map((q, idx) => (
                      <div key={idx} className="border-b pb-4 last:border-b-0 dark:border-slate-700">
                        <p className={`text-lg font-medium mb-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                          {idx+1}. {q.text}
                        </p>
                        <textarea
                          rows="2"
                          placeholder="Your answer..."
                          value={multiAnswers[idx]}
                          onChange={(e) => handleMultiAnswerChange(idx, e.target.value)}
                          className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                            darkMode ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" : "bg-white border-slate-300 text-black"
                          }`}
                        />
                      </div>
                    ))}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={closeModal}>Cancel</Button>
                      <Button onClick={handleSubmitMulti} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit All Answers"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-6">
                      {feedback.results.map((res, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${res.correct ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                          <p className="font-bold">{idx+1}. {res.question}</p>
                          <p className="mt-1 text-sm">Your answer: <span className={res.correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>{res.user_answer || "(empty)"}</span></p>
                          <p className="mt-1 text-sm">Correct answer: <span className="font-semibold">{res.correct_answer}</span></p>
                          {res.explanation && <p className="mt-1 text-sm text-slate-500">{res.explanation}</p>}
                        </div>
                      ))}
                    </div>
                    <div className={`mt-6 p-4 rounded-xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                      <p className="font-bold">Results: {feedback.total_correct}/{feedback.total_questions} correct</p>
                      <p className="mt-2 text-sm">
                        {formatXP(feedback.xp_earned)} XP
                        {feedback.gems_earned > 0 ? `, +${feedback.gems_earned} gems` : ""}
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={closeModal}>Close</Button>
                    </div>
                  </div>
                )
              ) : (
                !feedback ? (
                  <div>
                    <p className={`text-lg ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {currentExercise.question}
                    </p>
                    <textarea
                      rows="3"
                      placeholder="Your answer..."
                      value={singleAnswer}
                      onChange={(e) => setSingleAnswer(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 mt-4 outline-none focus:ring-2 focus:ring-cyan-500 ${
                        darkMode ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" : "bg-white border-slate-300 text-black"
                      }`}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={closeModal}>Cancel</Button>
                      <Button onClick={handleSubmitSingle} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Answer"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`p-4 rounded-xl ${feedback.correct ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}>
                      <p className="font-bold">{feedback.correct ? "✓ Correct!" : "✗ Incorrect"}</p>
                      <p className="mt-1">Correct answer: {feedback.correct_answer}</p>
                      <p className="mt-1">{feedback.explanation}</p>
                      <p className="mt-2 text-sm">
                        {formatXP(feedback.xp_earned)} XP
                        {!isRevision && feedback.gems_earned > 0 ? `, +${feedback.gems_earned} gems` : ""}
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={closeModal}>Close</Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}