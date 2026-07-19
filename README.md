# BIM AI Platform

Plataforma de gestión de proyectos BIM con inteligencia artificial.

## Arquitectura

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL (Supabase)
- **IA**: Google Gemini API (gratuito)
- **Auth**: JWT (access + refresh tokens) + OAuth 2.0 (Google)

## Estructura

```
bim-ai-platform/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # Login, Dashboard, ProjectDetail, AIChat
│       ├── components/
│       ├── contexts/  # AuthContext
│       └── services/  # API client con refresh automático
│
└── backend/           # Express + TypeScript
    └── src/
        ├── config/    # DB, migrations, AI config
        ├── controllers/
        ├── middleware/ # JWT auth, rate limiting
        └── routes/
```

## Inicio rápido

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm run migrate
npm run dev

# Frontend
cd frontend
npm run dev
```

## Despliegue

- Frontend: Vercel
- Backend: Railway o Render
- DB: Supabase PostgreSQL
