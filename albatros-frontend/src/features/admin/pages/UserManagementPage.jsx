import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function UserManagementPage() {
  const { darkMode } = useSettings();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    massar: "",
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  // Edit user modal (no password)
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "" });
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
      applyFilters(res.data, searchTerm, roleFilter);
    } catch (err) {
      console.error(err);
      setMessage("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (userList, search, role) => {
    let filtered = [...userList];
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch) ||
          u.massar.toString().includes(lowerSearch)
      );
    }
    if (role !== "all") {
      filtered = filtered.filter((u) => u.role === role);
    }
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, searchTerm, roleFilter);
  }, [searchTerm, roleFilter, users]);

  const handleDelete = async (user) => {
    if (window.confirm(`Delete ${user.username} permanently?`)) {
      try {
        await api.delete(`/admin/users/${user.id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.msg || "Error deleting user");
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setMessage("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ username: "", email: "", role: "" });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editingUser.id}`, editForm);
      closeEditModal();
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.msg || "Error updating user");
    }
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage("");
    try {
      await api.post("/admin/create_user", addForm);
      setAddMessage("✅ User created successfully!");
      setAddForm({ massar: "", username: "", email: "", password: "", role: "student" });
      setTimeout(() => {
        setShowAddModal(false);
        fetchUsers();
      }, 1500);
    } catch (err) {
      setAddMessage(`❌ ${err.response?.data?.msg || "Error creating user"}`);
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return <div className={`text-center py-10 ${darkMode ? "text-slate-300" : "text-black"}`}>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-6">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-black"}`}>
          User Management
        </h1>
        <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
          View, edit, or delete user accounts.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, email or massar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
            darkMode
              ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              : "bg-white border-gray-300 text-black placeholder:text-gray-500"
          }`}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
            darkMode
              ? "bg-slate-800 border-slate-600 text-white"
              : "bg-white border-gray-300 text-black"
          }`}
        >
          <option value="all">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <Button onClick={() => setShowAddModal(true)}>+ Add User</Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="overflow-x-auto shadow-lg">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border rounded-xl border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                  <tr>
                    <th className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>Massar</th>
                    <th className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>Name</th>
                    <th className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>Email</th>
                    <th className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>Role</th>
                    <th className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-200 dark:divide-slate-700 ${darkMode ? "bg-slate-900" : "bg-white"}`}>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>{user.massar}</td>
                      <td className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>{user.username}</td>
                      <td className={`px-6 py-4 text-center text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>{user.email}</td>
                      <td className="px-6 py-4 text-center text-sm">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full border-2 ${
                          user.role === 'admin'
                            ? 'border-purple-300 text-purple-600 dark:border-purple-500 dark:text-purple-300'
                            : user.role === 'teacher'
                            ? 'border-blue-300 text-blue-600 dark:border-blue-500 dark:text-blue-300'
                            : 'border-green-300 text-green-600 dark:border-green-500 dark:text-green-300'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Massar</span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{user.massar}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Name</span>
                <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>{user.username}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email</span>
                <span className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-600"}`}>{user.email}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Role</span>
                <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 ${
                  user.role === 'admin'
                    ? 'border-purple-300 text-purple-600 dark:border-purple-500 dark:text-purple-300'
                    : user.role === 'teacher'
                    ? 'border-blue-300 text-blue-600 dark:border-blue-500 dark:text-blue-300'
                    : 'border-green-300 text-green-600 dark:border-green-500 dark:text-green-300'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student'}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => openEditModal(user)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">Edit</button>
                <button onClick={() => handleDelete(user)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal – no password field */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-black"}`}>
              Edit {editingUser.username}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={editForm.username}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={editForm.email}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              {message && <div className="text-red-500 text-sm text-center">{message}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={closeEditModal}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal – keeps password field */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-black"}`}>
              Add New User
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input
                type="text"
                name="massar"
                placeholder="Massar / CNE"
                value={addForm.massar}
                onChange={handleAddChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Full name"
                value={addForm.username}
                onChange={handleAddChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={addForm.email}
                onChange={handleAddChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={addForm.password}
                onChange={handleAddChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
                required
              />
              <select
                name="role"
                value={addForm.role}
                onChange={handleAddChange}
                className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                  darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {addMessage && <div className={`text-sm text-center ${addMessage.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{addMessage}</div>}
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={addLoading}>{addLoading ? "Creating..." : "Create User"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}