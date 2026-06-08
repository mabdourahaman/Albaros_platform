import { useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import { useSettings } from "../../../context/SettingsContext";

export default function AccountSettingsPage() {
  const { darkMode } = useSettings();

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [user, setUser] = useState(savedUser);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [emailForm, setEmailForm] = useState({
    new_email: "",
    code: "",
  });

  const [disablePassword, setDisablePassword] = useState("");

  const [emailStep, setEmailStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass = `w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 ${
    darkMode
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;

  const labelClass = `block text-sm font-bold mb-2 ${
    darkMode ? "text-slate-200" : "text-slate-700"
  }`;

  function updateStoredUser(updatedUser) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  function handlePasswordChange(e) {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  }

  function handleEmailChange(e) {
    setEmailForm({
      ...emailForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/account/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      setMessage(response.data.msg || "Password changed successfully.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestEmailChange(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await api.post("/account/change-email/request", {
        new_email: emailForm.new_email,
      });

      setMessage(response.data.msg || "Verification code sent.");
      setEmailStep("confirm");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to request email change.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmEmailChange(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await api.post("/account/change-email/confirm", {
        code: emailForm.code,
      });

      updateStoredUser(response.data.user);
      setMessage(response.data.msg || "Email changed successfully.");
      setEmailForm({
        new_email: "",
        code: "",
      });
      setEmailStep("request");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to confirm email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable2FA() {
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await api.post("/account/2fa/enable");
      updateStoredUser(response.data.user);
      setMessage(response.data.msg || "2FA enabled successfully.");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to enable 2FA.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable2FA(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await api.post("/account/2fa/disable", {
        password: disablePassword,
      });

      updateStoredUser(response.data.user);
      setMessage(response.data.msg || "2FA disabled successfully.");
      setDisablePassword("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>
        <h1
          className={`text-3xl font-extrabold ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Account Settings
        </h1>

        <p
          className={`mt-2 ${
            darkMode ? "text-slate-300" : "text-slate-500"
          }`}
        >
          Manage your password, email, and account security.
        </p>
      </div>

      {message && (
        <div className="mt-6 rounded-2xl bg-green-50 px-5 py-4 text-green-700 font-bold">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-red-700 font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card>
          <h2 className="text-xl font-extrabold">Profile</h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                Name
              </p>
              <p className="font-bold">{user.username || "-"}</p>
            </div>

            <div>
              <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                Email
              </p>
              <p className="font-bold">{user.email || "-"}</p>
            </div>

            <div>
              <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                Role
              </p>
              <p className="font-bold capitalize">{user.role || "-"}</p>
            </div>

            {user.role === "student" && (
              <>
                <div>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    Massar
                  </p>
                  <p className="font-bold">{user.massar || "-"}</p>
                </div>

                <div>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    Level
                  </p>
                  <p className="font-bold">{user.level || "-"}</p>
                </div>
              </>
            )}

            {user.role === "teacher" && (
              <div>
                <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                  Subject
                </p>
                <p className="font-bold">{user.subject || "-"}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-extrabold">Change password</h2>

          <form onSubmit={handleChangePassword} className="mt-5 space-y-5">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                name="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>New password</label>
              <input
                name="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                name="confirm_password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Change password"}
            </button>
          </form>
        </Card>

        {user.role === "teacher" && (
          <Card>
            <h2 className="text-xl font-extrabold">Change email</h2>

            {emailStep === "request" ? (
              <form
                onSubmit={handleRequestEmailChange}
                className="mt-5 space-y-5"
              >
                <div>
                  <label className={labelClass}>New email</label>
                  <input
                    name="new_email"
                    type="email"
                    value={emailForm.new_email}
                    onChange={handleEmailChange}
                    className={inputClass}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleConfirmEmailChange}
                className="mt-5 space-y-5"
              >
                <div>
                  <label className={labelClass}>Verification code</label>
                  <input
                    name="code"
                    value={emailForm.code}
                    onChange={handleEmailChange}
                    placeholder="123456"
                    maxLength="6"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Confirm email"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailStep("request")}
                    className={`rounded-xl px-5 py-3 font-bold border transition ${
                      darkMode
                        ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-extrabold">Two-factor authentication</h2>

          <p
            className={`mt-3 leading-relaxed ${
              darkMode ? "text-slate-300" : "text-slate-500"
            }`}
          >
            When 2FA is active, a verification code will be sent to your email
            every time you log in.
          </p>

          <div className="mt-5">
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                user.two_factor_enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user.two_factor_enabled ? "2FA active" : "2FA inactive"}
            </span>
          </div>

          {!user.two_factor_enabled ? (
            <button
              onClick={handleEnable2FA}
              disabled={loading}
              className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-60"
            >
              {loading ? "Activating..." : "Activate 2FA"}
            </button>
          ) : (
            <form onSubmit={handleDisable2FA} className="mt-6 space-y-5">
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-red-500 px-5 py-3 text-white font-bold hover:bg-red-600 transition disabled:opacity-60"
              >
                {loading ? "Disabling..." : "Disable 2FA"}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}