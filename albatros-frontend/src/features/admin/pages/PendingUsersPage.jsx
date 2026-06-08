import { useEffect, useState } from "react";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function PendingUsersPage() {
  const { darkMode } = useSettings();

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchPendingUsers() {
    try {
      setLoading(true);
      const response = await api.get("/admin/pending_users");
      setPendingUsers(response.data);
    } catch (err) {
      setError("Failed to load pending users.");
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(user) {
    setMessage("");
    setError("");

    try {
      await api.post(`/admin/approve_user/${user.id}`, {
        role: user.role,
        subject: user.subject,
      });

      setMessage("User approved successfully.");
      fetchPendingUsers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to approve user.");
    }
  }

  async function rejectUser(id) {
    setMessage("");
    setError("");

    try {
      await api.post(`/admin/reject_user/${id}`);
      setMessage("User rejected successfully.");
      fetchPendingUsers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reject user.");
    }
  }

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Pending Users</h1>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            Review student and teacher registration requests.
          </p>
        </div>

        <button
          onClick={fetchPendingUsers}
          className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition"
        >
          Refresh
        </button>
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

      <div
        className={`mt-8 rounded-3xl border overflow-hidden ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-100"
        }`}
      >
        {loading ? (
          <div className="p-8 text-center font-bold">Loading...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-xl font-extrabold">No pending users</h2>
            <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
              All registration requests have been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead
                className={
                  darkMode
                    ? "bg-slate-950 text-slate-300"
                    : "bg-slate-50 text-slate-600"
                }
              >
                <tr>
                  <th className="px-6 py-4 text-sm font-extrabold">Name</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Email</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Role</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Massar</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Level</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Subject</th>
                  <th className="px-6 py-4 text-sm font-extrabold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t ${
                      darkMode ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    <td className="px-6 py-4 font-bold">{user.username}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 capitalize">{user.role}</td>
                    <td className="px-6 py-4">{user.massar || "-"}</td>
                    <td className="px-6 py-4">{user.level || "-"}</td>
                    <td className="px-6 py-4">{user.subject || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => approveUser(user)}
                          className="rounded-xl bg-green-500 px-4 py-2 text-white font-bold hover:bg-green-600 transition"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectUser(user.id)}
                          className="rounded-xl bg-red-500 px-4 py-2 text-white font-bold hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}