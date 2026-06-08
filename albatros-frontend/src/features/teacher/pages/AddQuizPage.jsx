import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddQuizPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject_id: "",
    difficulty: "medium",
    questions: [
      {
        text: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correct_option: 1,
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/subjects");
        setSubjects(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({ ...prev, subject_id: res.data[0].id }));
        }
      } catch (err) {
        console.error("Erreur chargement matières", err);
      }
    };
    fetchSubjects();
  }, []);

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correct_option: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) return;
    const updated = [...form.questions];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, questions: updated }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...form.questions];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, questions: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validation
    if (!form.title.trim()) {
      setMessage("Veuillez saisir un titre.");
      setLoading(false);
      return;
    }
    if (!form.subject_id) {
      setMessage("Veuillez sélectionner une matière.");
      setLoading(false);
      return;
    }
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) {
        setMessage(`La question ${i + 1} est vide.`);
        setLoading(false);
        return;
      }
      if (!q.option1.trim() || !q.option2.trim() || !q.option3.trim() || !q.option4.trim()) {
        setMessage(`Veuillez remplir les 4 options pour la question ${i + 1}.`);
        setLoading(false);
        return;
      }
    }

    try {
      await api.post("/teacher/quizzes", form);
      navigate("/teacher/quizzes");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Erreur lors de la création du quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Créer un quiz
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          Ajoutez un titre, une matière et des questions à choix multiples.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <input
            type="text"
            placeholder="Titre du quiz"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            }`}
            required
          />

          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className={`w-full mt-4 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          >
            <option value="" disabled>Sélectionnez une matière</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>

          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className={`w-full mt-4 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
          </select>
        </Card>

        {form.questions.map((q, idx) => (
          <Card key={idx} className="relative">
            {form.questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xl font-bold"
                title="Supprimer cette question"
              >
                ✕
              </button>
            )}
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-slate-800"}`}>
              Question #{idx + 1}
            </h3>

            <textarea
              placeholder="Texte de la question"
              rows="2"
              value={q.text}
              onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              }`}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                placeholder="Option 1"
                value={q.option1}
                onChange={(e) => handleQuestionChange(idx, "option1", e.target.value)}
                className={`border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
                required
              />
              <input
                type="text"
                placeholder="Option 2"
                value={q.option2}
                onChange={(e) => handleQuestionChange(idx, "option2", e.target.value)}
                className={`border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
                required
              />
              <input
                type="text"
                placeholder="Option 3"
                value={q.option3}
                onChange={(e) => handleQuestionChange(idx, "option3", e.target.value)}
                className={`border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
                required
              />
              <input
                type="text"
                placeholder="Option 4"
                value={q.option4}
                onChange={(e) => handleQuestionChange(idx, "option4", e.target.value)}
                className={`border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
                required
              />
            </div>

            <select
              value={q.correct_option}
              onChange={(e) => handleQuestionChange(idx, "correct_option", parseInt(e.target.value))}
              className={`w-full mt-3 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              <option value="1">Option 1 correcte</option>
              <option value="2">Option 2 correcte</option>
              <option value="3">Option 3 correcte</option>
              <option value="4">Option 4 correcte</option>
            </select>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={addQuestion}>
            + Ajouter une question
          </Button>
        </div>

        {message && (
          <div className="text-sm text-center font-medium text-red-500">{message}</div>
        )}

        <div className="flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/teacher/quizzes")}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer le quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
}