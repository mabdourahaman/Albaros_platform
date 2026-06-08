import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { darkMode } = useSettings();

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("1");
  const [difficulty, setDifficulty] = useState("medium");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a Word document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject_id", subjectId);
    formData.append("difficulty", difficulty);

    try {
      setUploading(true);

      await api.post("/teacher/upload_course", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/teacher/courses");
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to upload course.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1
        className={`text-3xl font-extrabold ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        Add Course
      </h1>

      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Upload a Word document to create a course and generate learning content.
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
          <label className="block mb-2 text-sm font-bold">Course title</label>
          <input
            type="text"
            placeholder="Course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={inputClass}
          >
            <option value="1">Mathematics</option>
            <option value="2">French</option>
            <option value="3">English</option>
            <option value="4">Informatics</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={inputClass}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold">Word document</label>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files[0])}
            className={inputClass}
            required
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700 font-bold">
            {error}
          </div>
        )}

        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Create Course"}
        </Button>
      </form>
    </div>
  );
}