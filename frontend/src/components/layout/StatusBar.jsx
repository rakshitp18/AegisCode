function StatusBar({ language, code }) {
  const lines = code.split("\n").length;
  const characters = code.length;

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-between text-sm">
      <span>{language.toUpperCase()}</span>

      <span>
        Lines: {lines} | Characters: {characters}
      </span>
    </div>
  );
}

export default StatusBar;