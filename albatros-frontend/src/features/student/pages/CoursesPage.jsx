import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import Card from "../../../components/common/Card";
import Loader from "../../../components/common/Loader";
import { getCourses } from "../../../services/courseService";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  if (loading) return <Loader message="Loading courses..." />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">
        Courses
      </h1>

      <p className="mt-2 text-slate-500">
        Choose a course and start learning.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <BookOpen />
            </div>

            <h2 className="mt-4 text-xl font-extrabold">
              {course.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {course.description}
            </p>

            <p className="mt-3 text-sm font-bold text-cyan-600">
              {course.subject} - {course.level}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}