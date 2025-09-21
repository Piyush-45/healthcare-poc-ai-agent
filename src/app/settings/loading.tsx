export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-10 bg-slate-200 rounded w-full"></div>
        <div className="h-10 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}
