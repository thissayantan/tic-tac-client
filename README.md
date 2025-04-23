# Tic‑Tac‑Toe Client

A real‑time multiplayer Tic‑Tac‑Toe client built with Next.js 15, React, Tailwind CSS, and Zustand for state management.

## Features
- Real‑time gameplay via Socket.IO
- Room‑based matchmaking with shareable room codes
- Avatar selection with animated avatars and sound effects
- Responsive design for mobile, tablet, and desktop
- End‑game celebration animations with Confetti
- Automatic reconnection and error handling

## Prerequisites
- Node.js >= 16
- npm or yarn

## Getting Started
1. Clone this repository
2. Install dependencies:
   ```fish
   npm install
   ```
3. Copy `.env.example` to `.env.local` and set:
   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:3001
   ```
4. Start development server:
   ```fish
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts
- `npm run dev` – Runs the app in development mode
- `npm run build` – Builds the app for production
- `npm run start` – Runs the production build

## Environment Variables
```env
NEXT_PUBLIC_SERVER_URL=<your back‑end URL>
```

## Deployment
- **Vercel**: Connect your GitHub repo, select the project, and deploy.
- **Render** or **Netlify**: Auto‑detect Next.js; configure build command `npm run build` and publish directory `.next`.

## License
MIT
