# 🏗️ ArchiteX

**The AI Orchestration Engine for Software Engineering & Project Leadership.**

ArchiteX is a next-generation "Force Multiplier" for Project Leads and Tech Architects. It transforms a high-level project brief into a comprehensive, engineer-ready execution plan in seconds, maintaining a **persistent AI memory** for every project.

---

## 🌟 The Core Vision
In traditional workflows, moving from a client brief to a detailed execution plan takes days of manual cognitive load. **ArchiteX** automates this "Planning-to-Execution" gap, allowing Project Leads to focus on high-level strategy rather than repetitive documentation.

- **Stateless ❌:** Standard AI chats forget context once you close the window.
- **ArchiteX ✅:** Every project has its own dedicated "Neural Vault." Any requirement change updates the *entire* plan—milestones, tasks, and estimates—coherently.

---

## 🛠️ The Multi-Agent Orchestration
ArchiteX employs a team of specialized AI agents working in background synchronicity:

1.  **The Architect & Lead**: Generates technical blueprints, strategy tradeoffs, and **Mermaid.js** diagrams (HLD/LLD/ERD). It extracts measurable **Milestones** directly from the requirements.
2.  **The Estimator**: Calculates realistic hours and team composition based on a real team roster. It flags capacity risks against deadlines.
3.  **The Scrum Master**: Breaks down milestones into granular **Developer Tasks**, assigning them automatically based on the team's specific skills (React, Go, Devops, etc.).
4.  **The Technical Lead**: Drafts professional status briefings for management (MD) and client-ready proposals, highlighting **Technical Challenges** and mitigation strategies.

---

## 🚀 Key Features
- **✨ Persistent Project Memory**: The AI remembers every previous revision, allowing for incremental updates (e.g., "Add Stripe integration" updates only the relevant modules).
- **📊 Automated Milestones**: Strategy is broken down into measurable delivery blocks.
- **✅ Task-to-Milestone Pinning**: Every developer task is linked to a milestone for transparent progress tracking.
- **⚡ Background Orchestration**: Large-scale plans are generated via Laravel background jobs to ensure zero HTTP timeouts.
- **🛡️ Technical Challenge Mapping**: Proactively identifies risks (API rate limits, security hurdles) for client communication.
- **💻 Premium Cyberpunk UI**: A high-fidelity, interactive dashboard built with React and Inertia.js.

---

## ⚙️ Tech Stack
- **Framework**: [Laravel 12](https://laravel.com)
- **Frontend**: [React](https://reactjs.org) + [Inertia.js](https://inertiajs.com)
- **AI Core**: [Laravel AI SDK](https://laravel.com/docs/12.x/ai-sdk)
- **Model**: Google Gemini 1.5 Flash (via Gemini API)
- **Styling**: Vanilla CSS / Tailwind (Premium Dark Mode)
- **Visuals**: Mermaid.js for architectural diagrams

---

## 🛠️ Getting Started

### Prerequisites
- PHP 8.2+
- Node.js & NPM
- Laragon / Valet (Local Server)
- **Gemini API Key** (Set in `.env`)

### Installation
1. `composer install`
2. `npm install && npm run dev`
3. `php artisan migrate --seed`
4. `php artisan queue:work` (Required for AI background job processing)

---

## 🎭 Presentation Mode
Access the `ArchiteX_Presentation_Prompt.md` in the root directory to generate a professional PPT deck for stakeholders and management using AI power.

---

Developed with ❤️ by the **ArchiteX Team**. 🦾🚀
