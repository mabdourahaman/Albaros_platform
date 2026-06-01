import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function QuizPage() {
  const { id } = useParams(); // Récupère l'ID du quiz depuis l'URL
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les questions du quiz
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/quiz/${id}/questions`);
        setQuestions(response.data);
        // Initialiser les réponses vides
        const initialAnswers = {};
        response.data.forEach((q) => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError("Impossible de charger le quiz.");
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
    // Vérifier que toutes les questions ont une réponse
    const allAnswered = Object.values(answers).every((val) => val !== null);
    if (!allAnswered) {
      alert("Veuillez répondre à toutes les questions.");
      return;
    }

    try {
      const response = await api.post(`/quiz/${id}/submit`, { answers });
      setResult(response.data);
      setSubmitted(true);
    } catch (err) {
      alert("Erreur lors de la soumission.");
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="mt-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Résultat</h2>
          <div className="mt-4 text-4xl font-bold text-center">
            Score : {result.score}%
          </div>
          <div className="mt-4">
            {result.gaps && result.gaps.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-2xl">
                <p className="font-bold">Points faibles détectés :</p>
                <ul className="list-disc list-inside">
                  {result.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button className="mt-6" onClick={() => navigate("/student")}>
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900">Quiz</h1>
      <p className="mt-2 text-slate-500">Répondez à toutes les questions.</p>

      {questions.map((q, idx) => (
        <Card key={q.id} className="mt-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            {idx + 1}. {q.text}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[q.option1, q.option2, q.option3, q.option4].map((opt, optIdx) => (
              <button
                key={optIdx}
                onClick={() => handleAnswerChange(q.id, optIdx + 1)}
                className={`px-5 py-4 rounded-2xl border text-left font-bold transition ${
                  answers[q.id] === optIdx + 1
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {String.fromCharCode(65 + optIdx)}. {opt}
              </button>
            ))}
          </div>
        </Card>
      ))}

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          Valider le quiz
        </Button>
      </div>
    </div>
  );
}