function WorkspaceLayout({
  sidebar,
  editor,
  rightPanel,
  statusBar,
}) {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800">
          {sidebar}
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-auto">
          {editor}
        </main>

        {/* Right Panel */}
        <aside className="w-96 border-l border-slate-800 overflow-auto">
          {rightPanel}
        </aside>

      </div>

      <footer className="border-t border-slate-800">
        {statusBar}
      </footer>

    </div>
  );
}

export default WorkspaceLayout;