import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddCoursePage() {
  const { darkMode } = useSettings();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    difficulty: "medium",
    tags: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/subjects");
        setSubjects(res.data);
        if (res.data.length > 0) {
          setForm(prev => ({ ...prev, subject_id: res.data[0].id }));
        }
      } catch (err) {
        console.error("Erreur chargement matières", err);
        setMessage("Erreur lors du chargement des matières");
      }
    };
    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const handleReset = () => {
    setForm({
      title: "",
      description: "",
      subject_id: subjects.length > 0 ? subjects[0].id : "",
      difficulty: "medium",
      tags: "",
    });
    setFile(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
    setMessage("");
  };

  const isErrorMessage = (msg) => {
    const lowerMsg = msg.toLowerCase();
    return (
      lowerMsg.startsWith("erreur") ||
      lowerMsg.includes("unauthorized") ||
      lowerMsg.includes("non autorisé") ||
      lowerMsg.includes("échec") ||
      lowerMsg.includes("invalid")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!file) {
      setMessage("Veuillez sélectionner un fichier");
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("subject_id", form.subject_id);
    formData.append("difficulty", form.difficulty);
    formData.append("tags", form.tags);
    formData.append("file", file);

    try {
      await api.post("/teacher/courses/with_file", formData, {
        headers: { "Content-Type": undefined },
      });

      navigate("/teacher/courses");
    } catch (err) {
      const msg = err.response?.data?.msg || "Erreur lors de la création du cours.";
      setMessage(msg);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
          Ajouter un cours
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          Créez un nouveau cours en déposant un fichier (PDF, DOCX, PPTX). Les élèves pourront le consulter.
        </p>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Titre du cours"
            value={form.title}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            }`}
            required
          />

          <textarea
            name="description"
            placeholder="Description (optionnelle)"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            }`}
          />

          <select
            name="subject_id"
            value={form.subject_id}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
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
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
          </select>

          <input
            type="text"
            name="tags"
            placeholder="Tags (séparés par des virgules, optionnel)"
            value={form.tags}
            onChange={handleChange}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            }`}
          />

          <input
            type="file"
            accept=".pdf,.docx,.pptx"
            onChange={handleFileChange}
            className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold ${
              darkMode
                ? "bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white"
                : "bg-white border-slate-300 text-slate-900 file:bg-slate-100 file:text-slate-700"
            }`}
            required
          />

          {message && (
            <div className={`text-sm text-center font-medium ${isErrorMessage(message) ? "text-red-500" : "text-green-500"}`}>
              {message}
            </div>
          )}

          <div className="flex justify-center gap-3 mt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Création en cours..." : "Créer le cours"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}