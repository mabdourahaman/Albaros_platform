import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddExercisePage() {
  const navigate = useNavigate();
  const { darkMode } = useSettings();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    course_id: "",
    question_text: "",
    correct_answer: "",
    explanation: "",
    difficulty: "easy",
    tags: "",
  });

  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState("");

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function fetchCourses() {
    try {
      setCoursesLoading(true);
      const response = await api.get("/teacher/courses");
      setCourses(response.data);

      if (response.data.length > 0) {
        setForm((prev) => ({
          ...prev,
          course_id: String(response.data[0].id),
        }));
      }
    } catch (err) {
      setError("Unable to load courses.");
    } finally {
      setCoursesLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/teacher/exercises", {
        ...form,
        course_id: Number(form.course_id),
      });

      navigate("/teacher/courses");
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to create exercise.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div>
      <h1
        className={`text-3xl font-extrabold ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        Add Exercise
      </h1>

      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Create exercises linked to one of your courses.
      </p>

      <form
        onSubmit={handleSubmit}
        className={`mt-6 rounded-3xl p-6 border max-w-3xl space-y-5 ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-100"
        }`}
      >
        <div>
          <label className="block mb-2 text-sm font-bold">Course</label>
          <select
            name="course_id"
            value={form.course_id}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={coursesLoading || courses.length === 0}
          >
            {coursesLoading && <option>Loading courses...</option>}

            {!coursesLoading && courses.length === 0 && (
              <option value="">No courses available</option>
            )}

            {!coursesLoading &&
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Question</label>
          <textarea
            name="question_text"
            placeholder="Write the exercise question"
            rows="4"
            value={form.question_text}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Correct answer</label>
          <input
            name="correct_answer"
            placeholder="Correct answer"
            value={form.correct_answer}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Explanation</label>
          <textarea
            name="explanation"
            placeholder="Explanation"
            rows="3"
            value={form.explanation}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Tags</label>
          <input
            name="tags"
            placeholder="fractions, grammar, vocabulary"
            value={form.tags}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700 font-bold">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || coursesLoading || courses.length === 0}
        >
          {loading ? "Saving..." : "Save Exercise"}
        </Button>
      </form>
    </div>
  );
}