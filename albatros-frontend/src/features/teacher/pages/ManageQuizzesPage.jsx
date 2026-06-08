import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ManageQuizzesPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // États pour le modal
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    subject_id: "",
    difficulty: "medium",
    questions: []
  });
  const [subjects, setSubjects] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchSubjects();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get("/teacher/quizzes");
      setQuizzes(res.data);
    } catch (err) {
      setError("Unable to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error("Error loading subjects", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await api.delete(`/teacher/quizzes/${id}`);
      fetchQuizzes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deleting quiz");
    }
  };

  // Ouvrir le modal et charger les données du quiz
  const openEditModal = async (quiz) => {
    try {
      const res = await api.get(`/teacher/quizzes/${quiz.id}`);
      setEditingQuiz(res.data);
      setEditForm({
        title: res.data.title,
        subject_id: res.data.subject_id,
        difficulty: res.data.difficulty,
        questions: res.data.questions.map(q => ({
          text: q.text,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correct_option: q.correct_option,
        }))
      });
    } catch (err) {
      alert("Error loading quiz data");
    }
  };

  const closeModal = () => {
    setEditingQuiz(null);
    setEditForm({
      title: "",
      subject_id: "",
      difficulty: "medium",
      questions: []
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...editForm.questions];
    updated[index][field] = value;
    setEditForm({ ...editForm, questions: updated });
  };

  const addQuestion = () => {
    setEditForm({
      ...editForm,
      questions: [
        ...editForm.questions,
        { text: "", option1: "", option2: "", option3: "", option4: "", correct_option: 1 }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (editForm.questions.length === 1) return;
    const updated = [...editForm.questions];
    updated.splice(index, 1);
    setEditForm({ ...editForm, questions: updated });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/teacher/quizzes/${editingQuiz.id}`, editForm);
      closeModal();
      fetchQuizzes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error updating quiz");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
            My Quizzes
          </h1>
          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            Manage the quizzes you have created.
          </p>
        </div>
        <Button onClick={() => navigate("/teacher/quizzes/add")}>+ Add</Button>
      </div>

      {quizzes.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No quizzes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="min-w-[300px] max-w-[400px] w-full mx-auto">
              <Card>
                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {quiz.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Subject ID: {quiz.subject_id}</p>
                <p className="text-sm mt-1">
                  Difficulty: <span className="capitalize">{quiz.difficulty}</span>
                </p>
                <p className="text-sm mt-1">Questions: {quiz.question_count}</p>
                <div className="mt-4 flex justify-between gap-4">
                  <Button variant="outline" size="sm" className="flex-1 text-center" onClick={() => openEditModal(quiz)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1 text-center" onClick={() => handleDelete(quiz.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition – inchangé mais parfaitement fonctionnel */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-slate-900"}`}>
              Edit Quiz: {editingQuiz.title}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <input
                type="text"
                name="title"
                placeholder="Quiz title"
                value={editForm.title}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              />
              <select
                name="subject_id"
                value={editForm.subject_id}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              >
                <option value="" disabled>Select a subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                name="difficulty"
                value={editForm.difficulty}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {editForm.questions.map((q, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? "border-slate-700" : "border-slate-200"} relative`}>
                  {editForm.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(idx)} className="absolute top-2 right-2 text-red-500">✕</button>
                  )}
                  <h4 className="font-bold mb-2">Question #{idx+1}</h4>
                  <textarea
                    placeholder="Question text"
                    rows={2}
                    value={q.text}
                    onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                      darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                    }`}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input placeholder="Option 1" value={q.option1} onChange={(e) => handleQuestionChange(idx, "option1", e.target.value)} className={`border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`} required />
                    <input placeholder="Option 2" value={q.option2} onChange={(e) => handleQuestionChange(idx, "option2", e.target.value)} className={`border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`} required />
                    <input placeholder="Option 3" value={q.option3} onChange={(e) => handleQuestionChange(idx, "option3", e.target.value)} className={`border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`} required />
                    <input placeholder="Option 4" value={q.option4} onChange={(e) => handleQuestionChange(idx, "option4", e.target.value)} className={`border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`} required />
                  </div>
                  <select value={q.correct_option} onChange={(e) => handleQuestionChange(idx, "correct_option", parseInt(e.target.value))} className={`mt-2 w-full border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"}`}>
                    <option value="1">Option 1 correct</option>
                    <option value="2">Option 2 correct</option>
                    <option value="3">Option 3 correct</option>
                    <option value="4">Option 4 correct</option>
                  </select>
                </div>
              ))}

              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={addQuestion}>+ Add a question</Button>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={modalLoading}>
                  {modalLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}