import re


def analyze_static(language: str, code: str):
    lines = len(code.splitlines())

    todos = len(re.findall(r"TODO|FIXME", code, re.IGNORECASE))

    classes = len(re.findall(r"\bclass\b", code))

    methods = len(
        re.findall(
            r"(public|private|protected).*?\(",
            code,
        )
    )

    print_statements = len(
        re.findall(
            r"System\.out\.println|print\(",
            code,
        )
    )

    return {
        "lines": lines,
        "todos": todos,
        "classes": classes,
        "methods": methods,
        "print_statements": print_statements,
    }