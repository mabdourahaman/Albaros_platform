import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function ContentManagementPage() {
  const { darkMode } = useSettings();

  const [courses, setCourses] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");
  const [message, setMessage] = useState("");

  // États pour le modal de visualisation
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewType, setViewType] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [coursesRes, exercisesRes, quizzesRes] = await Promise.all([
        api.get("/admin/all_courses"),
        api.get("/admin/all_exercises"),
        api.get("/admin/all_quizzes"),
      ]);
      setCourses(coursesRes.data);
      setExercises(exercisesRes.data);
      setQuizzes(quizzesRes.data);
    } catch (err) {
      console.error("Error loading content", err);
      setMessage("Failed to load content.");
    } finally {
      setLoading(false);
    }
  };

  // Correction : utiliser les bons endpoints (pluriel)
  const handleDelete = async (type, id, title) => {
    if (!window.confirm(`Delete ${title} permanently?`)) return;
    let endpoint;
    if (type === "course") endpoint = "courses";
    else if (type === "exercise") endpoint = "exercises";
    else if (type === "quiz") endpoint = "quizzes";
    else return;
    try {
      await api.delete(`/admin/${endpoint}/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deleting");
    }
  };

  const openViewModal = async (type, item) => {
    setViewType(type);
    setViewItem(item);
    setViewModalOpen(true);
    if (type === "quiz") {
      try {
        // Cette route existe déjà (teacher/quizzes) avec JWT admin autorisé
        const res = await api.get(`/teacher/quizzes/${item.id}`);
        setQuizQuestions(res.data.questions || []);
      } catch (err) {
        console.error("Failed to load quiz questions", err);
        setQuizQuestions([]);
      }
    } else {
      setQuizQuestions([]);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewItem(null);
    setViewType(null);
    setQuizQuestions([]);
  };

  const renderCourses = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>
            {course.title}
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
            {course.description || "No description"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Subject ID: {course.subject_id}</p>
          <p className="text-xs text-slate-500">Teacher: {course.teacher_name || "Unknown"}</p>
          <p className="text-xs text-slate-500">Difficulty: {course.difficulty}</p>
          {course.file_path && (
            <p className="text-xs text-green-500 truncate">📎 {course.file_path.split("/").pop()}</p>
          )}
          <div className="mt-4 flex justify-between gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal("course", course)}>
              View
            </Button>
            <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete("course", course.id, course.title)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderExercises = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
      {exercises.map((ex) => (
        <Card key={ex.id}>
          <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? "text-white" : "text-black"}`}>
            {ex.question_text.substring(0, 60)}...
          </h3>
          <p className="text-sm text-slate-500 mt-1">Course ID: {ex.course_id}</p>
          <p className="text-sm mt-1">Difficulty: {ex.difficulty}</p>
          {ex.tags && <p className="text-xs text-slate-400 mt-1">Tags: {ex.tags}</p>}
          <div className="mt-4 flex justify-between gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal("exercise", ex)}>
              View
            </Button>
            <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete("exercise", ex.id, `Exercise ${ex.id}`)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderQuizzes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>{quiz.title}</h3>
          <p className="text-sm text-slate-500 mt-1">Subject ID: {quiz.subject_id}</p>
          <p className="text-sm mt-1">Difficulty: {quiz.difficulty}</p>
          <p className="text-sm mt-1">Questions: {quiz.question_count || 0}</p>
          <div className="mt-4 flex justify-between gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal("quiz", quiz)}>
              View
            </Button>
            <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete("quiz", quiz.id, quiz.title)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) return <div className="text-center py-10">Loading content...</div>;

  return (
    <div>
      <div className="mb-4">
        <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-black"}`}>
          Content Management
        </h1>
        <p className={`mt-1 ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
          View and delete all courses, exercises, and quizzes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
        {["courses", "exercises", "quizzes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 font-semibold transition border-b-2 ${
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {message && <div className="text-red-500 text-center mb-4">{message}</div>}

      {activeTab === "courses" && renderCourses()}
      {activeTab === "exercises" && renderExercises()}
      {activeTab === "quizzes" && renderQuizzes()}

      {/* Modal de visualisation – version uniforme et corrigée */}
      {viewModalOpen && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
            <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-black"}`}>
              {viewType === "course" && "Course Details"}
              {viewType === "exercise" && "Exercise Details"}
              {viewType === "quiz" && "Quiz Details"}
            </h2>

            {/* COURS - maintenant en formulaire */}
            {viewType === "course" && (
              <form className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Title</label>
                  <input
                    type="text"
                    value={viewItem.title}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Description</label>
                  <textarea
                    rows="3"
                    value={viewItem.description || "No description"}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Subject ID</label>
                  <input
                    type="text"
                    value={viewItem.subject_id}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Teacher</label>
                  <input
                    type="text"
                    value={viewItem.teacher_name || "Not assigned"}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Difficulty</label>
                  <select
                    value={viewItem.difficulty}
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  >
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Tags</label>
                  <input
                    type="text"
                    value={viewItem.tags || "None"}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                {viewItem.file_path && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>File</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={viewItem.file_path.split("/").pop()}
                        readOnly
                        disabled
                        className={`flex-1 border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                      />
                      <a
                        href={`${api.defaults.baseURL}/courses/${viewItem.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* EXERCICE - inchangé mais avec bon support clair/sombre */}
            {viewType === "exercise" && (
              <form className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Course ID</label>
                  <input
                    type="text"
                    value={viewItem.course_id}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Question</label>
                  <textarea
                    rows="4"
                    value={viewItem.question_text}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Correct Answer</label>
                  <input
                    type="text"
                    value={viewItem.correct_answer}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Explanation</label>
                  <textarea
                    rows="3"
                    value={viewItem.explanation || "No explanation"}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Difficulty</label>
                  <select
                    value={viewItem.difficulty}
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  >
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Tags</label>
                  <input
                    type="text"
                    value={viewItem.tags || "None"}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
              </form>
            )}

            {/* QUIZ - corrigé pour mode clair (fonds, bordures, couleurs) */}
            {viewType === "quiz" && (
              <form className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Quiz Title</label>
                  <input
                    type="text"
                    value={viewItem.title}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Subject ID</label>
                  <input
                    type="text"
                    value={viewItem.subject_id}
                    readOnly
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Difficulty</label>
                  <select
                    value={viewItem.difficulty}
                    disabled
                    className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                  >
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className={`font-bold text-lg mb-3 ${darkMode ? "text-white" : "text-black"}`}>Questions</h3>
                  {quizQuestions.length === 0 && <p className="text-slate-500">No questions loaded.</p>}
                  {quizQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 mb-4 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}
                    >
                      <div className="mb-2">
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Question {idx+1}</label>
                        <textarea
                          rows="2"
                          value={q.text}
                          readOnly
                          disabled
                          className={`w-full border rounded-xl px-4 py-2 ${darkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-gray-300 text-black"}`}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1,2,3,4].map(optNum => {
                          const optValue = q[`option${optNum}`];
                          return (
                            <div key={optNum}>
                              <label className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Option {optNum}</label>
                              <input
                                type="text"
                                value={optValue}
                                readOnly
                                disabled
                                className={`w-full border rounded-xl px-3 py-2 ${darkMode ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-gray-300 text-black"} ${
                                  q.correct_option === optNum ? (darkMode ? "border-green-400" : "border-green-600") : ""
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-gray-600"}`}>Correct option: <strong>{q.correct_option}</strong></p>
                    </div>
                  ))}
                </div>
              </form>
            )}

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={closeViewModal}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}