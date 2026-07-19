# Base de datos BIM AI Platform

## Configuración

### Supabase
1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ir al **SQL Editor**
3. Ejecutar `001_schema.sql` para crear las tablas
4. Ejecutar `002_seed.sql` para datos de prueba
5. Copiar la **Connection string** (URI) a `DATABASE_URL` en Vercel

### Credenciales de prueba

| Rol | Email | Password |
|---|---|---|
| Admin | admin@bimplatform.com | Admin123! |
| Arquitecto | arquitecto@bimplatform.com | Arq12345! |
| Ingeniero | ingeniero@bimplatform.com | Ing12345! |
| Cliente (viewer) | cliente@bimplatform.com | Cli12345! |

### Variables en Vercel

```
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
JWT_ACCESS_SECRET=<generar>
JWT_REFRESH_SECRET=<generar-diferente>
GEMINI_API_KEY=<tu-api-key>
CORS_ORIGIN=https://frontend.vercel.app
```
