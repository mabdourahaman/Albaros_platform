import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";
import { useSettings } from "../../../context/SettingsContext";

export default function ManageCoursesPage() {
  const { darkMode } = useSettings();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCourses() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/teacher/courses");
      setCourses(response.data);
    } catch (err) {
      setError("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this course?");

    if (!confirmed) return;

    try {
      await api.delete(`/teacher/courses/${id}`);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to delete course.");
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-extrabold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Manage Courses
          </h1>

          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            View, manage, and delete the courses assigned to your account.
          </p>
        </div>

        <Button onClick={fetchCourses}>Refresh</Button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-red-700 font-bold">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <Card className="mt-6 text-center">
          <h2 className="text-xl font-extrabold">No courses found</h2>
          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            Created courses will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    className={`text-xl font-extrabold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {course.title}
                  </h2>

                  <p
                    className={`mt-2 leading-relaxed ${
                      darkMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {course.description || "No description available."}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700 capitalize">
                  {course.difficulty || "medium"}
                </span>
              </div>

              <div className="mt-5 flex gap-3">
                <Button variant="outline" onClick={() => handleDelete(course.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}