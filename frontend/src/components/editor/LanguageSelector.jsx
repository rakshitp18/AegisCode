function LanguageSelector({ language, setLanguage }) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700"
    >
      <option value="java">Java</option>
      <option value="python">Python</option>
      <option value="cpp">C++</option>
      <option value="javascript">JavaScript</option>
    </select>
  );
}

export default LanguageSelector;