function EditorToolbar() {
  return (
    <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3">

      <div className="flex items-center gap-3">

        <span className="text-gray-400">
          📄 Current File
        </span>

        <span className="bg-slate-800 px-3 py-1 rounded-lg text-sm">
          Main.java
        </span>

      </div>

      <div className="flex gap-2">

        <button className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
          Copy
        </button>

        <button className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
          Clear
        </button>

      </div>

    </div>
  );
}

export default EditorToolbar;