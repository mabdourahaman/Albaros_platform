import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function StudentQuizzesPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, quizzesRes, resultsRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/quizzes"),
          api.get("/student/results")
        ]);
        setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
        
        const completedIds = new Set();
        if (Array.isArray(resultsRes.data)) {
          resultsRes.data.forEach(result => {
            completedIds.add(result.quiz_id);
          });
        }
        setCompletedQuizIds(completedIds);
      } catch (err) {
        console.error("API error:", err);
        setError(`Error ${err.response?.status}: ${err.response?.data?.msg || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubjectClick = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const quizzesForSubject = (subjectId) => {
    return quizzes.filter((quiz) => quiz.subject_id === subjectId);
  };

  const separateQuizzes = (subjectQuizzes) => {
    const newQuizzes = [];
    const completedQuizzes = [];
    subjectQuizzes.forEach(quiz => {
      if (completedQuizIds.has(quiz.id)) {
        completedQuizzes.push(quiz);
      } else {
        newQuizzes.push(quiz);
      }
    });
    return { newQuizzes, completedQuizzes };
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Quizzes
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Choose a subject to see available quizzes.
      </p>

      <div className="mt-6 space-y-4">
        {subjects.length === 0 && (
          <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            No subjects available.
          </div>
        )}
        {subjects.map((subject) => {
          const subjectQuizzes = quizzesForSubject(subject.id);
          const { newQuizzes, completedQuizzes } = separateQuizzes(subjectQuizzes);
          const hasAny = newQuizzes.length > 0 || completedQuizzes.length > 0;
          const isExpanded = expandedSubject === subject.id;

          return (
            <div key={subject.id}>
              {/* Bloc matière (toujours visible) */}
              <div
                onClick={() => handleSubjectClick(subject.id)}
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
                  {isExpanded ? "Click to hide quizzes ↑" : "Click to see quizzes →"}
                </p>
              </div>

              {/* Liste des quiz (affichée si développé) */}
              {isExpanded && (
                <div className="mt-4 pl-4 space-y-6">
                  {newQuizzes.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-white" : "text-slate-800"}`}>
                        New Quizzes
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {newQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                            className="cursor-pointer transition"
                          >
                            <Card className="hover:scale-[1.01] transition-all duration-200">
                              <div className={`rounded-2xl p-5 transition ${darkMode ? "hover:bg-slate-700" : "hover:bg-amber-50"}`}>
                                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                  {quiz.title}
                                </h3>
                                <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                  Difficulty: {quiz.difficulty}
                                </p>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedQuizzes.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-white" : "text-slate-800"}`}>
                        Completed Quizzes (Revision)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                            className="cursor-pointer transition"
                          >
                            <Card className="hover:scale-[1.01] transition-all duration-200">
                              <div className={`rounded-2xl p-5 transition ${darkMode ? "hover:bg-slate-700" : "hover:bg-amber-50"}`}>
                                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                  {quiz.title}
                                </h3>
                                <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                                  Difficulty: {quiz.difficulty}
                                </p>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasAny && (
                    <Card>
                      <p className={`text-center ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                        No quizzes available for this subject yet.
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}