import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import api from "../../../services/api";
import Loader from "../../../components/common/Loader";

export default function ScoresHistoryPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get("/student/results");
        setResults(response.data);
      } catch (err) {
        setError("Impossible de charger l'historique des scores.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900">
        Scores History
      </h1>
      <p className="mt-2 text-slate-500">
        View your previous results.
      </p>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-3">Quiz ID</th>
              <th className="py-3">Score</th>
              <th className="py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.quiz_id} className="border-b border-slate-100">
                <td className="py-4 font-bold">{result.quiz_id}</td>
                <td className="py-4">{result.score}%</td>
                <td className="py-4 text-slate-500">
                  {new Date(result.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            No scores yet. Take a quiz to see your results.
          </div>
        )}
      </Card>
    </div>
  );
}