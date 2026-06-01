import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No data found",
  description = "There is nothing to show here yet.",
}) {
  return (
    <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-300">
      <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
        <Inbox className="text-blue-600" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}