# Magic Draw (ASP.NET + .NET Aspire)

**Magic Draw** is a modern drawing application that combines **manual canvas drawing** with **AI-generated artwork**.

Users can draw freely, manage layers, generate AI images from prompts, insert them as layers, export final images, and participate in community features like comments, likes, contests, and matchmaking challenges.

This repository is built as an **ASP.NET Core** solution orchestrated with **.NET Aspire** (multi-project app host, service defaults, observability, local dev environment).

---

## 1) Project Goals

### Core Goals (MVP)
- **Canvas**: Provide a fast, responsive drawing canvas experience.
- **Layers**: Support layer-based editing (manual strokes + imported images + AI-generated images).
- **AI Draw**: Generate images from text prompts and insert them as layers.
- **Save/Export**: Allow users to save drawings and export final images (PNG/JPG).
- **Access**: Provide basic authentication and profile management.

### Extended Goals (v1/v2)
- **Community**: Comments, likes, profiles, galleries.
- **Competition**: Matchmaking / contests with rankings and admin management.
- **Cloud**: Cloud-ready storage (Azure Blob) and optional Azure DevOps CI/CD.

---

## 2) Architecture Overview

The project uses a microservice-like architecture orchestrated by **.NET Aspire**:

- **`MagicDraw.AppHost`**: Aspire orchestrator.
- **`MagicDraw.ServiceDefaults`**: Aspire defaults, telemetry, service discovery.
- **`MagicDraw.Api`**: Main ASP.NET Core Web API (Auth, Drawings, Layers, Social, Contests).
  - Contains **Application**, **Domain**, and **Infrastructure** layers (Modular Monolith folder structure).
- **`MagicDraw.AIWorker`**: Background worker for AI generation queues and async processing.
- **`MagicDraw.Web`**: Frontend application (Drawing UI).
- **`MagicDraw.Tests`**: Unit and integration tests.

### Data Storage
- **SQL Server**: Relational data (Users, Drawings, Layers, Contests).
- **Azure Blob Storage** (or local emulator): Image assets and exports.
- **Redis** (Optional): Rate limiting, caching, matchmaking queues.

---

## 3) Key Features

### Drawing Model
A "Drawing" project contains:
- **Metadata**: Title, visibility, dimensions.
- **Layers**: 
    - `stroke` (Pencil, Brush, Eraser, Shapes: Rectangle, Circle, Triangle)
    - `palette` (Presets: Red, Dark Blue, Light Blue, Yellow)
    - `image` (Uploaded assets)
    - `ai_image` (AI generated)
    - `text` (Optional)

### AI Draw Workflow
1. User submits a prompt.
2. API creates an `ai_generation` record (`queued`).
3. **AIWorker** picks up the job, generates the image, and updates the record.
4. Frontend polls/receives update and inserts the new `ai_image` layer.

---

## 4) Development Workflow

> **Strict engineering hygiene is enforced.**

### 4.1 Git Rules
- **Commit often**: Every meaningful change must be committed.
- **Branching**:
    - `main` = Stable release
    - `dev` = Active development
    - `feature/*` = Feature specific branches
- **No "Big Bang" commits**: Keep changes small and describable.

### 4.2 Guidelines (Antigravity/AI)
- **Commitment**: AI must commit ALL changes.
- **State**: Update code, documentation, and tracking files (WORKLOG/STATUS) after every task.
- **Structure**: Respect the folder structure; do not create random files.
- **Refactoring**: Do not rewrite large chunks without good reason and strict incremental steps.

### 4.3 Progress Tracking (`WORKLOG.txt`)
We maintain a living log of work. Format:
```text
[YYYY-MM-DD HH:MM] <author>
DONE: ...
CHANGED: ...
DECISIONS: ...
NEXT: ...
BLOCKERS: ...
```

### 4.4 Status Tracking (`STATUS.md`)
Tracks the Roadmap and MVP Checklist. **Must be updated when features are completed.**

---

## 5) Setup & Run

### Prerequisites
- .NET SDK (Latest Stable)
- Docker (for full Aspire orchestration)
- Node.js (for Web Frontend)

### Running with Aspire
```bash
dotnet run --project ./src/MagicDraw.AppHost
```

---

## 6) Contribution Checklists

See [STATUS.md](./STATUS.md) for the active backlog.
