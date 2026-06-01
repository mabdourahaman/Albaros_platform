import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import api from "../../../services/api";

export default function AddCoursePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(1);
  const [difficulty, setDifficulty] = useState("medium");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un fichier .docx");
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject_id", subjectId);
    formData.append("difficulty", difficulty);

    try {
      await api.post("/teacher/upload_course", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/teacher/courses");
    } catch (err) {
      setError("Erreur lors de l’upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Add Course from Word</h1>
      <p className="mt-2 text-slate-500">Upload a .docx file to generate a quiz automatically.</p>
      <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-3xl p-6 border border-slate-100 max-w-3xl space-y-4">
        <input
          type="text"
          placeholder="Quiz title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-2xl px-4 py-3"
          required
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(Number(e.target.value))}
          className="w-full border rounded-2xl px-4 py-3"
        >
          <option value={1}>Mathematics</option>
          <option value={2}>French</option>
          <option value={3}>English</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full border rounded-2xl px-4 py-3"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input type="file" accept=".docx" onChange={handleFileChange} className="w-full border rounded-2xl px-4 py-3" required />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Create Quiz"}</Button>
      </form>
    </div>
  );
}