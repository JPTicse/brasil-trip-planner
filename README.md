# Brasil Trip Planner 🇧🇷

Planifica tu viaje a Brasil con un grupo de amigos: itinerario compartido,
hoteles, transporte y gastos con reparto automático. Mobile-first, con login
de Google y despliegue gratuito en Vercel + Supabase.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** — PostgreSQL gestionado + Auth con Google OAuth
- **Vercel** — hosting gratuito

## Funciones

- 🔐 Login con Google (cada amigo con su cuenta)
- 🗓️ Itinerario compartido con actividades por día
- 🏨 Gestión de hoteles y alojamientos
- 🚌 Transporte (vuelos, autobuses, coches...)
- 💰 Gastos compartidos con reparto automático y saldos entre miembros
- 👥 Gestión de miembros del viaje
- 📱 Diseño mobile-first con navegación inferior

## Puesta en marcha (desarrollo)

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratis).
2. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. En **Authentication → Providers**, activa **Google** y configura tu OAuth
   client de Google (ver más abajo).
4. En **SQL Editor**, pega y ejecuta el contenido de `supabase/schema.sql`.
   Esto crea las tablas, políticas RLS y el trigger de perfiles automáticos.

### 2. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) → crea un
   proyecto (o usa uno existente).
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://<tu-proyecto>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (para desarrollo local)
3. Copia el **Client ID** y **Client Secret** en Supabase:
   **Authentication → Providers → Google**.

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com), importa el proyecto.
3. Añade las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Project Settings → Environment Variables**.
4. En Supabase, añade la URL de tu despliegue de Vercel a:
   - **Authentication → URL Configuration → Redirect URLs**:
     `https://<tu-app>.vercel.app/auth/callback`
5. Deploy. ¡Listo!

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout raíz
│   ├── page.tsx                # Redirect a /trips o /login
│   ├── login/page.tsx          # Pantalla de login con Google
│   ├── auth/callback/route.ts  # Callback OAuth
│   └── trips/
│       ├── page.tsx            # Lista de viajes
│       ├── new/page.tsx        # Crear viaje
│       └── [id]/
│           ├── layout.tsx      # Layout con header + nav inferior
│           ├── page.tsx        # Redirect al itinerario
│           ├── itinerary/      # Itinerario por días
│           ├── accommodations/ # Hoteles
│           ├── transport/      # Transporte
│           ├── expenses/       # Gastos compartidos + saldos
│           └── members/        # Miembros del viaje
├── components/                 # Componentes UI reutilizables
├── lib/
│   ├── supabase/               # Clientes server, browser y middleware
│   ├── types.ts                # Tipos de TypeScript
│   ├── data.ts                 # Funciones de lectura (data fetching)
│   ├── actions.ts              # Server Actions (crear, borrar, etc.)
│   ├── auth.ts                 # Helper de sesión server-side
│   ├── auth-actions.ts         # Acciones de auth client-side
│   └── format.ts               # Formato de fechas y monedas
supabase/
└── schema.sql                  # Esquema de BBDD + RLS + triggers
```

## Notas

- La app está en español y optimizada para móvil.
- Los gastos se reparten a partes iguales entre todos los miembros del viaje.
- Los saldos muestran quién debe dinero a quién (verde = le deben, rojo = debe).
- El creador del viaje (owner) puede añadir/expulsar miembros y eliminar el viaje.
