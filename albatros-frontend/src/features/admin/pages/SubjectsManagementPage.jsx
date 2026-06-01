import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function SubjectsManagementPage() {
  const { darkMode } = useSettings();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/subjects"); // endpoint à créer
        setSubjects(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) return <div className={`text-center py-10 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Chargement...</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Subjects Management
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Manage school subjects.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
              {subject.name}
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              {subject.description}
            </p>
            <p className="mt-4 text-blue-600 font-bold">{subject.courses_count || 0} courses</p>
          </Card>
        ))}
      </div>
    </div>
  );
}