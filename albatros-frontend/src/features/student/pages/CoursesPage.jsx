import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import Card from "../../../components/common/Card";
import Loader from "../../../components/common/Loader";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function CoursesPage() {
  const { darkMode } = useSettings();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileExtension, setFileExtension] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await api.get("/student/courses");
        setCourses(response.data);
      } catch (err) {
        setError("Unable to load courses.");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const openCourseFile = (course) => {
    if (course.file_url) {
      const fullUrl = `${api.defaults.baseURL}${course.file_url}`;
      setFileUrl(fullUrl);
      setFileExtension(course.file_extension);
      setSelectedCourse(course.id);
    } else {
      alert("No file attached to this course.");
    }
  };

  const closeModal = () => {
    setSelectedCourse(null);
    setFileUrl("");
    setFileExtension("");
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>Courses</h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Browse your available courses and open the materials.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                {course.title}
              </h2>
              <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                {course.description}
              </p>
            </div>
            <button
              onClick={() => openCourseFile(course)}
              className="mt-5 w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition min-h-[44px]"
            >
              Open course
            </button>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <div className={`flex justify-between items-center p-4 border-b ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Course material</h2>
              <button onClick={closeModal} className="text-red-500 text-2xl hover:text-red-700">&times;</button>
            </div>
            <div className="flex-1 p-2 overflow-auto">
              {fileExtension === "pdf" ? (
                <iframe src={fileUrl} className="w-full h-[80vh]" title="PDF Viewer" />
              ) : (
                <div className="text-center py-10">
                  <p className={`mb-4 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    This file type (.{fileExtension}) cannot be previewed.
                  </p>
                  <a href={fileUrl} download className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}