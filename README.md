# Sorteos App

## 1. Nombre del proyecto

**Sorteos App** — aplicación web para administrar eventos de sorteos y permitir que sus participantes descubran premios mediante códigos individuales.

## 2. Descripción y objetivo

Sorteos App es una plataforma con dos perfiles de usuario:

- **Administrador:** inicia sesión con usuario y contraseña; crea eventos; registra participantes y premios; activa/desactiva eventos; consulta resultados de los sorteos.
- **Participante:** ingresa mediante un código individual; consulta el evento al que pertenece; selecciona una casilla para descubrir un premio; solo puede descubrir un premio por evento; consulta los premios descubiertos por otros participantes sin conocer sus identidades.

**Estado actual:** infraestructura técnica, base de datos (tablas, RLS, triggers, RPCs), autenticación administrativa, módulo de eventos (listado, creación, activación, desactivación y reactivación), módulo de participantes (listado, creación, edición, eliminación y visualización de códigos), módulo de premios (listado, creación, edición y eliminación), pantalla de inicio con acceso rápido y vista funcional del participante (consulta, selección de casilla, canje y revelación de premio) implementados.

## 3. Tecnologías utilizadas

- Next.js 16 (App Router)
- React 19
- TypeScript (modo estricto)
- Tailwind CSS 4
- Supabase (PostgreSQL) — migraciones aplicadas, RLS y triggers activos
- Supabase Auth (administrador pre-registrado)
- Lucide React (iconos)
- ESLint (eslint-config-next)
- npm
- Supabase CLI (devDependency)

## 4. Requisitos previos

- Node.js 20 o superior (recomendado 24.x)
- npm 10 o superior
- Cuenta de Supabase con proyecto creado (`sorteos-app`)

## 5. Instalación

```bash
npm install
```

## 6. Configuración de variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Notas:

- No incluir claves de servicio (`service_role`) en el cliente.
- Supabase también puede exponer la clave pública como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en versiones recientes; si tu proyecto la usa, documenta y utiliza la configuración vigente.
- `.env.local` está excluido de Git (ver `.gitignore`).
- Las credenciales reales se obtienen en Supabase Dashboard > Project Settings > API.

## 7. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## 8. Estructura de carpetas

```text
SorteoApp2/   (nombre del directorio del proyecto; puede variar según el entorno)
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── page.tsx
│   │   ├── participante/
│   │   │   ├── page.tsx
│   │   │   └── ParticipanteView.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   └── (protected)/
│   │   │       ├── layout.tsx
│   │   │       ├── eventos/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── actions.ts
│   │   │       │   ├── EventForm.tsx
│   │   │       │   └── EventActions.tsx
│   │   │       ├── participantes/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── actions.ts
│   │   │       │   ├── EventoSelector.tsx
│   │   │       │   ├── ParticipanteForm.tsx
│   │   │       │   ├── ParticipanteRow.tsx
│   │   │       │   └── ExportarCsvButton.tsx
│   │   │       └── premios/
│   │   │           ├── page.tsx
│   │   │           ├── actions.ts
│   │   │           ├── EventoSelector.tsx
│   │   │           ├── PremioForm.tsx
│   │   │           └── PremioRow.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   └── AdminNav.tsx
│   │   └── shared/
│   │       ├── CodigoForm.tsx
│   │       └── LogoutButton.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       └── index.ts
├── proxy.ts
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20261116120000_create_initial_tables.sql
│       ├── 20261116130000_enable_rls_and_policies.sql
│       ├── 20261116140000_create_triggers_and_business_rules.sql
│       └── 20261117120000_create_participant_rpcs.sql
├── .env.example
├── .env.local (excluido de Git)
├── .gitignore
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
└── ...
```

## 9. Descripción de los módulos de la aplicación

- `src/app`: rutas y layouts (App Router).
- `src/components/ui`: componentes de interfaz reutilizables (pendiente de implementación).
- `src/components/layout`: componentes de estructura (AdminNav implementado).
- `src/components/shared`: componentes compartidos (LogoutButton, CodigoForm implementados).
- `src/lib/supabase`: clientes de Supabase para navegador y servidor (infraestructura implementada).
- `src/types`: tipos compartidos (Evento, EstadoEvento, Participante, Premio, SorteoData, etc. implementados).
- `src/hooks`: hooks personalizados (pendiente).
- `src/proxy.ts`: proxy de Next.js 16 para refresh de sesión y protección de rutas administrativas.

## 10. Descripción de las rutas

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Pantalla de inicio con acceso rápido por código y enlace a administración. | Implementado |
| `/participante` | Vista del participante: consulta de sorteo, selección de casilla, canje y revelación de premio. | Implementado |
| `/admin/login` | Inicio de sesión administrativo. | Implementado |
| `/admin/eventos` | Listado y creación de eventos. | Implementado |
| `/admin/participantes` | Gestión de participantes por evento (listado, creación, edición, eliminación). | Implementado |
| `/admin/premios` | Gestión de premios por evento (listado, creación, edición, eliminación). | Implementado |

Las rutas administrativas están protegidas por `proxy.ts` y por el layout `(protected)`.

## 11. Reglas de negocio conocidas

Los eventos tendrán tres estados: **Borrador**, **Activo**, **Inactivo**.

- Participantes y premios solo pueden modificarse mientras el evento esté en **Borrador**.
- Al activarse por primera vez, el evento queda definitivamente cerrado a modificaciones.
- Desactivar un evento únicamente bloquea el acceso y los nuevos canjes.
- Si se reactiva, conserva participantes, premios y códigos originales.
- Cada participante puede descubrir únicamente un premio por evento.
- Para activar un evento, la cantidad de participantes debe ser exactamente igual a la cantidad de premios registrados.
- Al activar el evento por primera vez, se genera un código único de 9 caracteres alfanuméricos para cada participante. Se excluyen los caracteres ambiguos I, L, O, 0 y 1.
- Los códigos se generan una sola vez y se conservan cuando el evento se desactiva y reactiva.
- Cada casilla representa una posición de selección, no un premio específico. Cuando el participante confirma su selección, el sistema asigna aleatoriamente uno de los premios que todavía estén disponibles.
- Un premio solo puede ser asignado a un participante.
- Los participantes pueden consultar los premios descubiertos por otros, incluyendo su fecha y hora de descubrimiento, pero nunca el nombre ni los datos del participante que lo obtuvo.
- El administrador sí puede consultar la relación entre participantes y premios obtenidos.
- Estas reglas se respetarán en las etapas de implementación futuras.

## 12. Integración con Supabase

### Base de datos
- Proyecto remoto: `sorteos-app` (Reference ID: `trkhzvazbofcpgtbsgym`).
- Cuatro migraciones aplicadas:
  1. `20261116120000_create_initial_tables.sql` — tablas `usuarios`, `eventos`, `participantes`, `premios`, `canjes`.
  2. `20261116130000_enable_rls_and_policies.sql` — RLS habilitado, función `is_admin()`, políticas de acceso.
  3. `20261116140000_create_triggers_and_business_rules.sql` — triggers de congelación y validación de cantidades.
  4. `20261117120000_create_participant_rpcs.sql` — funciones RPC públicas `consultar_sorteo_por_codigo` y `canjear_premio` (SECURITY DEFINER).
- RLS activo en las cinco tablas. Acceso público mediante RPC para el flujo del participante.
- Triggers protegen la congelación de eventos y la inmutabilidad de participantes/premios tras la activación.

### Autenticación
- Supabase Auth para el administrador (email/contraseña).
- Tabla `usuarios` vinculada a `auth.users.id`.
- Proxy (`src/proxy.ts`) refresca la sesión con `getClaims()` y protege rutas `/admin/*`.
- Login y logout implementados.
- Perfil administrativo validado en servidor y en proxy.

### Clientes
- `src/lib/supabase/client.ts` — `createBrowserClient` (Client Components).
- `src/lib/supabase/server.ts` — `createServerClient` con cookies (Server Components, Server Actions, Route Handlers).
- `src/lib/supabase/index.ts` — re-exporta ambos clientes.

### Variables de entorno
- `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `.env.local` (excluido de Git) debe contener los valores reales del proyecto.

## 13. Consideraciones para el despliegue en Vercel

- URL de producción: https://sorteos-27mkmzsax-fermar-807.vercel.app/
- Configurar las variables de entorno en el panel de Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- El build de producción se verifica con `npm run build`.
- Framework preset: Next.js.
- No commitear `.env.local`.

## Comandos disponibles

```bash
npm run dev    # Servidor de desarrollo
npm run build  # Compilación de producción
npm run start  # Servidor de producción (tras build)
npm run lint   # ESLint
```