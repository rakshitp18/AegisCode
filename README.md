# AegisCode 🛡️

AegisCode is an AI-powered static code analysis and architectural intelligence platform. It combines native AST compiler parsing, cloud-native GitHub Zipball streaming, and Groq-powered AI completion pipelines to perform deep security auditing, code quality diagnostics, and interactive project-level code chat.

---

## 📋 Table of Contents
1. [Key Capabilities](#-key-capabilities)
2. [Architecture](#-architecture)
3. [Technology Stack](#-technology-stack)
4. [GitHub OAuth & Cloud Importer](#-github-oauth--cloud-importer)
5. [Installation & Setup](#-installation--setup)
6. [Environment Variables](#-environment-variables)
7. [API Endpoints](#-api-endpoints)
8. [License](#-license)

---

## ✨ Key Capabilities

- **⚡ Fast GitHub Zipball Importer**: Streams repository archives directly over HTTP via `https://codeload.github.com` in **1–2 seconds**, operating 100% in-memory with zero local `git` CLI binary dependencies (tailored for Render cloud deployments).
- **🔑 GitHub OAuth 2.0 Integration**: Authenticate with GitHub to grant **5,000 requests/hour** API rate limits and private repository access.
- **🔍 Deep AST & Static Code Auditing**: Computes cyclomatic complexity, lines of code (LOC), language breakdowns, and static code quality diagnostics using JavaParser AST.
- **🤖 Groq-Powered AI Code Analysis**: Surfaces architectural patterns, security vulnerabilities, performance bottlenecks, and side-by-side code refactoring suggestions.
- **💬 Project Code Chat**: Converse with an AI assistant contextualized with your project's file structure and code files.
- **📊 Developer Dashboard & Workspaces**: Create, manage, and persist multiple projects with isolated file trees and historical audit records in PostgreSQL.

---

## 🏗️ Architecture

```
┌─────────────────┐        JSON API        ┌────────────────────┐
│  React 19 / Vite │ <───────────────────> │ Spring Boot 3      │
│  (Frontend IDE) │       over HTTP       │ (Java 17 Backend)  │
└─────────────────┘                        └─────────┬──────────┘
                                                     │
                                   ┌─────────────────┼─────────────────┐
                                   ▼                 ▼                 ▼
                            ┌─────────────┐   ┌─────────────┐   ┌────────────┐
                            │ PostgreSQL  │   │  Groq LLM   │   │ GitHub API │
                            │ (Database)  │   │ (Llama 3.3) │   │ (OAuth/Zip)│
                            └─────────────┘   └─────────────┘   └────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** (Single-Page Application IDE)
- **Vite** (Build toolchain)
- **Tailwind CSS** (Responsive UI & styling)
- **React Router 6** (Application routing)
- **Axios** (HTTP Client with JWT interceptors)

### Backend
- **Java 17 & Spring Boot 3**
- **Spring Security** (Stateless JWT authentication filter)
- **JavaParser** (Native Java AST compiler parsing)
- **Spring Data JPA & Hibernate** (PostgreSQL ORM mapping)
- **Maven** (Dependency management)

### Database & Cloud
- **PostgreSQL** (Relational storage for users, projects, and analyses)

---

## 🚀 GitHub OAuth & Cloud Importer

AegisCode features a stream-based repository importer engineered for cloud environments (like Render):

1. **HTTP Archive Streaming**: Instead of executing OS `git clone` sub-processes, AegisCode fetches the repository zip archive over HTTP (`https://codeload.github.com/{owner}/{repo}/zip/refs/heads/{branch}`) and extracts entries using Java's `ZipInputStream`.
2. **OAuth 2.0 Rate Limit Boost**: Linking a GitHub account attaches `Authorization: Bearer <token>` headers to repository downloads, boosting rate limits from 60 req/hr to **5,000 req/hr**.

---

## 🚀 Installation & Setup

### Prerequisites
- Java 17+ installed
- Node.js 18+ installed
- PostgreSQL database running
- Groq API Key ([Console Groq](https://console.groq.com/))

### 1. Database Initialization
Create a PostgreSQL database named `Aegiscode`:
```sql
CREATE DATABASE Aegiscode;
```

### 2. Backend Configuration & Launch
Set database credentials and API keys in `backend/src/main/resources/application.properties` (or set environment variables):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/Aegiscode
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

groq.api.key=YOUR_GROQ_API_KEY
github.client.id=YOUR_GITHUB_CLIENT_ID
github.client.secret=YOUR_GITHUB_CLIENT_SECRET
github.redirect.uri=http://localhost:5173/auth/github/callback
```

Run the backend server:
```bash
cd backend
./mvnw spring-boot:run
```
The backend starts listening at `http://localhost:8000`.

### 3. Frontend Launch
Install dependencies and launch the dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

| Variable | Purpose |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `GROQ_API_KEY` | Groq AI completion API key |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_REDIRECT_URI` | OAuth callback URI (`http://localhost:5173/auth/github/callback`) |
| `JWT_SECRET` | Secret key for signing JWT tokens |

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate user and receive JWT token

### GitHub OAuth
- `GET /api/auth/github/login-url` — Generate GitHub OAuth authorization URL
- `POST /api/auth/github/callback` — Exchange OAuth code for access token & JWT
- `GET /api/auth/github/status` — Get GitHub account connection status

### Workspace Projects
- `GET /api/projects` — Fetch user's projects
- `POST /api/projects` — Create a new project workspace
- `DELETE /api/projects/{id}` — Delete a project

### Analysis & AI Engine
- `POST /analyze` — Single-file AI code analysis
- `POST /analyze-project` — Full multi-file project AI analysis
- `POST /analyze-project-static` — Fast AST static analysis
- `POST /chat` — Context-aware project code chat
- `POST /github-import` — Zipball repository stream importer
- `GET /api/projects/{projectId}/analyses` — Fetch project analysis history
- `DELETE /api/analyses/{id}` — Delete an analysis record

---

## 📄 License
This project is licensed under the MIT License.
