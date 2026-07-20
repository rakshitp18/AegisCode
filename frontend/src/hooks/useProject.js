import { useState } from "react";

export default function useProject() {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Main.java",
      language: "java",
      content:
`public class Main {

    public static void main(String[] args){

        System.out.println("Hello");

    }

}`
    }
  ]);

  const [currentFileId, setCurrentFileId] = useState(1);

  const currentFile =
    files.find(file => file.id === currentFileId);

  const updateCurrentFile = (newCode) => {
    setFiles(files.map(file =>
      file.id === currentFileId
        ? { ...file, content: newCode }
        : file
    ));
  };

  return {
    files,
    currentFile,
    setCurrentFileId,
    updateCurrentFile,
  };
}