# ArchiteX — Interactive Project Architect

## Implementation Roadmap

### Decisions Locked
| Decision | Value |
|----------|-------|
| Q&A Style | Chat-style, one question at a time |
| Task Hierarchy | AI auto-generates parent + child tasks with checklists |
| Deadline Distribution | AI spreads milestones evenly across user timeline |
| External Sync | Webhook first, Jira/PM tools as configurable future option |

---

## Phase 1: Database Foundation

### 1.1 `create_milestones_table`
- `id` (ULID, PK)
- `project_id` (ULID, FK → projects, cascadeOnDelete)
- `title` (string)
- `description` (text, nullable)
- `goal` (text, nullable)
- `deliverables` (JSON, nullable) — array of strings like `['Wireframes', 'API Specs']`
- `deadline` (date, nullable)
- `status` (enum: `pending`, `in_progress`, `completed`, default: `pending`)
- `sort_order` (integer, default: 0)
- timestamps

### 1.2 `update_tasks_table_add_hierarchy`
- `parent_id` → nullable, self-referencing FK to `tasks.id`
- `milestone_id` → nullable, FK to `milestones.id`
- `stack` → enum: `frontend`, `backend`, `mobile`, `design`, `devops`, `qa`, `other`
- `checklist_items` → JSON, default `[]`
- `completed_checklist` → JSON, default `[]`

### 1.3 `update_team_members_table_add_stack`
- `stack` → enum (same values), default inferred from `role` during Coder71 sync
- `current_workload_hours` → integer, default `0`

### 1.4 `update_projects_table_add_planning_phase`
- `planning_phase` → enum:
  - `idea_submitted`
  - `clarifying_questions`
  - `questions_answered`
  - `plan_generating`
  - `plan_ready`
  - `milestones_ready`
  - `tasks_ready`
  - `team_assigned`
  - `active`

### 1.5 `create_integrations_table`
- `id` (ULID, PK)
- `project_id` (ULID, FK → projects, cascadeOnDelete)
- `type` (enum: `webhook`, `jira`)
- `config` (JSON) — `{ url, headers, events }`
- `last_sync_at` (timestamp, nullable)
- `status` (enum: `active`, `error`, default: `active`)
- timestamps

### 1.6 `create_task_assignment_logs_table`
- `id` (ULID, PK)
- `task_id` (ULID, FK → tasks, cascadeOnDelete)
- `from_member_id` (nullable, FK → team_members)
- `to_member_id` (FK → team_members)
- `reason` (string, nullable)
- `changed_by` (FK → users)
- timestamps

---

## Phase 2: AI Pipeline Modifications

### 2.1 New: `ClarifyingQuestionsAgent`
- Uses `laravel/ai` structured output
- Provider: Gemini/xAI/Groq (same as existing agents)
- Schema output: `questions[]` (each with `question`, `reason`, `category`)
- Also returns `suggested_timeline` string
- Stored in `projects.clarifying_questions` JSON

### 2.2 New Job: `GenerateQuestionsJob`
- Dispatched after project creation with `planning_phase: idea_submitted`
- Calls `ClarifyingQuestionsAgent` with brief
- Updates phase to `clarifying_questions`

### 2.3 Modify: `BlueprintAgent`
- Enhance `milestones` schema:
  - Add `goal` (string)
  - Add `deliverables` (array of strings)
  - Add `deadline` (date — AI calculates based on `total_timeline` context)
- Pass user-provided timeline to instructions: "Distribute milestone deadlines across {$timeline}"

### 2.4 Modify: `TaskGeneratorAgent`
- Change from pipe-delimited strings to structured JSON
- New output schema:
  - `task_groups[]`:
    - `milestone_index` (integer)
    - `parent_task`: `{ title, description, stack, estimated_hours }`
    - `child_tasks[]`: `{ title, description, stack, estimated_hours, checklist_items[] }`

### 2.5 Modify: `GenerateTasks` Workflow Step
- Create `milestones` records from blueprint data first
- Create parent tasks (linking to `milestone_id`)
- Create child tasks (linking to `parent_id`)
- Set `stack` on each task

### 2.6 Modify: `GenerateProjectPlanJob`
- Make resumable: skip steps where data already exists for target version
- If `planning_phase === 'questions_answered'`, start from Blueprint
- If `planning_phase === 'plan_ready'`, start from Tasks

---

## Phase 3: Backend Controllers & Services

### 3.1 New: `PlanningWizardController`
| Method | Route | Action |
|--------|-------|--------|
| `submitIdea()` | `POST /projects/wizard/idea` | Create project, dispatch `GenerateQuestionsJob` |
| `submitAnswers()` | `POST /projects/{project}/wizard/answers` | Save answers, update phase, dispatch plan generation |
| `getStatus()` | `GET /projects/{project}/wizard/status` | Return current phase + data |
| `approveMilestones()` | `POST /projects/{project}/wizard/approve-milestones` | Set `milestones_ready`, trigger tasks |
| `approveTasks()` | `POST /projects/{project}/wizard/approve-tasks` | Set `tasks_ready` |
| `assignTeam()` | `POST /projects/{project}/wizard/assign-team` | Auto-assign, set `active` |

### 3.2 Enhance: `ResourceAllocationService`
- `calculateWorkload($memberId)` — returns `used`, `total`, `percentage`, `is_overallocated`
- `reassignTask($task, $newMemberId, $reason)` — with audit logging
- `getTeamWorkload()` — collection for all active members
- Update `current_workload_hours` on members after assignments

### 3.3 Update: `TaskController` (currently empty)
- `updateStatus()` — update task status, auto-complete parent if all children done
- `updateChecklist()` — toggle checklist items, auto-mark task done if all complete
- `assign()` — reassign with workload recalculation + audit log
- `update()` — edit title, description, checklist_items

### 3.4 New: `MilestoneController`
- `update()` — edit title, description, deadline, goal, deliverables
- `destroy()` — remove milestone (cascade to tasks)

### 3.5 New: `TeamWorkloadController`
- `index()` — return all active members with workload data

### 3.6 New: `IntegrationController`
- `store()` — create webhook/jira config per project
- `sync()` — push tasks to webhook or Jira
- `test()` — send test payload

### 3.7 Update: `ProjectExportController`
- PDF: Add milestones section, task hierarchy (indented), checklist items
- Excel: New sheets — "Milestones", "Task Hierarchy", "Team Workload"

---

## Phase 4: Frontend — Step-by-Step Wizard

### 4.1 Route Map
```
/projects/create          → Projects/Create.tsx       (Step 1: Submit Idea)
/projects/{id}/questions  → Projects/Questions.tsx    (Step 2: Chat Q&A)
/projects/{id}/milestones → Projects/Milestones.tsx   (Step 3: Review Milestones)
/projects/{id}/tasks      → Projects/Tasks.tsx        (Step 4: Review Task Tree)
/projects/{id}/team       → Projects/Team.tsx         (Step 5: Assign Team)
/projects/{id}            → Projects/Show.tsx         (Active project view)
```

### 4.2 `Projects/Create.tsx`
- Textarea for idea/brief
- Optional fields: client_name, budget, timeline, target_audience, notes
- Submit → POST `/projects/wizard/idea`
- Loading state: "AI analyzing your idea..."
- Auto-redirect to `/questions` when questions ready

### 4.3 `Projects/Questions.tsx`
- Chat-style UI (like OpenCode planning)
- Poll `/projects/{id}/wizard/status`
- Shows one question at a time
- User types answer → submit → next question
- Progress: "Question 2 of 5"
- "Skip remaining" button
- After last question → "Generating plan..." → redirect to `/milestones`

### 4.4 `Projects/Milestones.tsx`
- Cards per milestone
- Inline editable: title, description, goal, deadline (date picker)
- Deliverables as tag list (add/remove)
- "Approve & Generate Tasks" → POST approve-milestones
- Loading while AI generates tasks
- Redirect to `/tasks` when ready

### 4.5 `Projects/Tasks.tsx`
- Tree view (recursive component):
  ```
  📁 Milestone 1: Authentication
    └── 🔲 Authentication System (Parent - 40h, backend)
        ├── ✅ Registration System (12h)
        │   └── ☐ Email verification
        │   └── ☐ OTP via SMS
        │   └── ☐ Social login
        ├── ☐ Login System (8h)
        └── ☐ Password Reset (4h)
  ```
- Edit title inline
- Add/remove checklist items
- Edit stack assignment
- "Approve & Assign Team" → redirect to `/team`

### 4.6 `Projects/Team.tsx`
- Left: Team members grouped by stack, each with `WorkloadBar`
- Right: Unassigned tasks grouped by stack
- "Auto-Assign All" button
- Manual: dropdown on each task to pick member (shows workload in tooltip)
- Over-allocation: red badge + warning banner
- "Finalize Plan" → project active, redirect to Show

### 4.7 Update: `Projects/Show.tsx`
- If `planning_phase !== 'active'`, redirect to wizard step
- New "Milestones" tab with progress bars
- Tasks tab: show checklist as checkboxes
- Inline reassignment dropdown
- "Sync to External Tool" button

### 4.8 Update: `Dashboard.tsx`
- Remove large inline form
- "New Project" → `/projects/create`
- Keep project grid

---

## Phase 5: External Sync (Webhook First)

### 5.1 Webhook Config
- Per project: `url`, `headers` (key-value), `events` (checkboxes)
- Test button: sends sample payload
- Sync button: sends full project snapshot

### 5.2 Payload Structure
```json
{
  "event": "project.sync",
  "timestamp": "2026-05-21T12:00:00Z",
  "project": { "id", "title", "status" },
  "milestones": [ { "title", "deadline", "status", "progress_percent" } ],
  "tasks": [ { "title", "stack", "status", "assignee", "estimated_hours", "checklist" } ],
  "team": [ { "name", "stack", "workload": { "used", "total", "percentage" } } ]
}
```

### 5.3 Jira Placeholder
- `IntegrationController` accepts `type: 'jira'`
- UI shows "Jira integration coming soon" or config form
- `JiraSyncService` with method stubs for future

---

## Phase 6: Workload UI Components

### 6.1 `WorkloadBar.tsx`
- Props: `used`, `total`
- Color coding: `<70%` green, `70-90%` yellow, `>90%` red
- Shows `used/total` + percentage

### 6.2 `TaskTree.tsx`
- Recursive tree component
- Expand/collapse milestones and parent tasks
- Editable inline where appropriate

### 6.3 `ChecklistEditor.tsx`
- Add/remove/edit checklist items
- Track completed count

---

## Phase 7: Testing

| Test File | Coverage |
|-----------|----------|
| `tests/Feature/WizardFlowTest.php` | End-to-end wizard: create → questions → milestones → tasks → team → active |
| `tests/Unit/ResourceAllocationServiceTest.php` | Stack matching, workload calc, reassignment, over-allocation |
| `tests/Feature/TaskHierarchyTest.php` | Parent/child relations, checklist completion, auto-status |
| `tests/Feature/IntegrationTest.php` | Webhook payload, sync endpoint |
| `tests/Feature/ExportTest.php` | PDF/Excel contain milestones and hierarchy |

---

## Phase 8: Polish & QA

- Run `vendor/bin/pint` on all modified PHP files
- Test all wizard flows manually
- Verify workload calculation accuracy
- Check edge cases: empty team, no timeline provided, skipped questions

---

## Execution Order

| Phase | Est. Effort |
|-------|-------------|
| 1. Database Migrations | 1 session |
| 2. AI Pipeline | 2 sessions |
| 3. Backend Controllers & Services | 2 sessions |
| 4. Frontend Wizard | 3 sessions |
| 5. Integrations | 1 session |
| 6. Workload UI | 1 session |
| 7. Testing | 1 session |
| 8. Polish & QA | 1 session |

**Total: ~12 sessions**

---

## Risk Flags

1. **Show.tsx is 1300+ lines** — Create separate wizard pages, minimize additions to Show.tsx
2. **AI API costs** — 5 API calls per project (Questions + Blueprint + Estimate + Proposal + Tasks + Master Plan = 6 calls)
3. **SQLite in production** — `DB_CONNECTION=sqlite` in `.env`. May need MySQL/PostgreSQL for concurrent production use
4. **Zero existing tests** — Write tests as we go to prevent regressions
