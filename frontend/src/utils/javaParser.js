import { stripCommentsAndStrings } from "./regexScanner";

export function parseJavaMetrics(code) {
  if (!code) {
    return {
      classes: 0,
      abstractClasses: 0,
      interfaces: 0,
      enums: 0,
      records: 0,
      packages: 0,
      imports: 0,
      constructors: 0,
      methods: 0,
      fields: 0,
      staticMethods: 0
    };
  }

  const strippedCode = stripCommentsAndStrings(code);

  const classNames = [];
  let match;
  const classRegex = /\bclass\s+(\w+)/g;
  while ((match = classRegex.exec(strippedCode)) !== null) {
    classNames.push(match[1]);
  }

  const abstractClasses = (strippedCode.match(/\babstract\s+class\s+\w+/g) || []).length;
  const interfaces = (strippedCode.match(/\binterface\s+\w+/g) || []).length;
  const enums = (strippedCode.match(/\benum\s+\w+/g) || []).length;
  const records = (strippedCode.match(/\brecord\s+\w+/g) || []).length;
  
  const packages = (strippedCode.match(/\bpackage\s+[\w.]+;/g) || []).length;
  const imports = (strippedCode.match(/\bimport\s+(?:static\s+)?[\w.]+(?:\.\*)?;/g) || []).length;

  // Constructors
  let constructors = 0;
  classNames.forEach(className => {
    const constructorRegex = new RegExp(`\\b${className}\\s*\\([^)]*\\)\\s*(?:throws\\s+[\\w.,\\s]+)?\\s*\\{`, "g");
    const matches = strippedCode.match(constructorRegex);
    if (matches) constructors += matches.length;
  });

  // Static Methods
  const staticMethods = (strippedCode.match(/\bstatic\s+[\w<>[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\\s+[\\w.,\\s]+)?\s*\{/g) || []).length;

  // Total Methods (Filtering out constructor names)
  const methodRegex = /\b(?:public|protected|private|static|final|synchronized|abstract|default)\s+[\w<>[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\\s+[\w.,\s]+)?\s*\{/g;
  let totalMethods = 0;
  while ((match = methodRegex.exec(strippedCode)) !== null) {
    const methodName = match[1];
    if (!classNames.includes(methodName)) {
      totalMethods++;
    }
  }

  // Fields
  const fieldRegex = /\b(private|protected|public)\s+(?:static\s+)?(?:final\s+)?[\w<>[\]]+\s+(\w+)\s*(?:=.*?)?;/g;
  const fields = (strippedCode.match(fieldRegex) || []).length;

  return {
    classes: classNames.length,
    abstractClasses,
    interfaces,
    enums,
    records,
    packages,
    imports,
    constructors,
    methods: totalMethods,
    fields,
    staticMethods
  };
}
