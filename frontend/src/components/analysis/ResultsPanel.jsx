import AnalysisCard from "./AnalysisCard";

function ResultsPanel({ result }) {
  if (!result) {
    return (
      <AnalysisCard title="Analysis Result" icon="📊">
        <p className="text-gray-400">
          No analysis yet.
        </p>
      </AnalysisCard>
    );
  }

  return (
    <div className="space-y-6">

      <AnalysisCard title="Summary" icon="📋">
        <p>{result.summary}</p>
      </AnalysisCard>

      <AnalysisCard title="Bugs" icon="🐞">
        {result.bugs.length === 0 ? (
          <p>No bugs detected.</p>
        ) : (
          <ul className="list-disc ml-6">
            {result.bugs.map((bug, i) => (
              <li key={i}>{bug}</li>
            ))}
          </ul>
        )}
      </AnalysisCard>

      <AnalysisCard title="Suggestions" icon="💡">
        <ul className="list-disc ml-6">
          {result.suggestions.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </AnalysisCard>

      <AnalysisCard title="Complexity" icon="⚡">
        <p>{result.complexity}</p>
      </AnalysisCard>

      <AnalysisCard title="Generated Tests" icon="🧪">
        {result.tests.length === 0 ? (
          <p>No tests generated.</p>
        ) : (
          <ul className="list-disc ml-6">
            {result.tests.map((test, i) => (
              <li key={i}>{test}</li>
            ))}
          </ul>
        )}
      </AnalysisCard>
      <AnalysisCard title="Code Metrics" icon="📊">
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Lines</h3>
            <p className="text-3xl font-bold">
              {result.metrics.lines}
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Classes</h3>
            <p className="text-3xl font-bold">
              {result.metrics.classes}
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Methods</h3>
            <p className="text-3xl font-bold">
              {result.metrics.methods}
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-gray-400">TODOs</h3>
            <p className="text-3xl font-bold">
              {result.metrics.todos}
            </p>
          </div>

        </div>
      </AnalysisCard>

    </div>
  );
}

export default ResultsPanel;