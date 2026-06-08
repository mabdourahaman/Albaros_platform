import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { registerUser } from "../../services/authService";
import api from "../../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();

  const [form, setForm] = useState({
    accountType: "student",
    username: "",
    massar: "",
    email: "",
    level: "",
    subject: "",
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
      subtitle:
        "Register as a student or teacher. Your email will be verified before admin approval.",
      accountType: "Account type",
      student: "Student",
      teacher: "Teacher",
      fullName: "Full name",
      massar: "Massar code",
      email: "Email address",
      level: "School level",
      chooseLevel: "Choose school level",
      level5: "5ème primaire",
      level6: "6ème primaire",
      subject: "Teaching subject",
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
      verifySubtitle:
        "We sent a verification code to your email. Enter it below to continue.",
      code: "Verification code",
      verify: "Verify email",
      verifying: "Verifying...",
      resend: "Resend code",
      resending: "Resending...",
      pendingTitle: "Registration pending validation",
      pendingMessage:
        "Your email has been verified. Your account is now waiting for admin approval. You can login after your account is accepted.",
      ok: "Back to home",
    },
    fr: {
      brand: "Albatros",
      subtitleBrand: "Plateforme e-learning",
      title: "Créer un compte",
      subtitle:
        "Inscrivez-vous comme élève ou enseignant. Votre email sera vérifié avant la validation de l'administrateur.",
      accountType: "Type de compte",
      student: "Élève",
      teacher: "Enseignant",
      fullName: "Nom complet",
      massar: "Code Massar",
      email: "Adresse e-mail",
      level: "Niveau scolaire",
      chooseLevel: "Choisir le niveau scolaire",
      level5: "5ème primaire",
      level6: "6ème primaire",
      subject: "Matière enseignée",
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
      verifySubtitle:
        "Nous avons envoyé un code de vérification à votre email. Saisissez-le ci-dessous pour continuer.",
      code: "Code de vérification",
      verify: "Vérifier l'email",
      verifying: "Vérification...",
      resend: "Renvoyer le code",
      resending: "Renvoi...",
      pendingTitle: "Inscription en attente de validation",
      pendingMessage:
        "Votre email a été vérifié. Votre compte attend maintenant la validation de l'administrateur. Vous pourrez vous connecter après l'acceptation.",
      ok: "Retour à l'accueil",
    },
    ar: {
      brand: "ألباتروس",
      subtitleBrand: "منصة تعليمية",
      title: "إنشاء حساب",
      subtitle:
        "سجل كتلميذ أو أستاذ. سيتم التحقق من البريد الإلكتروني قبل موافقة المسؤول.",
      accountType: "نوع الحساب",
      student: "تلميذ",
      teacher: "أستاذ",
      fullName: "الاسم الكامل",
      massar: "رقم مسار",
      email: "البريد الإلكتروني",
      level: "المستوى الدراسي",
      chooseLevel: "اختر المستوى الدراسي",
      level5: "الخامس ابتدائي",
      level6: "السادس ابتدائي",
      subject: "المادة التي تدرسها",
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
      verifySubtitle:
        "أرسلنا رمز تحقق إلى بريدك الإلكتروني. أدخله بالأسفل للمتابعة.",
      code: "رمز التحقق",
      verify: "تأكيد البريد",
      verifying: "جار التحقق...",
      resend: "إعادة إرسال الرمز",
      resending: "جار الإرسال...",
      pendingTitle: "التسجيل في انتظار الموافقة",
      pendingMessage:
        "تم التحقق من بريدك الإلكتروني. حسابك الآن في انتظار موافقة المسؤول. يمكنك تسجيل الدخول بعد القبول.",
      ok: "العودة إلى الرئيسية",
    },
  };

  const t = text[language];

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const labelClass = `block text-sm font-bold mb-2 ${
    darkMode ? "text-slate-200" : "text-slate-700"
  }`;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleAccountType(type) {
    setForm({
      ...form,
      accountType: type,
      level: "",
      subject: "",
    });
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
        account_type: form.accountType,
        username: form.username,
        massar: form.accountType === "student" ? form.massar : "",
        email: form.email,
        level: form.accountType === "student" ? form.level : "",
        subject: form.accountType === "teacher" ? form.subject : "",
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
      const response = await api.post("/auth/resend-code", {
        email: verificationEmail,
      });

      setMessage(response.data.msg || "");
    } catch (err) {
      setError(err.response?.data?.msg || t.genericError);
    } finally {
      setLoading(false);
    }
  }

  function renderTopBrand() {
    return (
      <div className="flex items-center justify-between">
        <Link to="/" className="block">
          <h1 className="text-2xl font-extrabold text-cyan-500">{t.brand}</h1>
          <p
            className={`text-xs font-semibold ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t.subtitleBrand}
          </p>
        </Link>

        <SettingsControls />
      </div>
    );
  }

  function renderBackHome() {
    return (
      <div
        className={`mt-5 pt-5 border-t text-center ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}
      >
        <Link
          to="/"
          className={`text-sm font-bold transition ${
            darkMode
              ? "text-slate-300 hover:text-cyan-400"
              : "text-slate-500 hover:text-cyan-500"
          }`}
        >
          {t.backHome}
        </Link>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <main
        dir={language === "ar" ? "rtl" : "ltr"}
        className={`min-h-screen flex items-center justify-center px-4 py-10 ${
          darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-3xl border p-8 text-center shadow-sm ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-100"
          }`}
        >
          <Link to="/" className="block">
            <h1 className="text-2xl font-extrabold text-cyan-500">
              {t.brand}
            </h1>
            <p
              className={`text-xs font-semibold ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {t.subtitleBrand}
            </p>
          </Link>

          <h2 className="mt-10 text-2xl font-extrabold">{t.pendingTitle}</h2>

          <p
            className={`mt-4 leading-relaxed ${
              darkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {t.pendingMessage}
          </p>

          {message && (
            <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 font-bold text-center">
              {message}
            </div>
          )}

          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full rounded-2xl bg-cyan-500 px-5 py-3 font-extrabold text-white transition hover:bg-cyan-600"
          >
            {t.ok}
          </button>

          {renderBackHome()}
        </div>
      </main>
    );
  }

  if (step === "verify") {
    return (
      <main
        dir={language === "ar" ? "rtl" : "ltr"}
        className={`min-h-screen flex items-center justify-center px-4 py-10 ${
          darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div
          className={`w-full max-w-md rounded-3xl border p-8 shadow-sm ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-100"
          }`}
        >
          {renderTopBrand()}

          <div className="mt-10">
            <h2 className="text-3xl font-extrabold">{t.verifyTitle}</h2>

            <p
              className={`mt-3 leading-relaxed ${
                darkMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {t.verifySubtitle}
            </p>

            <p className="mt-3 text-sm font-bold text-cyan-500">
              {verificationEmail}
            </p>
          </div>

          <form onSubmit={handleVerifyEmail} className="mt-8 space-y-5">
            <div>
              <label className={labelClass}>{t.code}</label>
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength="6"
                className={inputClass}
                required
              />
            </div>

            {message && (
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 font-bold text-center">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 px-5 py-3 font-extrabold text-white transition hover:bg-cyan-600 disabled:opacity-60"
            >
              {loading ? t.verifying : t.verify}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className={`w-full rounded-2xl border px-5 py-3 font-extrabold transition disabled:opacity-60 ${
                darkMode
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {loading ? t.resending : t.resend}
            </button>
          </form>

          {renderBackHome()}
        </div>
      </main>
    );
  }

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 py-10 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border p-8 shadow-sm ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-100"
        }`}
      >
        {renderTopBrand()}

        <div className="mt-10">
          <h2 className="text-3xl font-extrabold">{t.title}</h2>

          <p
            className={`mt-3 leading-relaxed ${
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
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 px-5 py-3 font-extrabold text-white transition hover:bg-cyan-600 disabled:opacity-60"
          >
            {loading ? t.loading : t.register}
          </button>
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

        {renderBackHome()}
      </div>
    </main>
  );
}