function AnalysisCard({ title, icon, children }) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <span>{icon}</span>
        {title}
      </h2>

      {children}
    </div>
  );
}

export default AnalysisCard;