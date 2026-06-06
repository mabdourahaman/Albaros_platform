import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import Card from "../../components/common/Card";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { loginStudent, loginStaff } from "../../services/authService";

export default function RoleLoginPage({ role }) {
  const navigate = useNavigate();
  const { language, darkMode } = useSettings();

  const content = {
    en: {
      studentTitle: "Student Login",
      teacherTitle: "Teacher Login",
      adminTitle: "Admin Login",
      studentDesc: "Login using your Massar code.",
      teacherDesc: "Login using your Albatros teacher email.",
      adminDesc: "Login using your Albatros admin email.",
      massar: "Massar",
      email: "Email",
      password: "Password",
      studentBtn: "Login as Student",
      teacherBtn: "Login as Teacher",
      adminBtn: "Login as Admin",
      loading: "Logging in...",
      noAccount: "No account?",
      register: "Register here",
      back: "Back to home",
      massarError: "Massar must be like A12345678.",
      teacherEmailError: "Teacher email must be like nom.prenom@albatros.ma.",
      adminEmailError: "Admin email must be like fullname.admin@albatros.ma.",
      failed: "Login failed.",
    },
    fr: {
      studentTitle: "Connexion Élève",
      teacherTitle: "Connexion Enseignant",
      adminTitle: "Connexion Admin",
      studentDesc: "Connectez-vous avec votre code Massar.",
      teacherDesc: "Connectez-vous avec votre email enseignant Albatros.",
      adminDesc: "Connectez-vous avec votre email admin Albatros.",
      massar: "Massar",
      email: "Email",
      password: "Mot de passe",
      studentBtn: "Se connecter comme élève",
      teacherBtn: "Se connecter comme enseignant",
      adminBtn: "Se connecter comme admin",
      loading: "Connexion...",
      noAccount: "Pas de compte ?",
      register: "Inscrivez-vous ici",
      back: "Retour à l’accueil",
      massarError: "Le Massar doit être sous forme A12345678.",
      teacherEmailError: "L’email enseignant doit être comme nom.prenom@albatros.ma.",
      adminEmailError: "L’email admin doit être comme fullname.admin@albatros.ma.",
      failed: "Échec de connexion.",
    },
    ar: {
      studentTitle: "دخول التلميذ",
      teacherTitle: "دخول الأستاذ",
      adminTitle: "دخول المسؤول",
      studentDesc: "قم بتسجيل الدخول باستعمال رمز مسار.",
      teacherDesc: "قم بتسجيل الدخول باستعمال بريد الأستاذ في ألباتروس.",
      adminDesc: "قم بتسجيل الدخول باستعمال بريد المسؤول في ألباتروس.",
      massar: "مسار",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      studentBtn: "دخول كتلميذ",
      teacherBtn: "دخول كأستاذ",
      adminBtn: "دخول كمسؤول",
      loading: "جار تسجيل الدخول...",
      noAccount: "ليس لديك حساب؟",
      register: "سجل هنا",
      back: "العودة إلى الرئيسية",
      massarError: "رمز مسار يجب أن يكون مثل A12345678.",
      teacherEmailError: "بريد الأستاذ يجب أن يكون مثل nom.prenom@albatros.ma.",
      adminEmailError: "بريد المسؤول يجب أن يكون مثل fullname.admin@albatros.ma.",
      failed: "فشل تسجيل الدخول.",
    },
  };

  const t = content[language];

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";

  const [form, setForm] = useState({
    massar: "",
    email: "",
    password: "",
    role,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = isStudent ? t.studentTitle : isTeacher ? t.teacherTitle : t.adminTitle;
  const desc = isStudent ? t.studentDesc : isTeacher ? t.teacherDesc : t.adminDesc;
  const buttonText = isStudent ? t.studentBtn : isTeacher ? t.teacherBtn : t.adminBtn;


  const accentClasses = isStudent
    ? "bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400"
    : isTeacher
    ? "bg-blue-500 hover:bg-blue-600 focus:ring-blue-400"
    : "bg-slate-900 hover:bg-slate-800 focus:ring-slate-400";

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const massarRegex = /^[A-Z][0-9]{8}$/;
    const teacherEmailRegex = /^[a-z]+\.[a-z]+@albatros\.ma$/;
    const adminEmailRegex = /^[a-z]+\.admin@albatros\.ma$/;

    if (isStudent && !massarRegex.test(form.massar)) {
      setError(t.massarError);
      return;
    }

    if (isTeacher && !teacherEmailRegex.test(form.email)) {
      setError(t.teacherEmailError);
      return;
    }

    if (isAdmin && !adminEmailRegex.test(form.email)) {
      setError(t.adminEmailError);
      return;
    }

    try {
      setLoading(true);

      const data = isStudent
        ? await loginStudent({
            massar: form.massar,
            password: form.password,
          })
        : await loginStaff({
            email: form.email,
            password: form.password,
            role,
          });

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.msg || t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 py-10 transition ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
    <div className="absolute top-5 left-5">
      <Link
        to="/"
        className={`font-bold transition ${
          darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        ← {t.back}
      </Link>
    </div>

    <div className="absolute top-5 right-5">
      <SettingsControls />
    </div>

      <Card
        className={`w-full max-w-md border ${
          darkMode
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-white border-slate-100 text-slate-900"
        }`}
      >
        <div className="text-center">

          <h1 className="text-3xl font-extrabold">
            {title}
          </h1>

          <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            {desc}
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-red-700 font-semibold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {isStudent ? (
            <div>
              <label className={`block text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                {t.massar}
              </label>

              <input
                name="massar"
                value={form.massar}
                onChange={handleChange}
                placeholder="A12345678"
                required
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                  darkMode
                    ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>
          ) : (
            <div>
              <label className={`block text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                {t.email}
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={isTeacher ? "nom.prenom@albatros.ma" : "fullname.admin@albatros.ma"}
                required
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                  darkMode
                    ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
              {t.password}
            </label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                darkMode
                  ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
          </div>

          <button
            disabled={loading}
            className={`w-full rounded-2xl px-5 py-3 font-bold text-white transition disabled:opacity-60 ${accentClasses}`}
          >
            {loading ? t.loading : buttonText}
          </button>
        </form>

        {isStudent && (
          <p className={`mt-6 text-center text-sm ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
            {t.noAccount}{" "}
            <Link to="/register" className="text-cyan-500 font-bold">
              {t.register}
            </Link>
          </p>
        )}

        <p className="mt-3 text-center text-sm">
          <Link
            to="/"
            className={`font-bold ${
              darkMode ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t.back}
          </Link>
        </p>
      </Card>
    </main>
  );
}