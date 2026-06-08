import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ManageExercisesPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // États pour le modal d'édition
  const [editingExercise, setEditingExercise] = useState(null);
  const [editForm, setEditForm] = useState({
    course_id: "",
    question_text: "",
    correct_answer: "",
    explanation: "",
    difficulty: "easy",
    tags: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchExercises();
    fetchCourses();
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await api.get("/teacher/exercises");
      setExercises(res.data);
    } catch (err) {
      setError("Unable to load exercises.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/teacher/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Error loading courses", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exercise?")) return;
    try {
      await api.delete(`/teacher/exercises/${id}`);
      fetchExercises();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deleting exercise");
    }
  };

  // Ouvrir le modal avec les données de l'exercice
  const openEditModal = async (exercise) => {
    try {
      const res = await api.get(`/teacher/exercises/${exercise.id}`);
      setEditingExercise(res.data);
      setEditForm({
        course_id: res.data.course_id,
        question_text: res.data.question_text,
        correct_answer: res.data.correct_answer,
        explanation: res.data.explanation || "",
        difficulty: res.data.difficulty,
        tags: res.data.tags || "",
      });
    } catch (err) {
      alert("Error loading exercise data");
    }
  };

  const closeModal = () => {
    setEditingExercise(null);
    setEditForm({
      course_id: "",
      question_text: "",
      correct_answer: "",
      explanation: "",
      difficulty: "easy",
      tags: "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/teacher/exercises/${editingExercise.id}`, editForm);
      closeModal();
      fetchExercises();
    } catch (err) {
      alert(err.response?.data?.msg || "Error updating exercise");
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
            My Exercises
          </h1>
          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            Manage the exercises you have created.
          </p>
        </div>
        <Button onClick={() => navigate("/teacher/exercises/add")}>+ Add</Button>
      </div>

      {exercises.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No exercises yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exercises.map((ex) => (
            <div key={ex.id} className="min-w-[300px] max-w-[400px] w-full mx-auto">
              <Card>
                <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {ex.question_text}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Course ID: {ex.course_id}</p>
                <p className="text-sm mt-1">
                  Difficulty: <span className="capitalize">{ex.difficulty}</span>
                </p>
                {ex.tags && (
                  <p className="text-xs text-slate-400 mt-1">Tags: {ex.tags}</p>
                )}
                <div className="mt-4 flex justify-between gap-4">
                  <Button variant="outline" size="sm" className="flex-1 text-center" onClick={() => openEditModal(ex)}>Edit</Button>
                  <Button variant="danger" size="sm" className="flex-1 text-center" onClick={() => handleDelete(ex.id)}>Delete</Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      {editingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-slate-900"}`}>
              Edit Exercise
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <select
                name="course_id"
                value={editForm.course_id}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              >
                <option value="" disabled>Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} (ID: {course.id})
                  </option>
                ))}
              </select>

              <textarea
                name="question_text"
                placeholder="Question"
                rows="3"
                value={editForm.question_text}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              />

              <input
                type="text"
                name="correct_answer"
                placeholder="Correct answer"
                value={editForm.correct_answer}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              />

              <textarea
                name="explanation"
                placeholder="Explanation (optional)"
                rows="2"
                value={editForm.explanation}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
              />

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

              <input
                type="text"
                name="tags"
                placeholder="Tags (comma separated)"
                value={editForm.tags}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
              />

              <div className="flex justify-end gap-3 mt-4">
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