import ResultsPanel from "../analysis/ResultsPanel";

function RightPanel({ result }) {
  return (
    <div className="h-full p-4 overflow-auto">
      <ResultsPanel result={result} />
    </div>
  );
}

export default RightPanel;