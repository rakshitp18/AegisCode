import { useState } from "react";

export default function useProject() {
  const [projectName, setProjectName] = useState("AegisCode Project");
  const [files, setFiles] = useState([
    {
      id: "1",
      name: "Main.java",
      language: "java",
      content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, AegisCode!");
    }
}`
    },
    {
      id: "2",
      name: "User.java",
      language: "java",
      content: `public class User {
    private String id;
    private String name;

    public User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getName() {
        return name;
    }
}`
    },
    {
      id: "3",
      name: "Login.java",
      language: "java",
      content: `public class Login {
    public boolean login(String username, String password) {
        if ("admin".equals(username) && "admin123".equals(password)) {
            return true;
        }
        return false;
    }
}`
    }
  ]);

  const [currentFileId, setCurrentFileId] = useState("1");

  const currentFile =
    files.find(file => file.id === currentFileId);

  const updateCurrentFile = (newContent) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === currentFileId
          ? { ...file, content: newContent }
          : file
      )
    );
  };

  const updateCurrentFileLanguage = (newLanguage) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === currentFileId
          ? { ...file, language: newLanguage }
          : file
      )
    );
  };

  const addNewFile = () => {
    const baseName = "NewFile";
    const ext = ".java";
    let name = `${baseName}${ext}`;
    let counter = 1;
    while (files.some(f => f.name === name)) {
      name = `${baseName}_${counter}${ext}`;
      counter++;
    }

    const newFile = {
      id: Date.now().toString(),
      name,
      language: "java",
      content: ""
    };

    setFiles(prevFiles => [...prevFiles, newFile]);
    setCurrentFileId(newFile.id);
  };

  const deleteFile = (idToDelete) => {
    if (files.length <= 1) return;

    const remainingFiles = files.filter(f => f.id !== idToDelete);
    if (currentFileId === idToDelete) {
      const deletedIndex = files.findIndex(f => f.id === idToDelete);
      const newActiveFile = remainingFiles[deletedIndex - 1] || remainingFiles[0];
      setCurrentFileId(newActiveFile.id);
    }
    setFiles(remainingFiles);
  };

  return {
    projectName,
    setProjectName,
    files,
    currentFile,
    currentFileId,
    setCurrentFileId,
    updateCurrentFile,
    updateCurrentFileLanguage,
    addNewFile,
    deleteFile,
  };
}