function AnalyzeButton({ onAnalyze, loading }) {
  return (
    <button
      onClick={onAnalyze}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
    >
      {loading ? "Analyzing..." : "Analyze Code"}
    </button>
  );
}

export default AnalyzeButton;