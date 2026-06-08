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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, quizzesRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/quizzes"),
        ]);
        console.log("Subjects data:", subjectsRes.data);
        console.log("Quizzes data:", quizzesRes.data);
        setSubjects(subjectsRes.data || []);
        setQuizzes(quizzesRes.data || []);
      } catch (err) {
        console.error("API error:", err);
        if (err.response) {
          setError(`Error ${err.response.status}: ${err.response.data?.msg || "Unknown error"}`);
        } else if (err.request) {
          setError("No response from server. Is the backend running?");
        } else {
          setError(err.message);
        }
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
          return (
            <div key={subject.id}>
              {expandedSubject !== subject.id ? (
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
                  <p className="mt-3 text-sm text-blue-500">Click to see quizzes →</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleSubjectClick(subject.id)}
                    className={`mb-2 text-sm underline ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    ← Back to subjects
                  </button>
                  {subjectQuizzes.length === 0 ? (
                    <Card>
                      <p className={`text-center ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                        No quizzes available for this subject yet.
                      </p>
                    </Card>
                  ) : (
                    subjectQuizzes.map((quiz) => (
                      <Card
                        key={quiz.id}
                        className="cursor-pointer hover:shadow-lg transition"
                        onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                      >
                        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                          {quiz.title}
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                          Difficulty: {quiz.difficulty}
                        </p>
                      </Card>
                    ))
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