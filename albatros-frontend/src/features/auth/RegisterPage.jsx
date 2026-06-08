import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { User, Mail, Lock, School, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { registerUser } from "../../services/authService";
import api from "../../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();

  const [form, setForm] = useState({
    username: "",
    massar: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState("register");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const text = {
    en: {
      brand: "Albatros",
      subtitleBrand: "E-learning platform",
      title: "Create an account",
      subtitle: "Register as a student. Your email will be verified before admin approval.",
      fullName: "Full name",
      massar: "Massar code",
      email: "Email address",
      password: "Password",
      confirmPassword: "Confirm password",
      register: "Register",
      loading: "Registering...",
      already: "Already have an account?",
      login: "Login",
      backHome: "Back to home",
      mismatch: "Passwords do not match.",
      genericError: "Registration failed. Please try again.",
      verifyTitle: "Verify your email",
      verifySubtitle: "We sent a verification code to your email. Enter it below to continue.",
      code: "Verification code",
      verify: "Verify email",
      verifying: "Verifying...",
      resend: "Resend code",
      resending: "Resending...",
      pendingTitle: "Registration pending validation",
      pendingMessage: "Your email has been verified. Your account is now waiting for admin approval. You can login after your account is accepted.",
      ok: "Back to home",
    },
    fr: {
      brand: "Albatros",
      subtitleBrand: "Plateforme e-learning",
      title: "Créer un compte",
      subtitle: "Inscrivez-vous en tant qu'élève. Votre email sera vérifié avant la validation de l'administrateur.",
      fullName: "Nom complet",
      massar: "Code Massar",
      email: "Adresse e-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      register: "S'inscrire",
      loading: "Inscription...",
      already: "Vous avez déjà un compte ?",
      login: "Connexion",
      backHome: "Retour à l'accueil",
      mismatch: "Les mots de passe ne correspondent pas.",
      genericError: "Échec de l'inscription. Veuillez réessayer.",
      verifyTitle: "Vérifiez votre email",
      verifySubtitle: "Nous avons envoyé un code de vérification à votre email. Saisissez-le ci-dessous pour continuer.",
      code: "Code de vérification",
      verify: "Vérifier l'email",
      verifying: "Vérification...",
      resend: "Renvoyer le code",
      resending: "Renvoi...",
      pendingTitle: "Inscription en attente de validation",
      pendingMessage: "Votre email a été vérifié. Votre compte attend maintenant la validation de l'administrateur. Vous pourrez vous connecter après l'acceptation.",
      ok: "Retour à l'accueil",
    },
    ar: {
      brand: "ألباتروس",
      subtitleBrand: "منصة تعليمية",
      title: "إنشاء حساب",
      subtitle: "سجل كتلميذ. سيتم التحقق من البريد الإلكتروني قبل موافقة المسؤول.",
      fullName: "الاسم الكامل",
      massar: "رقم مسار",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      register: "تسجيل",
      loading: "جار التسجيل...",
      already: "لديك حساب بالفعل؟",
      login: "تسجيل الدخول",
      backHome: "العودة إلى الرئيسية",
      mismatch: "كلمتا المرور غير متطابقتين.",
      genericError: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
      verifyTitle: "تحقق من بريدك الإلكتروني",
      verifySubtitle: "أرسلنا رمز تحقق إلى بريدك الإلكتروني. أدخله بالأسفل للمتابعة.",
      code: "رمز التحقق",
      verify: "تأكيد البريد",
      verifying: "جار التحقق...",
      resend: "إعادة إرسال الرمز",
      resending: "جار الإرسال...",
      pendingTitle: "التسجيل في انتظار الموافقة",
      pendingMessage: "تم التحقق من بريدك الإلكتروني. حسابك الآن في انتظار موافقة المسؤول. يمكنك تسجيل الدخول بعد القبول.",
      ok: "العودة إلى الرئيسية",
    },
  };

  const t = text[language];

  // Styles modernes (identique à LoginPage)
  const inputIconClass = "absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500";
  const inputFieldClass = `w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
    darkMode
      ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({
        account_type: "student",
        username: form.username,
        massar: form.massar,
        email: form.email,
        level: "",        // niveau vide – le backend peut définir une valeur par défaut ou l'ignorer
        subject: "",
        password: form.password,
      });
      setVerificationEmail(response.email || form.email);
      setStep("verify");
      setMessage(response.msg || "");
    } catch (err) {
      setError(err.response?.data?.msg || t.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-email", {
        email: verificationEmail,
        code: verificationCode,
      });
      setStep("complete");
      setMessage(response.data.msg || "");
    } catch (err) {
      setError(err.response?.data?.msg || t.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await api.post("/auth/resend-code", { email: verificationEmail });
      setMessage(response.data.msg || "");
    } catch (err) {
      setError(err.response?.data?.msg || t.genericError);
    } finally {
      setLoading(false);
    }
  }

  function renderTopBrand() {
    return (
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="block group">
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            {t.brand}
          </h1>
          <p className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            {t.subtitleBrand}
          </p>
        </Link>
        <SettingsControls />
      </div>
    );
  }

  function renderBackHome() {
    return (
      <div className="mt-6 pt-4 border-t text-center border-slate-200 dark:border-slate-800">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition"
        >
          <ArrowLeft size={14} /> {t.backHome}
        </Link>
      </div>
    );
  }

  // Écran final après vérification
  if (step === "complete") {
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 to-indigo-50"}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        <div className={`w-full max-w-md relative z-10 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 ${darkMode ? "bg-slate-900/80 border border-slate-800" : "bg-white/70 border border-white/30"}`}>
          <div className="p-8">
            {renderTopBrand()}
            <h2 className={`text-3xl font-extrabold text-center ${darkMode ? "text-white" : "text-slate-900"}`}>{t.pendingTitle}</h2>
            <p className={`mt-4 text-center leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{t.pendingMessage}</p>
            {message && (
              <div className="mt-5 flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-xl text-sm font-medium justify-center">
                <CheckCircle size={16} /> {message}
              </div>
            )}
            <button onClick={() => navigate("/")} className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg">
              {t.ok}
            </button>
            {renderBackHome()}
          </div>
        </div>
      </main>
    );
  }

  // Écran de vérification email
  if (step === "verify") {
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 to-indigo-50"}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        <div className={`w-full max-w-md relative z-10 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 ${darkMode ? "bg-slate-900/80 border border-slate-800" : "bg-white/70 border border-white/30"}`}>
          <div className="p-8">
            {renderTopBrand()}
            <div className="mb-8">
              <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.verifyTitle}</h2>
              <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{t.verifySubtitle}</p>
              <p className="mt-2 text-sm font-semibold text-cyan-600">{verificationEmail}</p>
            </div>
            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <div className="relative">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t.code}
                  maxLength="6"
                  className={inputFieldClass}
                  required
                />
                <Lock size={18} className={inputIconClass} />
              </div>
              {message && (
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-xl text-sm font-medium">
                  <CheckCircle size={16} /> {message}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm font-medium">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60">
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : t.verify}
              </button>
              <button type="button" onClick={handleResendCode} disabled={loading} className={`w-full border text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${darkMode ? "border-slate-700" : "border-slate-300"}`}>
                {loading ? t.resending : t.resend}
              </button>
            </form>
            {renderBackHome()}
          </div>
        </div>
      </main>
    );
  }

  // Formulaire principal d'inscription
  return (
    <main className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 to-indigo-50"}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      <div className={`w-full max-w-lg relative z-10 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 ${darkMode ? "bg-slate-900/80 border border-slate-800" : "bg-white/70 border border-white/30"}`}>
        <div className="p-8">
          {renderTopBrand()}
          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>{t.title}</h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom complet */}
            <div className="relative">
              <input
                name="username"
                type="text"
                placeholder={t.fullName}
                value={form.username}
                onChange={handleChange}
                className={inputFieldClass}
                required
              />
              <User size={18} className={inputIconClass} />
            </div>

            {/* Email */}
            <div className="relative">
              <input
                name="email"
                type="email"
                placeholder={t.email}
                value={form.email}
                onChange={handleChange}
                className={inputFieldClass}
                required
              />
              <Mail size={18} className={inputIconClass} />
            </div>

            {/* Massar */}
            <div className="relative">
              <input
                name="massar"
                type="text"
                placeholder={t.massar}
                value={form.massar}
                onChange={handleChange}
                className={inputFieldClass}
                required
              />
              <School size={18} className={inputIconClass} />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <input
                name="password"
                type="password"
                placeholder={t.password}
                value={form.password}
                onChange={handleChange}
                className={inputFieldClass}
                required
              />
              <Lock size={18} className={inputIconClass} />
            </div>

            {/* Confirmation mot de passe */}
            <div className="relative">
              <input
                name="confirmPassword"
                type="password"
                placeholder={t.confirmPassword}
                value={form.confirmPassword}
                onChange={handleChange}
                className={inputFieldClass}
                required
              />
              <Lock size={18} className={inputIconClass} />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm font-medium">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60 disabled:scale-100"
            >
              {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.loading}</div> : t.register}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-500 dark:text-slate-400">
            {t.already}{" "}
            <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition">
              {t.login}
            </Link>
          </p>

          {renderBackHome()}
        </div>
      </div>
    </main>
  );
}