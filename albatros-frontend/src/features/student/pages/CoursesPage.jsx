import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function CoursesPage() {
  const { darkMode } = useSettings();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/student/courses");
        setCourses(response.data); // Tous les cours, pas de slice
      } catch (err) {
        setError("Impossible de charger les cours.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className={`text-center ${darkMode ? "text-red-400" : "text-red-500"}`}>{error}</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Courses
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Consult your available courses and continue learning.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
              {course.title}
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              {course.description}
            </p>
            <div className="mt-5">
              <div className="flex justify-between text-sm font-semibold">
                <span className={darkMode ? "text-slate-300" : "text-slate-700"}>Your Score</span>
                <span className={darkMode ? "text-white" : "text-slate-900"}>
                  {course.user_score !== undefined ? `${course.user_score}%` : "—"}
                </span>
              </div>
              {course.user_score !== undefined && (
                <div className="h-3 bg-slate-100 rounded-full mt-2">
                  <div
                    className="h-3 bg-blue-600 rounded-full"
                    style={{ width: `${course.user_score}%` }}
                  />
                </div>
              )}
            </div>
            <button className="mt-5 text-blue-600 font-bold hover:text-blue-700 transition">
              Open course
            </button>
          </Card>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className={`text-center mt-10 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No courses available at the moment.
        </div>
      )}
    </div>
  );
}