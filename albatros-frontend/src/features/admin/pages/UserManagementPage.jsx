import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function UserManagementPage() {
  const { darkMode } = useSettings();

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [formType, setFormType] = useState("teacher");
  const [formOpen, setFormOpen] = useState(false);

  const [teacherForm, setTeacherForm] = useState({
    username: "",
    email: "",
    password: "",
    subject: "Mathematics",
  });

  const [studentForm, setStudentForm] = useState({
    username: "",
    email: "",
    password: "",
    massar: "",
    level: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const labelClass = `block text-sm font-bold mb-2 ${
    darkMode ? "text-slate-200" : "text-slate-700"
  }`;

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function handleTeacherChange(e) {
    setTeacherForm({
      ...teacherForm,
      [e.target.name]: e.target.value,
    });
  }

  function handleStudentChange(e) {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleAddTeacher(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/admin/users/teacher", teacherForm);
      setMessage(response.data.msg || "Teacher added successfully.");
      setTeacherForm({
        username: "",
        email: "",
        password: "",
        subject: "Mathematics",
      });
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/admin/users/student", studentForm);
      setMessage(response.data.msg || "Student added successfully.");
      setStudentForm({
        username: "",
        email: "",
        password: "",
        massar: "",
        level: "",
      });
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.username}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await api.delete(`/admin/users/${user.id}`);
      setMessage(response.data.msg || "User deleted successfully.");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete user.");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers =
    filter === "all" ? users : users.filter((user) => user.role === filter);

  const stats = {
    total: users.length,
    students: users.filter((user) => user.role === "student").length,
    teachers: users.filter((user) => user.role === "teacher").length,
    admins: users.filter((user) => user.role === "admin").length,
  };

  if (loading) {
    return (
      <div
        className={`text-center py-10 font-bold ${
          darkMode ? "text-slate-300" : "text-slate-500"
        }`}
      >
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-extrabold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            User Management
          </h1>

          <p
            className={`mt-2 ${
              darkMode ? "text-slate-300" : "text-slate-500"
            }`}
          >
            View, add, and remove registered teachers and students.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition"
          >
            {formOpen ? "Close form" : "Add user"}
          </button>

          <button
            onClick={fetchUsers}
            className={`rounded-xl px-5 py-3 font-bold border transition ${
              darkMode
                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            Total users
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">{stats.total}</h2>
        </Card>

        <Card>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            Students
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">{stats.students}</h2>
        </Card>

        <Card>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            Teachers
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">{stats.teachers}</h2>
        </Card>

        <Card>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            Admins
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">{stats.admins}</h2>
        </Card>
      </div>

      {message && (
        <div className="mt-6 rounded-2xl bg-green-50 px-5 py-4 text-green-700 font-bold">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-red-700 font-bold">
          {error}
        </div>
      )}

      {formOpen && (
        <Card className="mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">Add new user</h2>
              <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                Create a teacher or student account directly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormType("teacher")}
                className={`rounded-2xl border px-4 py-3 font-extrabold transition ${
                  formType === "teacher"
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : darkMode
                    ? "bg-slate-950 text-slate-200 border-slate-700"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                Teacher
              </button>

              <button
                type="button"
                onClick={() => setFormType("student")}
                className={`rounded-2xl border px-4 py-3 font-extrabold transition ${
                  formType === "student"
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : darkMode
                    ? "bg-slate-950 text-slate-200 border-slate-700"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                Student
              </button>
            </div>
          </div>

          {formType === "teacher" ? (
            <form onSubmit={handleAddTeacher} className="mt-6 grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  name="username"
                  value={teacherForm.username}
                  onChange={handleTeacherChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={teacherForm.email}
                  onChange={handleTeacherChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  name="password"
                  type="password"
                  value={teacherForm.password}
                  onChange={handleTeacherChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Subject</label>
                <select
                  name="subject"
                  value={teacherForm.subject}
                  onChange={handleTeacherChange}
                  className={inputClass}
                  required
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="French">French</option>
                  <option value="English">English</option>
                  <option value="Informatics">Informatics</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Add teacher"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddStudent} className="mt-6 grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  name="username"
                  value={studentForm.username}
                  onChange={handleStudentChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={studentForm.email}
                  onChange={handleStudentChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Massar</label>
                <input
                  name="massar"
                  value={studentForm.massar}
                  onChange={handleStudentChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Level</label>
                <input
                  name="level"
                  value={studentForm.level}
                  onChange={handleStudentChange}
                  className={inputClass}
                  placeholder="6ème Année Primaire"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  name="password"
                  type="password"
                  value={studentForm.password}
                  onChange={handleStudentChange}
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Add student"}
                </button>
              </div>
            </form>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        {["all", "student", "teacher", "admin"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${
              filter === item
                ? "bg-cyan-500 text-white"
                : darkMode
                ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <Card className="mt-6 overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="py-10 text-center">
            <h2 className="text-xl font-extrabold">No users found</h2>
            <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
              Registered users will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`text-left border-b ${
                  darkMode ? "border-slate-700" : "border-slate-100"
                }`}
              >
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Massar</th>
                <th className="py-3 px-3">Level</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Email verified</th>
                <th className="py-3 px-3">2FA</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b ${
                    darkMode ? "border-slate-700" : "border-slate-100"
                  }`}
                >
                  <td
                    className={`py-4 px-3 font-bold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user.username}
                  </td>

                  <td
                    className={`py-4 px-3 ${
                      darkMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {user.email}
                  </td>

                  <td className="py-4 px-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "teacher"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono">{user.massar || "-"}</td>

                  <td className="py-4 px-3">{user.level || "-"}</td>

                  <td className="py-4 px-3">{user.subject || "-"}</td>

                  <td className="py-4 px-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.email_verified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.email_verified ? "Verified" : "Not verified"}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.two_factor_enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.two_factor_enabled ? "Active" : "Off"}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    {user.role === "admin" ? (
                      <span
                        className={
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }
                      >
                        Protected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="rounded-xl bg-red-500 px-4 py-2 text-white font-bold hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}