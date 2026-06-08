import { createBrowserRouter } from "react-router-dom";
import HomePage from "../features/home/HomePage";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import RoleSelectionPage from "../features/auth/RoleSelectionPage";

import DashboardLayout from "../components/layout/DashboardLayout";

import StudentDashboard from "../features/student/pages/StudentDashboard";
import CoursesPage from "../features/student/pages/CoursesPage";
import QuizPage from "../features/student/pages/QuizPage";
import ExercisesPage from "../features/student/pages/ExercisesPage";
import RecommendationsPage from "../features/student/pages/RecommendationsPage";
import ProgressPage from "../features/student/pages/ProgressPage";
import ScoresHistoryPage from "../features/student/pages/ScoresHistoryPage";
import StudentQuizzesPage from "../features/student/pages/StudentQuizzesPage";

import TeacherDashboard from "../features/teacher/pages/TeacherDashboard";
import ManageCoursesPage from "../features/teacher/pages/ManageCoursesPage";
import AddCoursePage from "../features/teacher/pages/AddCoursePage";
import AddExercisePage from "../features/teacher/pages/AddExercisePage";
import StudentStatsPage from "../features/teacher/pages/StudentStatsPage";
import ProgressMonitoringPage from "../features/teacher/pages/ProgressMonitoringPage";
// ... autres imports
import ManageExercisesPage from "../features/teacher/pages/ManageExercisesPage";
import ManageQuizzesPage from "../features/teacher/pages/ManageQuizzesPage";
import AddQuizPage from "../features/teacher/pages/AddQuizPage";

import AdminDashboard from "../features/admin/pages/AdminDashboard";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import SubjectsManagementPage from "../features/admin/pages/SubjectsManagementPage";
import ContentManagementPage from "../features/admin/pages/ContentManagementPage";
import PendingUsersPage from "../features/admin/pages/PendingUsersPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/role-selection", element: <RoleSelectionPage /> },

  {
    path: "/student",
    element: <DashboardLayout role="student" />,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: "courses", element: <CoursesPage /> },
      // dans le tableau children de student :
      { path: "quizzes", element: <StudentQuizzesPage /> },
      { path: "quiz/:id", element: <QuizPage /> },
      { path: "exercises", element: <ExercisesPage /> },
      { path: "recommendations", element: <RecommendationsPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "scores", element: <ScoresHistoryPage /> },
    ],
  },

  {
    path: "/teacher",
    element: <DashboardLayout role="teacher" />,
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "courses", element: <ManageCoursesPage /> },
      { path: "courses/add", element: <AddCoursePage /> },
      { path: "exercises/add", element: <AddExercisePage /> },
      { path: "students", element: <StudentStatsPage /> },
      { path: "monitoring", element: <ProgressMonitoringPage /> },
      { path: "exercises", element: <ManageExercisesPage /> },
      { path: "quizzes", element: <ManageQuizzesPage /> },
      { path: "quizzes/add", element: <AddQuizPage /> },
          ],
  },

  {
    path: "/admin",
    element: <DashboardLayout role="admin" />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserManagementPage /> },
      { path: "pending-users", element: <PendingUsersPage /> },  // ← ajout
      { path: "subjects", element: <SubjectsManagementPage /> },
      { path: "content", element: <ContentManagementPage /> },
    ],
  },
]);