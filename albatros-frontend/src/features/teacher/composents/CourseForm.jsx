import { useState } from "react";
import Button from "../../../components/common/Button";

export default function CourseForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    level: "",
    description: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <input
        name="title"
        placeholder="Course title"
        value={form.title}
        onChange={handleChange}
        className="w-full px-4 py-3 rounded-xl border border-slate-300"
      />

      <input
        name="subject"
        placeholder="Subject"
        value={form.subject}
        onChange={handleChange}
        className="w-full px-4 py-3 rounded-xl border border-slate-300"
      />

      <input
        name="level"
        placeholder="Level"
        value={form.level}
        onChange={handleChange}
        className="w-full px-4 py-3 rounded-xl border border-slate-300"
      />

      <textarea
        name="description"
        placeholder="Course description"
        value={form.description}
        onChange={handleChange}
        rows="5"
        className="w-full px-4 py-3 rounded-xl border border-slate-300"
      />

      <Button type="submit">Save course</Button>
    </form>
  );
}