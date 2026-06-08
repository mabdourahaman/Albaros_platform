import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import Button from "../../components/common/Button";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { loginUser } from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const text = {
    en: {
      title: "Please log in",
      subtitle: "Access your courses, quizzes, exercises, and progress.",
      massar: "CNE/Massar",
      password: "Password",
      login: "Login",
      noAccount: "Don't have an account?",
      register: "Create account",
      error: "Invalid massar or password",
    },
    fr: {
      title: "Veuillez vous connecter",
      subtitle: "Accédez à vos cours, quiz, exercices et votre progression.",
      massar: "CNE/Massar",
      password: "Mot de passe",
      login: "Se connecter",
      noAccount: "Vous n'avez pas de compte ?",
      register: "Créer un compte",
      error: "Massar ou mot de passe incorrect",
    },
    ar: {
      title: "الرجاء تسجيل الدخول",
      subtitle: "ادخل إلى الدروس والاختبارات والتمارين وتتبع التقدم.",
      massar: "CNE/رقم مسار",
      password: "كلمة المرور",
      login: "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      register: "إنشاء حساب",
      error: "رقم مسار أو كلمة مرور غير صحيحة",
    },
  };

  const t = text[language];

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const massar = formData.get("massar");
    const password = formData.get("password");

    try {
      const data = await loginUser({ massar, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user.role;
      if (role === "student") navigate("/student");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center px-4 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl shadow-sm border p-8 ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-cyan-500">
                Albatros
              </h1>
              <p
                className={`text-xs ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                E-learning
              </p>
            </div>
          </Link>
          <SettingsControls />
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-extrabold">{t.title}</h2>
          <p
            className={`mt-2 ${
              darkMode ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            name="massar"
            type="text"
            placeholder={t.massar}
            className={`w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          />

          <input
            name="password"
            type="password"
            placeholder={t.password}
            className={`w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          />

          {error && (
            <div className="text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t.login}
          </Button>
        </form>

        <p
          className={`mt-6 text-sm text-center ${
            darkMode ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {t.noAccount}{" "}
          <Link to="/register" className="text-cyan-500 font-bold">
            {t.register}
          </Link>
        </p>
      </div>
    </main>
  );
}