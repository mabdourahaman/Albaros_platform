import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ManageCoursesPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);

  // États pour le modal d'édition
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    difficulty: "medium",
    tags: "",
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/teacher/courses");
      setCourses(response.data);
    } catch (err) {
      setError("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error("Error loading subjects", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await api.delete(`/teacher/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert("Error deleting course");
    }
  };

  const openEditModal = async (course) => {
    try {
      const res = await api.get(`/teacher/courses/${course.id}`);
      setEditingCourse(res.data);
      setEditForm({
        title: res.data.title,
        description: res.data.description || "",
        subject_id: res.data.subject_id,
        difficulty: res.data.difficulty,
        tags: res.data.tags || "",
      });
    } catch (err) {
      alert("Error loading course data");
    }
  };

  const closeModal = () => {
    setEditingCourse(null);
    setEditForm({
      title: "",
      description: "",
      subject_id: "",
      difficulty: "medium",
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
      await api.put(`/teacher/courses/${editingCourse.id}`, editForm);
      closeModal();
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.msg || "Error updating course");
    } finally {
      setModalLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
            My Courses
          </h1>
          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            Manage the courses you have created.
          </p>
        </div>
        <Button onClick={() => navigate("/teacher/courses/add")}>+ Add</Button>
      </div>

      {courses.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No courses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div key={course.id} className="min-w-[300px] max-w-[400px] w-full mx-auto">
              <Card>
                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {course.title}
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  {course.description}
                </p>
                <p className="text-sm text-slate-500 mt-1">Subject ID: {course.subject_id}</p>
                <p className="text-sm mt-1">
                  Difficulty: <span className="capitalize">{course.difficulty}</span>
                </p>
                  {course.file_path && (
                    <p className="text-xs text-green-500 mt-1 truncate" title={course.file_path.split('/').pop()}>
                      ✓ {course.file_path.split('/').pop()}
                    </p>
                  )}
                <div className="mt-4 flex justify-between gap-4">
                  <Button variant="outline" size="sm" className="flex-1 text-center" onClick={() => openEditModal(course)}>Edit</Button>
                  <Button variant="danger" size="sm" className="flex-1 text-center" onClick={() => handleDelete(course.id)}>Delete</Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-slate-900"}`}>
              Edit Course
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Course title"
                value={editForm.title}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
                required
              />

              <textarea
                name="description"
                placeholder="Description (optional)"
                rows="3"
                value={editForm.description}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300"
                }`}
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
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
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