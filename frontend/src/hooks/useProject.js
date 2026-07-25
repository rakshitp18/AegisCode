import { useState, useEffect } from "react";
import { detectLanguage } from "../utils/languageDetector";

export default function useProject(projectId) {
  const [projectName, setProjectName] = useState("No Folder Open");
  const [files, setFiles] = useState([]);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [gitMetadata, setGitMetadata] = useState(null);

  // Sync state loading from localStorage when projectId changes
  useEffect(() => {
    if (!projectId) {
      setFiles([]);
      setProjectName("No Folder Open");
      setGitMetadata(null);
      setCurrentFileId(null);
      return;
    }

    const savedFiles = localStorage.getItem(`aegis_project_files_${projectId}`);
    const savedMeta = localStorage.getItem(`aegis_project_meta_${projectId}`);
    const savedActive = localStorage.getItem(`aegis_active_file_${projectId}`);

    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        const normalizedFiles = parsedFiles.map((file, idx) => ({
          ...file,
          id: file.id || file.path || file.name || `file-${idx}`,
          path: file.path || file.name || `file-${idx}`,
        }));
        setFiles(normalizedFiles);

        if (savedMeta) {
          const parsedMeta = JSON.parse(savedMeta);
          setProjectName(parsedMeta.name || "No Folder Open");
          setGitMetadata(parsedMeta.gitMetadata || null);
        }

        if (savedActive && normalizedFiles.some((f) => f.id === savedActive || f.path === savedActive)) {
          const matched = normalizedFiles.find((f) => f.id === savedActive || f.path === savedActive);
          setCurrentFileId(matched.id);
        } else {
          const firstFile = normalizedFiles.find((f) => !f.isFolder);
          setCurrentFileId(firstFile ? firstFile.id : null);
        }
        return;
      } catch (e) {
        console.error("Failed to load project state from localStorage", e);
      }
    }

    setFiles([]);
    setProjectName(projectId ? `Project #${projectId}` : "No Folder Open");
    setGitMetadata(null);
    setCurrentFileId(null);
  }, [projectId]);

  const saveState = (updatedFiles, updatedName = projectName, updatedGit = gitMetadata) => {
    if (!projectId) return;
    if (Array.isArray(updatedFiles) && updatedFiles.length === 0) {
      const existing = localStorage.getItem(`aegis_project_files_${projectId}`);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return;
          }
        } catch (e) {}
      }
    }
    localStorage.setItem(`aegis_project_files_${projectId}`, JSON.stringify(updatedFiles));
    localStorage.setItem(
      `aegis_project_meta_${projectId}`,
      JSON.stringify({ name: updatedName, gitMetadata: updatedGit })
    );
  };

  const handleSelectFile = (id) => {
    setCurrentFileId(id);
    if (projectId) {
      localStorage.setItem(`aegis_active_file_${projectId}`, id);
    }
  };

  const currentFile = files.find((file) => file.id === currentFileId || file.path === currentFileId);

  const updateCurrentFile = (newContent) => {
    setFiles((prevFiles) => {
      const updated = prevFiles.map((file) =>
        file.id === currentFileId ? { ...file, content: newContent } : file
      );
      saveState(updated);
      return updated;
    });
  };

  const updateCurrentFileLanguage = (newLanguage) => {
    setFiles((prevFiles) => {
      const updated = prevFiles.map((file) =>
        file.id === currentFileId ? { ...file, language: newLanguage } : file
      );
      saveState(updated);
      return updated;
    });
  };

  const addNewFile = (filePath, content = "") => {
    const name = filePath.split("/").pop();
    const language = detectLanguage(name);

    const newFile = {
      id: "file-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      name,
      path: filePath,
      language,
      content,
      isFolder: false,
    };

    setFiles((prevFiles) => {
      const filtered = prevFiles.filter((f) => f.path !== filePath);
      const updated = [...filtered, newFile];
      saveState(updated);
      return updated;
    });

    handleSelectFile(newFile.id);
  };

  const addNewFolder = (folderPath) => {
    const name = folderPath.split("/").pop();
    const newFolder = {
      id: "folder-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      name,
      path: folderPath,
      isFolder: true,
    };

    setFiles((prevFiles) => {
      const filtered = prevFiles.filter((f) => f.path !== folderPath);
      const updated = [...filtered, newFolder];
      saveState(updated);
      return updated;
    });
  };

  const renameItem = (oldPath, newPath) => {
    setFiles((prevFiles) => {
      const updated = prevFiles.map((item) => {
        if (item.path === oldPath) {
          const name = newPath.split("/").pop();
          return {
            ...item,
            name,
            path: newPath,
            language: item.isFolder ? item.language : detectLanguage(name),
          };
        }
        if (item.path.startsWith(oldPath + "/")) {
          const updatedPath = item.path.replace(oldPath + "/", newPath + "/");
          return {
            ...item,
            path: updatedPath,
          };
        }
        return item;
      });
      saveState(updated);
      return updated;
    });
  };

  const deleteItem = (itemPath) => {
    setFiles((prevFiles) => {
      const deletedFiles = prevFiles.filter(
        (item) => item.path === itemPath || item.path.startsWith(itemPath + "/")
      );
      const remaining = prevFiles.filter(
        (item) => item.path !== itemPath && !item.path.startsWith(itemPath + "/")
      );

      if (deletedFiles.some((f) => f.id === currentFileId)) {
        const remainingFilesOnly = remaining.filter((f) => !f.isFolder);
        if (remainingFilesOnly.length > 0) {
          handleSelectFile(remainingFilesOnly[0].id);
        } else {
          setCurrentFileId(null);
          if (projectId) {
            localStorage.removeItem(`aegis_active_file_${projectId}`);
          }
        }
      }

      saveState(remaining);
      return remaining;
    });
  };

  const moveItem = (itemPath, targetFolderPath) => {
    const name = itemPath.split("/").pop();
    const newPath = targetFolderPath ? `${targetFolderPath}/${name}` : name;

    if (targetFolderPath === itemPath || targetFolderPath.startsWith(itemPath + "/")) {
      return;
    }

    setFiles((prevFiles) => {
      if (prevFiles.some((f) => f.path === newPath)) {
        return prevFiles;
      }

      const updated = prevFiles.map((item) => {
        if (item.path === itemPath) {
          return { ...item, path: newPath };
        }
        if (item.path.startsWith(itemPath + "/")) {
          const updatedPath = item.path.replace(itemPath + "/", newPath + "/");
          return { ...item, path: updatedPath };
        }
        return item;
      });
      saveState(updated);
      return updated;
    });
  };

  const importProject = (name, newFiles = [], metadata = null) => {
    const normalizedFiles = (newFiles || []).map((file, idx) => ({
      ...file,
      id: file.id || file.path || file.name || `file-${idx}`,
      path: file.path || file.name || `file-${idx}`,
    }));

    setProjectName(name);
    setFiles(normalizedFiles);
    setGitMetadata(metadata);
    saveState(normalizedFiles, name, metadata);
    if (normalizedFiles.length > 0) {
      const filesOnly = normalizedFiles.filter((f) => !f.isFolder);
      if (filesOnly.length > 0) {
        handleSelectFile(filesOnly[0].id);
      }
    }
  };

  const getProjectStats = () => {
    const folders = new Set();
    const languages = new Set();

    files.forEach((file) => {
      if (file.language) {
        languages.add(file.language);
      }

      const path = (file.path || file.name).replace(/\\/g, "/");
      const parts = path.split("/");
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        folders.add(currentPath);
      }
    });

    return {
      totalFiles: files.filter((f) => !f.isFolder).length,
      totalFolders: folders.size,
      languages: Array.from(languages),
    };
  };

  return {
    projectName,
    setProjectName,
    files,
    currentFile,
    currentFileId,
    setCurrentFileId: handleSelectFile,
    updateCurrentFile,
    updateCurrentFileLanguage,
    addNewFile,
    addNewFolder,
    renameItem,
    deleteItem,
    moveItem,
    importProject,
    getProjectStats,
    gitMetadata,
  };
}