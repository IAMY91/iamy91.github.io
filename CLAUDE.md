# CLAUDE.md – OCM Navigator

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**OCM Navigator** is a single-file, browser-based Organizational Change Management (OCM) tool written in German. It is hosted as a GitHub Pages static site at `iamy91.github.io`.

The entire application lives in one self-contained HTML file (`ocm-navigator-v3.html`). There is no build step, no package manager, and no server-side code.

---

## Repository Structure

```
iamy91.github.io/
├── ocm-navigator-v3.html   # The entire application (~1136 lines)
├── README.md               # German-language setup/hosting instructions
├── start-server.sh         # Mac/Linux local server launcher (Python / npx)
├── start-server.bat        # Windows local server launcher (Python / npx)
└── CLAUDE.md               # This file
```

---

## Technology Stack

| Concern       | Choice                                         |
|---------------|------------------------------------------------|
| UI framework  | React 18.2.0 (loaded from cdnjs CDN)          |
| Transpilation | Babel Standalone 7.23.9 (in-browser, CDN)     |
| Styling       | Inline styles only – no CSS framework         |
| Persistence   | `localStorage` (key: `"ocm-v3"`)             |
| Fonts         | Google Fonts – Source Sans 3                  |
| Bundler       | None – no build step required                 |
| Package mgr   | None – no `package.json`                      |

All dependencies are loaded from CDN at runtime. The file can be opened directly in a browser (`file://`) or served via any static HTTP server.

---

## Local Development

To preview the app locally, serve the directory with any HTTP server:

```bash
# Python (recommended, usually pre-installed)
python3 -m http.server 8080
# Then open: http://localhost:8080/ocm-navigator-v3.html

# Or use the convenience scripts:
./start-server.sh          # Mac/Linux
start-server.bat           # Windows (double-click)

# Or with Node.js
npx serve . -l 8080
```

There is no `npm install`, no compilation, and no watch mode. Edit `ocm-navigator-v3.html` and hard-refresh the browser to see changes.

---

## Application Architecture

### All code is in one `<script type="text/babel">` block

The HTML file contains a single Babel/JSX script block. The structure within it is:

| Section (line range) | Purpose |
|---|---|
| ~31–53   | **Theme object `T`** – all color/spacing tokens |
| ~54–60   | **Score/status helper functions** |
| ~61–113  | **`METHODS` library** – 10 built-in OCM method cards |
| ~115–119 | **Persistence** – `sv()` (save) / `ld()` (load) via `localStorage` |
| ~121–233 | **Micro-components** – `Badge`, `Btn`, `Input`, `ScoreInput`, `Card`, `Modal`, `Tabs`, `Empty`, `EditCell`, `TagInput` |
| ~231–232 | **`adkarCov()`** – ADKAR coverage calculator |
| ~237–1135| **`App()` function** – the main React component |

### Navigation sections (state: `nav`)

| `nav` key     | Label (German)       | Requires selected initiative? |
|---------------|----------------------|-------------------------------|
| `dashboard`   | Dashboard            | No (shows global summary)     |
| `portfolio`   | Portfolio            | No (initiative list)          |
| `initiative`  | Initiative           | Yes                           |
| `engagement`  | Engagement Tracker   | Yes                           |
| `comms`       | Komm.-Matrix         | Yes                           |
| `saturation`  | Change Saturation    | Yes                           |
| `heatmap`     | Impact Heatmap       | Yes                           |
| `timeline`    | Timeline             | Yes                           |
| `report`      | Statusreport         | Yes                           |
| `methods`     | Methoden-Bibliothek  | No                            |
| `io`          | Import / Export      | No                            |

### Data model (`data` state object)

```js
{
  initiatives:     [],  // Change projects
  stakeholders:    [],  // Stakeholder records (linked by initiative_id)
  targetGroups:    [],  // Affected groups (linked by initiative_id)
  impactItems:     [],  // Impact assessments per target group (0–10 scores)
  actions:         [],  // OCM measures/actions (linked to target groups)
  changeProposals: [],  // (reserved)
  engagements:     [],  // Stakeholder engagement log entries
  commsItems:      [],  // Communication plan items
  methods:         [],  // Method library (defaults to METHODS constant)
  customTags: {
    roles:       [...ROLES],        // Custom role tags
    actionTypes: [...TYPES],        // Custom action type tags
    channels:    [...CHANNELS],     // Custom channel tags
    projectTags: [],
  }
}
```

All entities use a short random `uid()` as their `id`. Cross-references use `initiative_id`, `stakeholder_id`, or `target_group_id` foreign keys.

### Key constants

| Constant    | Values |
|-------------|--------|
| `ADKAR`     | `["Awareness", "Desire", "Knowledge", "Ability", "Reinforcement"]` |
| `DIMS`      | `["People", "Process", "Technology", "Org"]` |
| `READINESS` | `["supportive", "neutral", "skeptical", "resistant"]` |
| `TYPES`     | `["Comms", "Training", "Workshop", "Coaching", "Enablement", "Event", "Feedback"]` |
| `STATUSES`  | `["planned", "in_progress", "done"]` |
| `ROLES`     | `["Sponsor", "PL", "HR", "IT", "BR", "CM", "SME", "Exec"]` |
| `CHANNELS`  | Townhall, E-Mail, Teams-Chat, Intranet, 1:1-Gespräch, Workshop, Newsletter, Video, Poster/Flyer, Yammer/Viva |

---

## Coding Conventions

### Theme / styling
- All colors and radii come from the `T` object. Never hardcode colors inline.
- Use `T.r` (12px) for card border-radius, `T.rs` (8px) for smaller elements.
- All styles are inline React style objects – there is no external CSS or class system.
- Score coloring uses the shared helpers `scoreColor(v)` and `scoreBg(v)` (0–10 scale: ≥8 = danger red, ≥5 = warning amber, <5 = success green).

### State management
- State is lifted to the top-level `App()` component.
- Mutations go through `up(fn)` which uses `structuredClone` for immutability.
- Derived data (filtered lists per initiative) is computed with `useMemo`.
- `useCallback` is used for `up` to keep its reference stable.

### Component patterns
- Micro-components (`Btn`, `Card`, `Modal`, etc.) are pure functional components defined above `App`.
- Sub-views (Sidebar, Dashboard, Portfolio, etc.) are defined as **inner functions inside `App`** and use closure to access state/handlers directly.
- `EditCell` is an inline-editable cell component that toggles between display and edit mode on click.

### Persistence
- Auto-save: `useEffect` triggers `sv(data)` on every `data` change after initial load.
- Auto-load: `useEffect` on mount calls `ld()` and merges into `emptyD()` defaults.
- Export: serialises full `data` object to a `.json` download.
- Import: parses pasted JSON and merges with `setData`.

### Language
- **All UI text is in German.** Maintain German for all user-visible strings.
- Variable names and code comments may be in English.

---

## Smart Alerts

The app computes contextual warnings inside `App()`:
- ADKAR coverage gaps (phases with zero actions)
- High-influence resistant stakeholders
- Stakeholders with influence ≥ 7 and no engagement in >14 days
- Target groups with cumulative change-saturation score >25
- Upcoming Go-Live (≤28 days) with >3 planned actions still open

---

## Import / Export Workflow

Data is stored per-browser in `localStorage`. To share data between users:
1. One person exports JSON via **Import / Export → JSON-Export**
2. Uploads the file to a shared drive (Teams, SharePoint, etc.)
3. Others import it via **Import / Export → JSON importieren**

---

## Git Workflow

- Default branch: `master`
- Feature branches follow the pattern `claude/<description>-<session-id>`
- Push with: `git push -u origin <branch-name>`
- No CI/CD pipeline, no automated tests, no pre-commit hooks

---

## What Does Not Exist Here

- No `package.json` / `node_modules`
- No test suite
- No linter or formatter configuration
- No build or bundle step
- No server-side code or backend
- No environment variables
- No TypeScript

When making changes, edit `ocm-navigator-v3.html` directly. Validate by serving the file locally and testing in a browser.
