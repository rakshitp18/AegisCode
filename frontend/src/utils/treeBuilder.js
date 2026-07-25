export function buildFileTree(files) {
  const root = { name: "root", isFolder: true, path: "", children: {} };

  files.forEach((file) => {
    // Standardize any backslashes (e.g. from Windows paths) to forward slashes
    const path = (file.path || file.name).replace(/\\/g, "/");
    const parts = path.split("/").filter(Boolean);

    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join("/");
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isFolder: true,
          path: currentPath,
          children: {},
        };
      }
      // Ensure it is marked as folder if it was auto-created
      if (!current.children[part].isFolder) {
        current.children[part].isFolder = true;
        current.children[part].children = current.children[part].children || {};
      }
      current = current.children[part];
    }

    if (parts.length > 0) {
      const fileName = parts[parts.length - 1];
      if (file.isFolder) {
        if (!current.children[fileName]) {
          current.children[fileName] = {
            id: file.id,
            name: fileName,
            isFolder: true,
            path: path,
            children: {},
          };
        }
      } else {
        if (!current.children[fileName]) {
          current.children[fileName] = {
            ...file,
            name: fileName,
            isFolder: false,
          };
        }
      }
    }
  });

  return root;
}
