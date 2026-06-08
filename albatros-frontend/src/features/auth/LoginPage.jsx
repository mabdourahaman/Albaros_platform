import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SettingsControls from "../../components/common/SettingsControls";
import { useSettings } from "../../context/SettingsContext";
import { loginUser } from "../../services/authService";
import api from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { darkMode, language } = useSettings();

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

  const text = {
    en: {
      brand: "Albatros",
      subtitleBrand: "E-learning platform",
      title: "Welcome back",
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
      resetCodeSubtitle: "Check Mailtrap inbox and enter the 6-digit code.",
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
      title: "Bon retour",
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
      resetCodeSubtitle: "Vérifiez Mailtrap et entrez le code à 6 chiffres.",
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
      title: "مرحباً بعودتك",
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
      resetCodeSubtitle: "تحقق من Mailtrap وأدخل الرمز المكون من 6 أرقام.",
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

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const labelClass = `block text-sm font-bold mb-2 ${
    darkMode ? "text-slate-200" : "text-slate-700"
  }`;

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
      const data = await loginUser({
        identifier,
        password,
      });

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
      const response = await api.post("/auth/forgot-password", {
        email: resetEmail,
      });

      setMessage(response.data.msg || "");
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
      const response = await api.post("/auth/verify-reset-code", {
        email: resetEmail,
        code: resetCode,
      });

      setMessage(response.data.msg || "");
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

      setIdentifier(resetEmail);
      setPassword("");
      setStep("login");
      setMessage(t.passwordChanged);
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
        <div className="flex items-center justify-between">
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

          <SettingsControls />
        </div>

        {step === "login" && (
          <>
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

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>{t.identifier}</label>

                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="A12345678 or name@albatros.ma"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>{t.password}</label>

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className={inputClass}
                  required
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setStep("forgot-password");
                  }}
                  className="text-sm font-bold text-cyan-500 hover:text-cyan-600"
                >
                  {t.forgotPassword}
                </button>
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
                {loading ? t.loading : t.login}
              </button>
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
          </>
        )}

        {step === "2fa" && (
          <>
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold">{t.codeTitle}</h2>

              <p
                className={`mt-3 leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {t.codeSubtitle}
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>{t.codeLabel}</label>

                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className={inputClass}
                  required
                />
              </div>

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
                onClick={goToLogin}
                className={`w-full rounded-2xl border px-5 py-3 font-extrabold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.backLogin}
              </button>
            </form>
          </>
        )}

        {step === "forgot-password" && (
          <>
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold">{t.resetTitle}</h2>

              <p
                className={`mt-3 leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {t.resetSubtitle}
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>{t.resetEmail}</label>

                <input
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  type="email"
                  placeholder="name@email.com"
                  className={inputClass}
                  required
                />
              </div>

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
                {loading ? t.sending : t.sendCode}
              </button>

              <button
                type="button"
                onClick={goToLogin}
                className={`w-full rounded-2xl border px-5 py-3 font-extrabold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.backLogin}
              </button>
            </form>
          </>
        )}

        {step === "reset-code" && (
          <>
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold">{t.resetCodeTitle}</h2>

              <p
                className={`mt-3 leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {t.resetCodeSubtitle}
              </p>

              <p className="mt-3 text-sm font-bold text-cyan-500">
                {resetEmail}
              </p>
            </div>

            <form onSubmit={handleVerifyResetCode} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>{t.resetCode}</label>

                <input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
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
                onClick={goToLogin}
                className={`w-full rounded-2xl border px-5 py-3 font-extrabold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.backLogin}
              </button>
            </form>
          </>
        )}

        {step === "new-password" && (
          <>
            <div className="mt-10">
              <h2 className="text-3xl font-extrabold">{t.resetTitle}</h2>

              <p
                className={`mt-3 leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {t.resetEmail}: {resetEmail}
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>{t.newPassword}</label>

                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>{t.confirmNewPassword}</label>

                <input
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  type="password"
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
                {loading ? t.changing : t.changePassword}
              </button>

              <button
                type="button"
                onClick={goToLogin}
                className={`w-full rounded-2xl border px-5 py-3 font-extrabold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.backLogin}
              </button>
            </form>
          </>
        )}

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
      </div>
    </main>
  );
}