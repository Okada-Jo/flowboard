# Flowboard

Flowboard is a browser-based flowchart editor for mapping processes, decisions,
and ideas. Create boards, connect nodes on an interactive canvas, and save your
work locally in your browser. No account or backend service is required.

## Features

- **Board management:** create, rename, and delete boards from the home page.
- **Purposeful nodes:** Steps with instructions, Decisions with labelled routes,
  Notes for context, Checkpoints with readiness criteria, and Linked flows that
  open detailed processes on other boards. Existing Input / Output nodes remain supported.
- **Interactive canvas:** drag nodes, connect them, and use zoom and fit-view controls.
- **Direct editing:** click a title or body to write; Tab saves and advances,
  Escape cancels the field. Selected cards expose Edit, Connect, Duplicate, and Delete.
- **Reusable flows:** link existing boards or create a detailed flow from a card;
  breadcrumbs take you back. Exports include reachable linked boards.
- **Undo and redo:** step back and forward through diagram edits.
- **Appearance:** choose Light, Dark, or System from either page header. Your
  preference is saved in localStorage; System follows your device’s appearance.
- **Local autosave:** store diagrams in IndexedDB as you work.
- **JSON import and export:** back up boards or move them between browsers.

## Getting started

Use Node.js **22.22.2+ on the 22.x release line** or **24.15.0+ on the 24.x
release line**, with npm. These minimum versions are required by the jsdom test
environment.

From the repository directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Dependency installation also activates the
Husky Git hooks. No environment variables or database server need configuring.

To build and preview the production app locally:

```sh
npm run build
npm run preview
```

The build writes static files to `dist/`. When deploying to a static host,
configure an SPA fallback to `index.html` so direct visits to `/boards/:boardId`
work with the app's browser-based routing.

## Using Flowboard

1. Click **+ New board** on the home page.
2. Add nodes from the toolbar, or right-click the canvas to add one at that position.
3. Drag a card by its header grip to move it. Select its border to show resize
   handles and quick actions. Click any title or instructions field to edit.
4. Connect cards by dragging their connection points, or use **Connect** in the
   selected card's action bar. Decisions have separate labelled routes; add or
   rename outcomes directly on the card. Disconnect a route before removing it.
5. Add a **Note** for background information. Its connections are dotted
   attachments rather than process routes. **Checkpoints** show manually verified
   readiness; incomplete checkpoints have a dashed outgoing connection.
6. Add a **Linked flow**, select another board, and choose **Open**. Alternatively,
   create a new flow from the card. The header offers a return path, and edits are
   saved before navigation. Unavailable links can be reassigned on the card.
7. Use **Export** to download the board and reachable linked flows in one file.
   Use **Import** on the home page to create independent copies with their links
   preserved. Legacy version 1 files remain readable.

### Keyboard shortcuts

Use **Ctrl** on Windows/Linux or **Cmd** on macOS for the modifier below.
Shortcuts apply when you are not typing in an editable field.

| Action                           | Shortcut             |
| -------------------------------- | -------------------- |
| Undo                             | Ctrl/Cmd + Z         |
| Redo                             | Ctrl/Cmd + Shift + Z |
| Copy selected nodes              | Ctrl/Cmd + C         |
| Paste copied nodes               | Ctrl/Cmd + V         |
| Duplicate selected nodes         | Ctrl/Cmd + D         |
| Select all nodes and connections | Ctrl/Cmd + A         |
| Delete selection                 | Delete or Backspace  |
| Clear selection                  | Escape               |

Copy and paste use the editor's internal clipboard, rather than the operating
system clipboard.

### Storage and backups

Boards are stored in the current browser's IndexedDB using Dexie. They are scoped
to the site's origin, so a different browser, device, hostname, or port has its
own board collection. There is no cloud sync or shared editing.

Autosave runs after a 500 ms pause in diagram changes and flushes pending edits
when leaving the editor. Clearing site data removes locally stored boards; export
boards you want to keep or transfer. Import validates the Flowboard JSON format
and creates a new board without overwriting an existing one.

## Development

The app uses React, TypeScript, and Vite, with React Flow for the canvas, Redux
Toolkit for editor state and history, Tailwind CSS for styling, Dexie for
persistence, and Zod for file validation.

### Commands

| Command                | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the development server with hot reload |
| `npm run build`        | Type-check and build the app into `dist/`    |
| `npm run preview`      | Serve the production build locally           |
| `npm test`             | Run all tests once                           |
| `npm run test:watch`   | Rerun tests while developing                 |
| `npm run lint`         | Check lint rules across the project          |
| `npm run lint:fix`     | Apply available lint fixes                   |
| `npm run format`       | Format the project with Prettier             |
| `npm run format:check` | Check formatting without changing files      |

### Project structure

```text
src/
├── app/                 # Redux store and typed hooks
├── features/editor/     # Editor state, history, canvas, nodes, and shortcuts
├── import-export/       # JSON schema, validation, and file handling
├── pages/               # Board collection and editor pages
├── persistence/         # IndexedDB repository and autosave
├── test/                # Shared test setup, fixtures, and editor hook tests
├── App.tsx              # Application routes
├── index.css            # Global styles and theme
└── main.tsx             # Application entry point and providers
```

Most tests live alongside the code they cover.

### Code style and Git hooks

In VS Code, install the recommended **ESLint** and **Prettier** extensions
(open Extensions and search `@recommended`). The checked-in workspace settings
format files and apply available ESLint fixes on explicit save (Ctrl/Cmd+S).
Remaining lint errors appear in the Problems panel and need manual fixes.
Formatting follows the existing single-quote, no-semicolon style.

Before each commit, Husky runs lint-staged on staged files: JavaScript and
TypeScript get ESLint auto-fixes followed by Prettier; JSON, CSS, HTML, Markdown,
and YAML get Prettier. Unresolved lint errors or warnings block the commit.
Tests run separately and are not part of pre-commit.

The hook uses [eslint_d](https://github.com/mantoni/eslint_d.js) to keep the
project's ESLint and plugins loaded between commits, plus content-based lint
and formatting caches in `node_modules/.cache/`. No lint rules are skipped.
The first JavaScript/TypeScript commit after installation, a dependency change,
or two hours of inactivity still pays the cold-start cost; subsequent commits
reuse the process. Set `ESLINT_D_IDLE` to change the idle timeout in minutes.
`npm run lint` still runs a fresh ESLint process for full-project validation.
To stop the background process manually, run `npx --no-install eslint_d stop`.

### Testing

Tests use Vitest and React Testing Library with jsdom and an isolated in-memory
IndexedDB. They cover editor operations and history, clipboard behavior,
keyboard shortcuts, context menus, board management, persistence, autosave, and
JSON import/export. They do not touch browser boards.

Canvas layout and pointer dragging in a real browser are not covered by this
suite; check these manually when changing canvas behavior.

Run these checks before submitting code changes:

```sh
npm test
npm run lint
npm run format:check
npm run build
```
