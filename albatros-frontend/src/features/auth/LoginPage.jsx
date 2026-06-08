import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Key, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { loginUser } from "../../services/authService";
import api from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();

  // États
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [step, setStep] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Traductions
  const text = {
    en: {
      brand: "Albatros",
      subtitleBrand: "E-learning platform",
      title: "Welcome",
      subtitle: "Login using your Massar code or email address.",
      identifier: "Massar or email address",
      password: "Password",
      login: "Login",
      loading: "Logging in...",
      noAccount: "Don't have an account?",
      register: "Create account",
      backHome: "Back to home",
      error: "Invalid credentials or account not accepted yet.",
      codeTitle: "Two-factor verification",
      codeSubtitle: "A verification code was sent to your email.",
      codeLabel: "Verification code",
      verify: "Verify code",
      verifying: "Verifying...",
      backLogin: "Back to login",
      forgotPassword: "Forgot password?",
      resetTitle: "Reset password",
      resetSubtitle: "Enter your email address to receive a 6-digit reset code.",
      resetEmail: "Email address",
      sendCode: "Send code",
      sending: "Sending...",
      resetCodeTitle: "Enter reset code",
      resetCodeSubtitle: "Check your inbox and enter the 6-digit code.",
      resetCode: "Reset code",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      changePassword: "Change password",
      changing: "Changing...",
      passwordMismatch: "Passwords do not match.",
      passwordChanged: "Password changed successfully. You can login now.",
    },
    fr: {
      brand: "Albatros",
      subtitleBrand: "Plateforme e-learning",
      title: "Bienvenue",
      subtitle: "Connectez-vous avec votre code Massar ou votre adresse e-mail.",
      identifier: "Massar ou adresse e-mail",
      password: "Mot de passe",
      login: "Se connecter",
      loading: "Connexion...",
      noAccount: "Vous n'avez pas de compte ?",
      register: "Créer un compte",
      backHome: "Retour à l'accueil",
      error: "Identifiants incorrects ou compte pas encore accepté.",
      codeTitle: "Vérification en deux étapes",
      codeSubtitle: "Un code de vérification a été envoyé à votre email.",
      codeLabel: "Code de vérification",
      verify: "Vérifier le code",
      verifying: "Vérification...",
      backLogin: "Retour à la connexion",
      forgotPassword: "Mot de passe oublié ?",
      resetTitle: "Réinitialiser le mot de passe",
      resetSubtitle: "Entrez votre email pour recevoir un code de réinitialisation à 6 chiffres.",
      resetEmail: "Adresse e-mail",
      sendCode: "Envoyer le code",
      sending: "Envoi...",
      resetCodeTitle: "Entrer le code",
      resetCodeSubtitle: "Vérifiez votre boîte de réception et entrez le code à 6 chiffres.",
      resetCode: "Code de réinitialisation",
      newPassword: "Nouveau mot de passe",
      confirmNewPassword: "Confirmer le nouveau mot de passe",
      changePassword: "Changer le mot de passe",
      changing: "Changement...",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      passwordChanged: "Mot de passe modifié avec succès. Vous pouvez vous connecter.",
    },
    ar: {
      brand: "ألباتروس",
      subtitleBrand: "منصة تعليمية",
      title: "مرحباً",
      subtitle: "سجل الدخول باستعمال رقم مسار أو البريد الإلكتروني.",
      identifier: "رقم مسار أو البريد الإلكتروني",
      password: "كلمة المرور",
      login: "تسجيل الدخول",
      loading: "جار تسجيل الدخول...",
      noAccount: "ليس لديك حساب؟",
      register: "إنشاء حساب",
      backHome: "العودة إلى الرئيسية",
      error: "المعلومات غير صحيحة أو الحساب لم يتم قبوله بعد.",
      codeTitle: "التحقق بخطوتين",
      codeSubtitle: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
      codeLabel: "رمز التحقق",
      verify: "تأكيد الرمز",
      verifying: "جار التحقق...",
      backLogin: "العودة إلى تسجيل الدخول",
      forgotPassword: "نسيت كلمة المرور؟",
      resetTitle: "إعادة تعيين كلمة المرور",
      resetSubtitle: "أدخل بريدك الإلكتروني لتلقي رمز مكون من 6 أرقام.",
      resetEmail: "البريد الإلكتروني",
      sendCode: "إرسال الرمز",
      sending: "جار الإرسال...",
      resetCodeTitle: "أدخل الرمز",
      resetCodeSubtitle: "تحقق من بريدك وأدخل الرمز المكون من 6 أرقام.",
      resetCode: "رمز التحقق",
      newPassword: "كلمة المرور الجديدة",
      confirmNewPassword: "تأكيد كلمة المرور الجديدة",
      changePassword: "تغيير كلمة المرور",
      changing: "جار التغيير...",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      passwordChanged: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    },
  };

  const t = text[language];

  // Styles modernes
  const inputIconClass = "absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500";
  const inputFieldClass = `w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
    darkMode
      ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  // Fonctions logiques
  function redirectByRole(user) {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.role === "student") navigate("/student");
    else if (user.role === "teacher") navigate("/teacher");
    else if (user.role === "admin") navigate("/admin");
    else navigate("/");
  }

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function goToLogin() {
    setStep("login");
    setError("");
    setMessage("");
    setTwoFactorCode("");
    setTwoFactorUserId(null);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await loginUser({ identifier, password });
      if (data.requires_2fa) {
        setTwoFactorUserId(data.user_id);
        setStep("2fa");
        return;
      }
      localStorage.setItem("token", data.access_token);
      redirectByRole(data.user);
    } catch (err) {
      setError(err.response?.data?.msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-2fa", {
        user_id: twoFactorUserId,
        code: twoFactorCode,
      });
      localStorage.setItem("token", response.data.access_token);
      redirectByRole(response.data.user);
    } catch (err) {
      setError(err.response?.data?.msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      setMessage("A reset code has been sent to your email.");
      setStep("reset-code");
    } catch (err) {
      setError(err.response?.data?.msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyResetCode(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-code", {
        email: resetEmail,
        code: resetCode,
      });
      setMessage("Code verified. Please enter your new password.");
      setStep("new-password");
    } catch (err) {
      setError(err.response?.data?.msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmNewPassword) {
      setError(t.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        code: resetCode,
        new_password: newPassword,
      });
      setMessage(t.passwordChanged);
      setStep("login");
      setIdentifier(resetEmail);
      setPassword("");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err.response?.data?.msg || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${
        darkMode ? "bg-slate-950" : "bg-gradient-to-br from-sky-50 to-indigo-50"
      }`}
    >
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
      </div>

      <div
        className={`w-full max-w-md relative z-10 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 ${
          darkMode ? "bg-slate-900/80 border border-slate-800" : "bg-white/70 border border-white/30"
        }`}
      >
        <div className="p-8">
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

          {/* Step: Login */}
          {step === "login" && (
            <>
              <div className="mb-8">
                <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {t.title}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {t.subtitle}
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t.identifier}
                    className={inputFieldClass}
                    required
                  />
                  <Mail size={18} className={inputIconClass} />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.password}
                    className={inputFieldClass}
                    required
                  />
                  <Lock size={18} className={inputIconClass} />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setStep("forgot-password");
                    }}
                    className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition"
                  >
                    {t.forgotPassword}
                  </button>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60 disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.loading}
                    </div>
                  ) : (
                    t.login
                  )}
                </button>
              </form>
              <p className="mt-6 text-sm text-center text-slate-500 dark:text-slate-400">
                {t.noAccount}{" "}
                <Link to="/register" className="font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition">
                  {t.register}
                </Link>
              </p>
            </>
          )}

          {/* Step: 2FA */}
          {step === "2fa" && (
            <>
              <div className="mb-8">
                <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {t.codeTitle}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {t.codeSubtitle}
                </p>
              </div>
              <form onSubmit={handleVerify2FA} className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder={t.codeLabel}
                    maxLength="6"
                    className={inputFieldClass}
                    required
                  />
                  <Key size={18} className={inputIconClass} />
                </div>
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg"
                >
                  {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : t.verify}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.backLogin}
                </button>
              </form>
            </>
          )}

          {/* Step: Forgot password (email) */}
          {step === "forgot-password" && (
            <>
              <div className="mb-8">
                <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {t.resetTitle}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {t.resetSubtitle}
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={t.resetEmail}
                    className={inputFieldClass}
                    required
                  />
                  <Mail size={18} className={inputIconClass} />
                </div>
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg"
                >
                  {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : t.sendCode}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.backLogin}
                </button>
              </form>
            </>
          )}

          {/* Step: Verify reset code */}
          {step === "reset-code" && (
            <>
              <div className="mb-8">
                <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {t.resetCodeTitle}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {t.resetCodeSubtitle}
                </p>
                <p className="mt-2 text-sm font-semibold text-cyan-600">{resetEmail}</p>
              </div>
              <form onSubmit={handleVerifyResetCode} className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder={t.resetCode}
                    maxLength="6"
                    className={inputFieldClass}
                    required
                  />
                  <Key size={18} className={inputIconClass} />
                </div>
                {message && <div className="text-green-600 text-sm text-center">{message}</div>}
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg"
                >
                  {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : t.verify}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.backLogin}
                </button>
              </form>
            </>
          )}

          {/* Step: New password */}
          {step === "new-password" && (
            <>
              <div className="mb-8">
                <h2 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {t.resetTitle}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {t.resetEmail}: {resetEmail}
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.newPassword}
                    className={inputFieldClass}
                    required
                  />
                  <Lock size={18} className={inputIconClass} />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t.confirmNewPassword}
                    className={inputFieldClass}
                    required
                  />
                  <Lock size={18} className={inputIconClass} />
                </div>
                {message && <div className="text-green-600 text-sm text-center">{message}</div>}
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-[1.02] active:scale-95 shadow-lg"
                >
                  {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : t.changePassword}
                </button>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.backLogin}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-4 border-t text-center border-slate-200 dark:border-slate-800">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition"
            >
              <ArrowLeft size={14} /> {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}