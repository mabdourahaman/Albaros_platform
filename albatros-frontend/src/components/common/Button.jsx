export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  onClick,
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600",
    orange: "bg-orange-500 text-white hover:bg-orange-600",
    outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}