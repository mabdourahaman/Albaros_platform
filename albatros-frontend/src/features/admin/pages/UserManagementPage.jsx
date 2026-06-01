import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function UserManagementPage() {
  const { darkMode } = useSettings();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users"); // à créer si nécessaire
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className={`text-center py-10 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Chargement...</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        User Management
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        View and manage all registered users.
      </p>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
              <th className="py-3">Massar</th>
              <th className="py-3">Username</th>
              <th className="py-3">Email</th>
              <th className="py-3">Role</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={`border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
                <td className="py-4 font-mono">{user.massar}</td>
                <td className={`py-4 font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{user.username}</td>
                <td className={`py-4 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>{user.email}</td>
                <td className="py-4 capitalize">{user.role}</td>
                <td className="py-4">
                  <button className="text-blue-600 font-bold hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}