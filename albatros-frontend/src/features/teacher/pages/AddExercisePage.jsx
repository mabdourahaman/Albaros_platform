import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import api from "../../../services/api";

export default function AddExercisePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    course_id: "",
    question_text: "",
    correct_answer: "",
    explanation: "",
    difficulty: "easy",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/teacher/exercises", form);
      navigate("/teacher/exercises");
    } catch (err) {
      setError("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Add Exercise</h1>
      <p className="mt-2 text-slate-500">Create exercises for your courses.</p>
      <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-3xl p-6 border border-slate-100 max-w-3xl space-y-4">
        <input
          name="course_id"
          placeholder="Course ID"
          value={form.course_id}
          onChange={handleChange}
          className="w-full border rounded-2xl px-4 py-3"
          required
        />
        <textarea
          name="question_text"
          placeholder="Exercise question"
          rows="4"
          value={form.question_text}
          onChange={handleChange}
          className="w-full border rounded-2xl px-4 py-3"
          required
        />
        <input
          name="correct_answer"
          placeholder="Correct answer"
          value={form.correct_answer}
          onChange={handleChange}
          className="w-full border rounded-2xl px-4 py-3"
          required
        />
        <textarea
          name="explanation"
          placeholder="Explanation (optional)"
          rows="3"
          value={form.explanation}
          onChange={handleChange}
          className="w-full border rounded-2xl px-4 py-3"
        />
        <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          name="tags"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={handleChange}
          className="w-full border rounded-2xl px-4 py-3"
        />
        {error && <div className="text-red-500">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Exercise"}</Button>
      </form>
    </div>
  );
}