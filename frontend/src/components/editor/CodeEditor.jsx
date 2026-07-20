import Editor from "@monaco-editor/react";

function CodeEditor({ language, code, setCode }) {
  return (
    <Editor
      height="500px"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || "")}
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 16,
        automaticLayout: true,
      }}
    />
  );
}

export default CodeEditor;