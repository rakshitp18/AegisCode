from pathlib import Path

BASE = Path("knowledge_base")

def retrieve_context(language: str):
    docs = []

    folder = BASE / language.lower()

    if folder.exists():
        for file in folder.glob("*.md"):
            docs.append(file.read_text())

    security = BASE / "security"

    for file in security.glob("*.md"):
        docs.append(file.read_text())

    return "\n\n".join(docs)