import { useState } from "react";
import Button from "./Button";
import api from "../../services/api";
import { useSettings } from "../../context/SettingsContext";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { darkMode } = useSettings();
  const [step, setStep] = useState(1); // 1: demande code, 2: vérification
  const [currentPassword, setCurrentPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/request-password-change", {
        current_password: currentPassword,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || "Error requesting code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndChange = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-and-change-password", {
        code: verificationCode,
        new_password: newPassword,
      });
      setSuccess("Password changed successfully! You will receive a confirmation email.");
      setTimeout(() => {
        onClose();
        setStep(1);
        setCurrentPassword("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Error changing password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
        <h2 className={`text-2xl font-extrabold mb-4 text-center ${darkMode ? "text-white" : "text-black"}`}>
          Change Password
        </h2>
        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
              }`}
              required
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Verification Code"}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndChange} className="space-y-4">
            <p className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
              A 6-digit code has been sent to your email. Enter it below.
            </p>
            <input
              type="text"
              placeholder="Verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
              }`}
              required
              maxLength={6}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
              }`}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300 text-black"
              }`}
              required
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {success && <div className="text-green-500 text-sm text-center">{success}</div>}
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" disabled={loading}>{loading ? "Changing..." : "Change Password"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}