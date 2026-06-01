import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 max-w-lg w-full">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Choose Your Role
        </h1>

        <div className="mt-6 grid gap-4">
          <Button onClick={() => navigate("/student")}>Student</Button>
          <Button variant="outline" onClick={() => navigate("/teacher")}>Teacher</Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>Admin</Button>
        </div>
      </div>
    </main>
  );
}