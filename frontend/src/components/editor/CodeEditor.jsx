import Editor from "@monaco-editor/react";

function CodeEditor({ language, code, setCode, editorRef }) {
  const handleEditorDidMount = (editor, monaco) => {
    if (editorRef) {
      editorRef.current = editor;
    }
  };

  return (
    <Editor
      height="500px"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || "")}
      onMount={handleEditorDidMount}
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