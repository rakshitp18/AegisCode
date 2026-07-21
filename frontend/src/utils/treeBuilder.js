export function buildFileTree(files) {
  const root = { name: "root", isFolder: true, children: {} };

  files.forEach((file) => {
    // Standardize any backslashes (e.g. from Windows paths) to forward slashes
    const path = (file.path || file.name).replace(/\\/g, "/");
    const parts = path.split("/");

    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isFolder: true,
          path: parts.slice(0, i + 1).join("/"),
          children: {},
        };
      }
      current = current.children[part];
    }

    const fileName = parts[parts.length - 1];
    if (!current.children[fileName]) {
      current.children[fileName] = {
        ...file,
        name: fileName,
        isFolder: false,
      };
    }
  });

  return root;
}
