import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

const translations = {
  en: {
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "Dashboard",
    courses: "Courses",
    quiz: "Quiz",
    exercises: "Exercises",
    recommendations: "Recommendations",
    progress: "Progress",
    scores: "Scores",
    users: "Users",
    subjects: "Subjects",
    content: "Content",
    students: "Students",
    monitoring: "Monitoring",
    addCourse: "Add Course",
    addExercise: "Add Exercise",
    studentDashboard: "Student Dashboard",
    teacherDashboard: "Teacher Dashboard",
    adminDashboard: "Admin Dashboard",
    welcomeBack: "Welcome back",
    weakTopics: "Weak Topics",
    reviewNow: "Review now",
    pendingUsers: "Pending Users",  // Ajouté
    addTeacher: "Add teacher",
  },

  fr: {
    login: "Connexion",
    register: "Inscription",
    logout: "Déconnexion",
    dashboard: "Tableau de bord",
    courses: "Cours",
    quiz: "Quiz",
    exercises: "Exercices",
    recommendations: "Recommandations",
    progress: "Progression",
    scores: "Notes",
    users: "Utilisateurs",
    subjects: "Matières",
    content: "Contenu",
    students: "Élèves",
    monitoring: "Suivi",
    addCourse: "Ajouter un cours",
    addExercise: "Ajouter un exercice",
    studentDashboard: "Tableau de bord élève",
    teacherDashboard: "Tableau de bord enseignant",
    adminDashboard: "Tableau de bord admin",
    welcomeBack: "Bon retour",
    weakTopics: "Points faibles",
    reviewNow: "Réviser maintenant",
    pendingUsers: "Inscriptions en attente",  // Ajouté
    addTeacher: "Ajouter un enseignant",
  },

  ar: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    courses: "الدروس",
    quiz: "اختبار",
    exercises: "تمارين",
    recommendations: "توصيات",
    progress: "التقدم",
    scores: "النقط",
    users: "المستخدمون",
    subjects: "المواد",
    content: "المحتوى",
    students: "التلاميذ",
    monitoring: "المتابعة",
    addCourse: "إضافة درس",
    addExercise: "إضافة تمرين",
    studentDashboard: "لوحة تحكم التلميذ",
    teacherDashboard: "لوحة تحكم الأستاذ",
    adminDashboard: "لوحة تحكم المدير",
    welcomeBack: "مرحبا بعودتك",
    weakTopics: "نقاط الضعف",
    reviewNow: "راجع الآن",
    pendingUsers: "المستخدمون المنتظرون",  // Ajouté
    addTeacher: "إضافة أستاذ",
  },
};

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#020617";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
    }
  }, [darkMode]);

  const t = translations[language];

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}