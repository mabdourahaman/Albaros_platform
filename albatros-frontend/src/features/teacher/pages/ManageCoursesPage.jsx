import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/teacher/courses");
      setCourses(res.data);
    } catch (err) {
      setError("Impossible de charger les cours.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce cours ?")) {
      await api.delete(`/teacher/courses/${id}`);
      fetchCourses();
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Manage Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <h2 className="text-xl font-extrabold">{course.title}</h2>
            <p className="mt-2 text-slate-500">{course.description}</p>
            <div className="mt-5 flex gap-3">
              <Button onClick={() => {}}>Edit</Button>
              <Button variant="outline" onClick={() => handleDelete(course.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}