import Card from "../../../components/common/Card";
import { useSettings } from "../../../context/SettingsContext";

export default function ContentManagementPage() {
  const { darkMode } = useSettings();

  return (
    <div>
      <h1 className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
        Content Management
      </h1>
      <p className={`mt-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
        Manage courses, exercises, quizzes, and educational content.
      </p>

      <Card className="mt-6">
        <p className={`${darkMode ? "text-slate-300" : "text-slate-500"}`}>
          This section allows you to create, edit, or delete learning materials.
        </p>
        {/* Vous pouvez ajouter ici des formulaires ou des listes */}
      </Card>
    </div>
  );
}