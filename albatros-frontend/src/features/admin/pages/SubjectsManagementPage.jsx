import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function SubjectsManagementPage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // États pour le modal d'ajout/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    teacher_id: "",
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/admin/subjects");
      setSubjects(res.data);
    } catch (err) {
      setError("Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/admin/users");
      const teacherList = res.data.filter((u) => u.role === "teacher");
      setTeachers(teacherList);
    } catch (err) {
      console.error("Error loading teachers", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deleting subject");
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setForm({ name: "", description: "", teacher_id: "" });
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      description: subject.description || "",
      teacher_id: subject.teacher_id || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSubject(null);
    setForm({ name: "", description: "", teacher_id: "" });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject.id}`, form);
      } else {
        await api.post("/admin/subjects", form);
      }
      closeModal();
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.msg || "Error saving subject");
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
            Subjects Management
          </h1>
          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            Manage school subjects and assign teachers.
          </p>
        </div>
        <Button onClick={openCreateModal} className="min-h-[42px] flex items-center justify-center">
          + Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className={`text-center py-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No subjects yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => (
            <div key={subject.id} className="min-w-[300px] max-w-[400px] w-full mx-auto">
              <Card className="flex flex-col justify-between">
                <div>
                  <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {subject.name}
                  </h3>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    {subject.description || "No description"}
                  </p>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    Teacher: {subject.teacher_name || "Not assigned"}
                  </p>
                </div>
                <div className="mt-4 flex justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-center min-h-[42px] flex items-center justify-center"
                    onClick={() => openEditModal(subject)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1 text-center min-h-[42px] flex items-center justify-center"
                    onClick={() => handleDelete(subject.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout / édition */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-slate-900"}`}>
              {editingSubject ? "Edit Subject" : "Add Subject"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Subject name"
                value={form.name}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-black"
                }`}
                required
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                rows="3"
                value={form.description}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-black"
                }`}
              />
              <select
                name="teacher_id"
                value={form.teacher_id}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-black"
                }`}
              >
                <option value="">Assign a teacher (optional)</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.username} ({teacher.email})
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="min-h-[42px] flex items-center justify-center"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={modalLoading}
                  className="min-h-[42px] flex items-center justify-center"
                >
                  {modalLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}