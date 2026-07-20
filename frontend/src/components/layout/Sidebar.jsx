function Sidebar() {
  return (
    <div className="h-full bg-slate-900 p-4">

      <h2 className="text-xl font-bold mb-6">
        Explorer
      </h2>

      <div className="space-y-3">

        <div className="bg-slate-800 p-3 rounded-lg">
          📄 Main.java
        </div>

        <div className="bg-slate-800 p-3 rounded-lg">
          📄 User.java
        </div>

        <div className="bg-slate-800 p-3 rounded-lg">
          📄 Login.java
        </div>

      </div>

      <hr className="my-6 border-slate-700" />

      <div className="space-y-3">

        <div>🐙 GitHub Repository</div>

        <div>🕘 History</div>

        <div>⚙ Settings</div>

      </div>

    </div>
  );
}

export default Sidebar;