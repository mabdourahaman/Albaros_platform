import { useEffect, useState } from "react";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function PendingUsersPage() {
  const { darkMode } = useSettings();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get("/admin/pending_users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await api.post(`/admin/approve_user/${id}`);
    fetchPending();
  };

  const handleReject = async (id) => {
    await api.post(`/admin/reject_user/${id}`);
    fetchPending();
  };

  if (loading) return <div className={`text-center py-10 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Chargement...</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Inscriptions en attente
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Validez ou rejetez les comptes en attente.
      </p>

      <div className={`mt-6 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Aucune inscription en attente.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((user) => (
              <li key={user.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <p className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {user.username} <span className="text-sm font-normal">({user.massar})</span>
                  </p>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Inscrit le {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                  >
                    Rejeter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}