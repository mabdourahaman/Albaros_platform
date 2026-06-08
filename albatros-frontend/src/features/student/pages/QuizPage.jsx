import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useSettings();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/quiz/${id}/questions`);
        const data = Array.isArray(response.data) ? response.data : [];
        setQuestions(data);
        const initialAnswers = {};
        data.forEach((q) => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error("Quiz load error:", err);
        setError(err.response?.data?.msg || "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [id]);

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: parseInt(selectedOption),
    }));
  };

  const handleSubmit = async () => {
    const allAnswered = Object.values(answers).every((val) => val !== null);
    if (!allAnswered) {
      alert("Please answer all questions.");
      return;
    }
    try {
      const response = await api.post(`/quiz/${id}/submit`, { answers });
      setResult(response.data);
      setSubmitted(true);
    } catch (err) {
      alert("Error submitting quiz.");
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="mt-6">
          <h2 className={`text-2xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>Result</h2>
          <div className="mt-4 text-4xl font-bold text-center text-blue-600">
            Score: {result.score}%
          </div>
          <div className="mt-4">
            {result.gaps && result.gaps.length > 0 && (
              <div className={`p-4 rounded-2xl ${darkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-50 text-yellow-800"}`}>
                <p className="font-bold">Weak points detected:</p>
                <ul className="list-disc list-inside">
                  {result.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/student/quizzes")}>
              ← Back to Quizzes
            </Button>
            <Button onClick={() => navigate("/student")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <Card>
          <p className={`text-lg ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            No questions found for this quiz.
          </p>
          <Button className="mt-4" onClick={() => navigate("/student/quizzes")}>
            Back to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>Quiz</h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Answer all questions.</p>

      {questions.map((q, idx) => (
        <Card key={q.id} className="mt-6">
          <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
            {idx + 1}. {q.text}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[q.option1, q.option2, q.option3, q.option4].map((opt, optIdx) => (
              <button
                key={optIdx}
                onClick={() => handleAnswerChange(q.id, optIdx + 1)}
                className={`px-5 py-4 rounded-2xl border text-left font-bold transition-all duration-200 ${
                  answers[q.id] === optIdx + 1
                    ? darkMode
                      ? "border-blue-500 bg-blue-900/70 text-white"
                      : "border-blue-600 bg-blue-100 text-blue-800"
                    : darkMode
                    ? "border-slate-700 text-white hover:bg-slate-700"
                    : "border-slate-200 text-slate-900 hover:bg-amber-50"
                }`}
              >
                {String.fromCharCode(65 + optIdx)}. {opt}
              </button>
            ))}
          </div>
        </Card>
      ))}

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit}>Submit Quiz</Button>
      </div>
    </div>
  );
}