# DevBoardAi

DevBoardAi is a lightweight project management board for organizing work visually. It follows a familiar Trello-style workflow: create lists, add cards, move work between stages, and keep the board saved automatically.

![DevBoardAi board preview](./devboard-ai-preview.png)

## What it includes

- Drag and drop columns and tasks
- Persistent board data with Zustand and browser storage
- Ready-to-use workflows for:
  - Software development
  - Bug tracking
  - Content planning
  - Personal planning
  - Custom boards
- Editable column names and task content
- Task priorities and due dates
- Task search and priority filtering
- Delete confirmations with undo support
- AI-generated progress summaries
- Responsive light theme for desktop and smaller screens

## Built with

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- dnd-kit

## Run it locally

You need Node.js 14 or newer.

```bash
git clone <your-repository-url>
cd DevBoardAI
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## AI summary setup

The AI summary is handled through the serverless endpoint in [`api/summarize.ts`](./api/summarize.ts). The OpenRouter key is read on the server and is not included in the browser bundle.

For local development, create a file named `.Env` in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openrouter/free
APP_URL=http://localhost:5173
```

The `.Env` file is ignored by Git. Never commit an API key or use a `VITE_` prefix for the server key.

For a deployed app, configure the same variables in the hosting provider's environment settings. The current API endpoint is designed for Vercel-style serverless deployment.

## Useful commands

```bash
npm run dev       # Start the development server
npm run build     # Type-check and create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

## Project layout

```text
DevBoardAI/
├── api/                 # Serverless AI summary endpoint
├── public/              # Public assets
├── src/
│   ├── components/      # Board, column, and task UI
│   ├── hooks/           # Board actions and drag/drop logic
│   ├── icons/           # Reusable SVG icons
│   ├── stores/          # Persistent Zustand store
│   ├── App.css          # Global styles
│   └── types.ts         # Shared TypeScript types
├── index.html
├── package.json
└── vite.config.ts
```

## Deployment

Build the project with:

```bash
npm run build
```

Vercel is the simplest deployment option because it supports both the Vite frontend and the `api/` serverless function. After deployment, add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `APP_URL` to the project environment variables, then redeploy.

Before sharing the project, check the board at both desktop and mobile widths. In particular, verify horizontal board scrolling, task editing, filters, delete/undo actions, and the AI summary panel.

## License

This project is available under the MIT License.
