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

## Usuarios de prueba (seed)

```bash
npm run seed
```

| Rol | Email | Password |
|---|---|---|
| Admin | admin@bimplatform.com | Admin123! |
| Arquitecto | arquitecto@bimplatform.com | Arq12345! |
| Ingeniero | ingeniero@bimplatform.com | Ing12345! |
| Cliente (visitor) | cliente@bimplatform.com | Cli12345! |

## Variables de Entorno (Vercel)

Configurar en Vercel > Project Settings > Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=generar-seguro
JWT_REFRESH_SECRET=generar-seguro-diferente
GEMINI_API_KEY=tu-api-key
CORS_ORIGIN=https://frontend.vercel.app
```

## Despliegue

- Frontend: `frontend/` → Vercel (static SPA)
- Backend: raíz del repo → Vercel (serverless function)
- DB: Supabase PostgreSQL
