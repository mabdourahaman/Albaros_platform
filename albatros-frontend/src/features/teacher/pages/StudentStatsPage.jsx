import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function StudentStatsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get("/teacher/students");
        setStudents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">Student Statistics</h1>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-3">Name</th>
              <th className="py-3">Email</th>
              <th className="py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-slate-100">
                <td className="py-4 font-bold">{student.username}</td>
                <td className="py-4 text-slate-500">{student.email}</td>
                <td className="py-4">{student.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className="text-center text-slate-500 py-8">No students found.</div>}
      </Card>
    </div>
  );
}