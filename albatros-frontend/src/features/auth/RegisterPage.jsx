import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GraduationCap, CheckCircle } from "lucide-react";
import Button from "../../components/common/Button";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { registerUser } from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();
  const [form, setForm] = useState({
    massar: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const text = {
    en: {
      title: "Create an account",
      subtitle: "Join Albatros and start learning today.",
      massar: "CNE/Massar",
      fullName: "Full name",
      email: "Email address",
      password: "Password",
      confirmPassword: "Confirm password",
      register: "Register",
      already: "Already have an account?",
      login: "Login",
      mismatch: "Passwords do not match",
      genericError: "Registration failed. Please try again.",
      pendingTitle: "Registration pending validation",
      pendingMessage:
        "Thank you for registering with Albatros. Your account is currently under review by our administration team. Once your information has been validated, you will receive a confirmation email and will be able to log in. We appreciate your patience and will notify you as soon as possible.",
      ok: "OK",
    },
    fr: {
      title: "Créer un compte",
      subtitle: "Rejoignez Albatros et commencez à apprendre dès aujourd'hui.",
      massar: "CNE/Massar",
      fullName: "Nom complet",
      email: "Adresse e-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      register: "S'inscrire",
      already: "Vous avez déjà un compte ?",
      login: "Connexion",
      mismatch: "Les mots de passe ne correspondent pas",
      genericError: "Échec de l'inscription. Veuillez réessayer.",
      pendingTitle: "Inscription en attente de validation",
      pendingMessage:
        "Merci de vous être inscrit sur Albatros. Votre compte est actuellement en cours d'examen par notre équipe d'administration. Une fois vos informations validées, vous recevrez un e-mail de confirmation et pourrez vous connecter. Nous vous remercions de votre patience et vous tiendrons informé dès que possible.",
      ok: "OK",
    },
    ar: {
      title: "إنشاء حساب",
      subtitle: "انضم إلى ألباتروس وابدأ التعلم اليوم.",
      massar: "CNE/رقم مسار",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      register: "تسجيل",
      already: "هل لديك حساب بالفعل؟",
      login: "تسجيل الدخول",
      mismatch: "كلمتا المرور غير متطابقتين",
      genericError: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
      pendingTitle: "تسجيل قيد الانتظار",
      pendingMessage:
        "شكراً لتسجيلك في ألباتروس. حسابك قيد المراجعة حالياً من قبل فريق الإدارة. بمجرد التحقق من معلوماتك، ستتلقى رسالة تأكيد عبر البريد الإلكتروني وستتمكن من تسجيل الدخول. نقدر صبرك وسنخبرك بأقرب وقت ممكن.",
      ok: "حسناً",
    },
  };

  const t = text[language];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        massar: form.massar,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setRegistrationComplete(true);
    } catch (err) {
      const msg = err.response?.data?.msg || t.genericError;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If registration is complete, show the pending validation message with an OK button
  if (registrationComplete) {
    return (
      <main
        className={`min-h-screen flex items-center justify-center px-4 py-10 ${
          darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-3xl shadow-sm border p-8 text-center ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
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

          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t.pendingTitle}</h2>
            <p
              className={`mt-2 mb-6 ${
                darkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {t.pendingMessage}
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              {t.ok}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Otherwise, show the registration form
  return (
    <main
      className={`min-h-screen flex items-center justify-center px-4 py-10 ${
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="massar"
            type="text"
            placeholder={t.massar}
            value={form.massar}
            onChange={handleChange}
            className={`w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          />

          <input
            name="username"
            placeholder={t.fullName}
            value={form.username}
            onChange={handleChange}
            className={`w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          />

          <input
            name="email"
            type="email"
            placeholder={t.email}
            value={form.email}
            onChange={handleChange}
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
            value={form.password}
            onChange={handleChange}
            className={`w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
              darkMode
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
            required
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder={t.confirmPassword}
            value={form.confirmPassword}
            onChange={handleChange}
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
            {loading ? "..." : t.register}
          </Button>
        </form>

        <p
          className={`mt-6 text-sm text-center ${
            darkMode ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {t.already}{" "}
          <Link to="/login" className="text-cyan-500 font-bold">
            {t.login}
          </Link>
        </p>
      </div>
    </main>
  );
}