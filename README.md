# AegisCode 🛡️

AegisCode is an advanced, enterprise-grade AI-Powered Static Code Analysis Platform. It parses Java source files using a native Abstract Syntax Tree (AST) compiler engine to calculate structural metrics (LOC, complexity, class coupling dependencies) and orchestrates LLM completion pipelines to surface deep architectural patterns, potential security flaws, and side-by-side refactoring improvements.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Solution](#-solution)
4. [Architecture](#-architecture)
5. [Features](#-features)
6. [Technology Stack](#-technology-stack)
7. [Folder Structure](#-folder-structure)
8. [Installation & Setup](#-installation--setup)
9. [Environment Variables](#-environment-variables)
10. [API Documentation](#-api-documentation)
11. [Future Scope](#-future-scope)
12. [License](#-license)

---

## 🔍 Project Overview

AegisCode bridges the gap between traditional compiler-level syntactic linters and high-level artificial intelligence tools. It parses codebases using JavaParser to extract abstract AST node configurations, visualizes class coupling and code complexity, and utilizes Groq-based Llama-3-70B model endpoints to generate custom refactoring advice and architectural suggestions.

---

## ⚠️ Problem Statement

Modern software development teams face two distinct challenges when performing code reviews:
1. **Shallow Automated Analysis**: Traditional static analysis tools (like SonarQube or Checkstyle) point out syntax formatting style or simple null-pointer risks, but fail to detect architectural anti-patterns, duplicated business logic across class boundaries, or microservice boundary leaks.
2. **Context-Blind AI Assisting**: General-purpose LLM interfaces operate on single-file contexts, missing project-level structures, class coupling metrics, and database-backed audit histories.

---

## 💡 Solution

AegisCode provides a hybrid, compiler-informed AI auditing workflow:
- **Compiler Front-End**: Parses Java source files into real compiler-grade ASTs using JavaParser, computing precise cyclomatic complexity, coupling, and metric ratios locally.
- **Context-Engineered AI Prompting**: Enriches LLM query prompts with the generated AST metrics, structure maps, and class interactions, allowing the AI to output highly contextual code optimizations.
- **Audit Logging & Analytics**: Stores audit runs into a relational PostgreSQL database, tracking code health trends, language distributions, and metrics over time in a premium interactive dashboard.

---

## 🏗️ Architecture

AegisCode uses a decoupled client-server architecture:

```
┌─────────────────┐       JSON API       ┌────────────────────┐
│  React Browser  │ <──────────────────> │ Spring Boot Server │
│ (Vite Frontend) │      over HTTP       │  (Java Backend)    │
└─────────────────┘                      └─────────┬──────────┘
                                                   │   JPA / JDBC
                                                   ├──────────────┐
                                                   ▼              ▼
                                            ┌────────────┐  ┌───────────┐
                                            │ Groq Llama │  │ PostgreSQ │
                                            │  (LLM API) │  │ (Database │
                                            └────────────┘  └───────────┘
```

For a deep-dive on design patterns, sequence flows, and entity relations, see [architecture_documentation.md](./reports/architecture_documentation.md).

---

## ✨ Features

- **📂 Project Workspaces**: Support for multiple isolated developer projects.
- **📥 Git Repository Auto-Import**: Clones remote GitHub repositories directly into temporary local workspaces.
- **📄 AST Codebase Metrics**: Renders file-tree layouts, computes Lines of Code (LOC), directory counts, and constructs class coupling maps.
- **🕒 Interactive Analysis History**: View historical file analysis reports, filter audits by language or complexity, and delete records cleanly.
- **📈 Analytics Dashboard**: Visualizes language usage donuts, complexity bars, and analysis counts trends using custom lightweight SVGs.
- **⚙️ Side-by-Side AI Refactoring**: Suggests code refactoring based on target intents (readability, final variables, concurrency locks) with side-by-side comparison panels.
- **💬 Project Chat**: Converse with the AI assistant directly informed by the file tree, active class structure, and code metrics.

---

## 🛠️ Technology Stack

### Frontend
- **React 19** (Single-Page Application interface)
- **Vite** (Build toolchain)
- **Tailwind CSS** (Styling & layout)
- **React Router 6** (Stateless routing)

### Backend
- **Java 17 & Spring Boot 3** (REST API)
- **Spring Security & Spring JWT** (Stateless JWT token filter auth)
- **JavaParser** (Native Java AST compiler parsing)
- **Spring Data JPA** (PostgreSQL ORM mapping)
- **JUnit 5 & Mockito** (Unit & Network interception testing)

### Database & Deployment
- **PostgreSQL** (Relational Database)
- **Docker & Docker Compose** (Containerization orchestration)

---

## 📂 Folder Structure

```
AegisCode/
├── backend/
│   ├── src/
│   │   ├── main/java/com/aegiscode/backend/
│   │   │   ├── config/          # Spring Security, CORS configuration
│   │   │   ├── controller/      # Auth, Projects, Analytics REST entrypoints
│   │   │   ├── dto/             # Request & Response serialized payloads
│   │   │   ├── entity/          # JPA Models (User, Project, Analysis)
│   │   │   ├── exception/       # ControllerAdvice error handlers
│   │   │   ├── repository/      # JPA data layers
│   │   │   ├── security/        # JWT Filter, User Details Provider
│   │   │   └── service/         # AST Parsing, LLM Orchestration logic
│   │   └── test/java/           # JUnit Service & Mockito tests
│   └── pom.xml                  # Maven Configuration
└── frontend/
    ├── src/
    │   ├── api/                 # Axios clients mappings
    │   ├── components/          # Reusable inputs, charts, protected routes
    │   ├── contexts/            # Global state Providers
    │   ├── pages/               # Workspace, Login, Register panels
    │   └── App.jsx              # Router routing
    ├── package.json             # NPM package scripts
    └── vite.config.js           # Vite server definitions
```

---

## 🚀 Installation & Setup

### Prerequisites
- JDK 17+ installed.
- Node.js 18+ installed.
- PostgreSQL database instance running.
- Groq API Key (get it free from [Console Groq](https://console.groq.com/)).

### 1. Database Setup
Create an empty database in PostgreSQL named `Aegiscode`:
```sql
CREATE DATABASE Aegiscode;
```

### 2. Backend Config
Open `backend/src/main/resources/application.properties` and edit the credentials:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/Aegiscode
spring.datasource.username=YOUR_POSTGRES_USERNAME
spring.datasource.password=YOUR_POSTGRES_PASSWORD
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

Run the Spring Boot application:
```bash
cd backend
./mvnw spring-boot:run
```
The server starts listening on `http://localhost:8000`.

### 3. Frontend Config
Navigate to the frontend folder, install dependencies, and run:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

The application can read configurations from standard environment variables:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/Aegiscode` | Database connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | — | Database user password |
| `GROQ_API_KEY` | — | Groq Llama completion access key |
| `JWT_SECRET` | `yourVeryLongSecretKeyForAegisCode2026SuperSecureKey` | JWT signing secret |

---

## 🌐 API Documentation

### Authentication Mappings
- `POST /api/auth/register` — Creates a developer login account.
- `POST /api/auth/login` — Auths credentials and yields a bearer JWT token.

### Workspace Projects
- `GET /api/projects` — Lists current user projects.
- `POST /api/projects` — Creates a new project workspace.

### Analysis & Refactoring
- `POST /api/analyze` — Analyzes a code snippet (requires Bearer Token).
- `POST /api/dashboard/analytics` — Fetches dashboard stats.
- `GET /api/projects/{projectId}/analyses` — Gets project run history.
- `DELETE /api/analyses/{id}` — Deletes an analysis entry.

---

## 🔮 Future Scope
- **Multilingual AST support**: Integrate Tree-Sitter parsing to enable native AST structures for Python, C++, Go, and TypeScript.
- **CI/CD Integration Hooks**: Expose a CLI interface that allows developers to block Github PR merges if complexity triggers exceed bounds.
- **Interactive Dependency Visualizer**: Interactive D3.js nodes representation graphs mapping code coupling directions.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
