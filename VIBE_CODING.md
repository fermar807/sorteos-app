# Documentación del proceso de desarrollo — Sorteos App

## Vibe Coding con IA como herramienta de apoyo

---

## 1. Introducción

### 1.1 Qué es Sorteos App

**Sorteos App** es una aplicación web para administrar eventos de sorteos y permitir que los participantes descubran premios mediante códigos individuales. Cuenta con dos perfiles:

- **Administrador:** inicia sesión con usuario y contraseña; crea eventos; registra participantes y premios; activa, desactiva y reactiva eventos; consulta resultados.
- **Participante:** ingresa mediante un código individual; consulta su evento; selecciona una casilla para descubrir un premio (uno por evento); consulta los premios descubiertos por otros sin conocer sus identidades.

### 1.2 Objetivo del proyecto

Desarrollar una plataforma funcional, con base de datos segura, autenticación administrativa, gestión de eventos/participantes/premios y experiencia de participante, manteniendo una arquitectura sencilla, escalable y fácil de entender.

### 1.3 Uso de Vibe Coding

El desarrollo se realizó mediante **Vibe Coding**: se utilizó un agente de IA (OpenCode) como copiloto para analizar requisitos, proponer soluciones técnicas, generar código, revisar migraciones SQL, detectar problemas y validar implementaciones. El desarrollador mantuvo la revisión y aprobación de cada decisión técnica antes de aplicarla. No se solicitó el desarrollo completo de la aplicación en un único prompt; se trabajó por etapas y funcionalidades independientes.

---

## 2. Herramientas y tecnologías

| Herramienta / Tecnología | Rol en el proyecto |
|--------------------------|--------------------|
| **OpenCode (IA)** | Copiloto de desarrollo: análisis, propuestas, código, revisión y documentación. |
| **Next.js 16 (App Router)** | Framework web con enrutamiento moderno y Server/Client Components. |
| **React 19** | Biblioteca de interfaz de usuario. |
| **TypeScript (strict)** | Tipado estricto en todo el código. |
| **Tailwind CSS 4** | Estilos y diseño responsivo. |
| **Supabase (PostgreSQL)** | Base de datos relacional, autenticación y cliente SSR. |
| **Supabase Auth** | Autenticación del administrador (email/contraseña). |
| **Supabase CLI** | Gestión de migraciones (devDependency). |
| **Lucide React** | Iconografía. |
| **ESLint (eslint-config-next)** | Calidad y estilo del código. |
| **Git / GitHub** | Control de versiones y publicación. |
| **Vercel** | Plataforma de despliegue (considerada en documentación). |
| **npm** | Administrador de paquetes. |

---

## 3. Metodología de trabajo

El desarrollo se organizó en **iteraciones por etapas y funcionalidades**, siguiendo este ciclo:

1. **Análisis de requisitos:** se definieron las reglas de negocio y el alcance de cada etapa.
2. **Propuesta técnica:** la IA presentó diseños (tablas, RLS, triggers, RPCs) antes de implementar.
3. **Revisión y aprobación:** el desarrollador revisó y aprobó o ajustó la propuesta.
4. **Implementación progresiva:** se generó código y migraciones por etapas independientes.
5. **Validación:** se ejecutaron `npm run lint` y `npm run build`; se revisaron migraciones estáticamente.
6. **Corrección de errores y ajustes:** se iteró sobre hallazgos (sintaxis, permisos, concurrencia, UI).
7. **Actualización de documentación:** `README.md` y `AGENTS.md` se mantuvieron sincronizados.

Se evitó solicitar el desarrollo completo en un único prompt; cada funcionalidad se trabajó de forma independiente y con autorización expresa.

---

## 4. Etapas del desarrollo

### Etapa 1 — Infraestructura inicial de Next.js

- **Objetivo:** crear el proyecto Next.js con TypeScript, Tailwind, ESLint, App Router y `src/`.
- **Qué se solicitó:** configurar el proyecto base sin funcionalidades de negocio.
- **Qué se implementó:** proyecto Next.js 16.4.6, React 19.3.0, estructura de carpetas, estilos globales, rutas placeholder, `.env.example`, `README.md`, `AGENTS.md`.
- **Decisiones:** uso de `src/`, alias `@/*`, Tailwind v4, identidad visual slate + ámbar.
- **Validación:** `npm run lint` y `npm run build` exitosos; rutas verificadas accesibles.

### Etapa 2 — Configuración de Supabase y base de datos

- **Objetivo:** preparar clientes Supabase, migraciones y reglas de negocio.
- **Qué se solicitó:** diseño de 5 tablas (`usuarios`, `eventos`, `participantes`, `premios`, `canjes`), RLS, triggers, RPCs, sin ejecutar SQL.
- **Qué se implementó (diseño):** propuesta técnica completa con ER, diccionario de datos, restricciones, seguridad, autenticación y concurrencia.
- **Iteraciones:** ajustes de FK compuestas, concurrencia (`FOR UPDATE SKIP LOCKED` + `FOR SHARE`), `search_path` controlado, `is_admin()` sin recursión.
- **Validación:** revisión estática (APROBADO CON OBSERVACIONES); ajuste final de `NOT NULL` en `estado`.

### Etapa 3 — Migraciones aplicadas en Supabase

- **Objetivo:** crear y aplicar las migraciones en el proyecto remoto `sorteos-app`.
- **Migraciones:**
  1. `20261116120000_create_initial_tables.sql` — tablas base.
  2. `20261116130000_enable_rls_and_policies.sql` — RLS, `is_admin()`, políticas.
  3. `20261116140000_create_triggers_and_business_rules.sql` — triggers de congelación y validación.
  4. `20261117120000_create_participant_rpcs.sql` — RPCs `consultar_sorteo_por_codigo` y `canjear_premio`.
- **Desafíos:** archivos SQL contenían una línea residual de fence Markdown (```) que causó error de sintaxis. Se eliminó únicamente esa línea. También se corrigió `LANGUAGE plpgsql` duplicado y validaciones redundantes.
- **Validación:** las cuatro migraciones quedaron registradas local y remotamente (`migration list --remote`).

### Etapa 4 — Autenticación administrativa

- **Objetivo:** implementar login/logout y protección de rutas admin.
- **Qué se implementó:** `proxy.ts` (Next.js 16) con `getClaims()`, página `/admin/login` con `signInWithPassword`, `LogoutButton`, layout protegido `(protected)/layout.tsx` con validación de perfil admin activo.
- **Decisiones:** Supabase Auth vinculado a `public.usuarios` (`id = auth.users.id`); no `service_role` en cliente; validación en servidor además del proxy.
- **Validación:** lint y build exitosos.

### Etapa 5 — Módulo de eventos

- **Objetivo:** listado y creación de eventos en `/admin/eventos`.
- **Qué se implementó:** Server Component con consulta ordenada, Server Action `createEvento` (identidad desde `getClaims()`, `created_by` del admin), formulario cliente con validación, estado vacío y manejo de errores.
- **Validación:** lint y build exitosos.

### Etapa 6 — Gestión de estado de eventos y códigos

- **Objetivo:** activación, desactivación, reactivación y generación de códigos únicos.
- **Qué se implementó:** Server Actions `activarEvento`, `desactivarEvento`, `reactivarEvento`; componente `EventActions` con confirmaciones; generación de códigos de 9 caracteres (alfabeto sin `I,L,O,0,1`) con `crypto.randomInt` y unicidad en memoria; visualización y copia de códigos en participantes.
- **Validación:** lint y build exitosos.

### Etapa 7 — Módulo de participantes

- **Objetivo:** CRUD de participantes por evento en `/admin/participantes`.
- **Qué se implementó:** selector de evento (query param `?eventoId=`), listado en cuadrícula, creación/edición/eliminación, bloqueo cuando el evento no está en Borrador, visualización de código y estado de canje, exportación a CSV con BOM UTF-8.
- **Validación:** lint y build exitosos.

### Etapa 8 — Módulo de premios

- **Objetivo:** CRUD de premios por evento en `/admin/premios`.
- **Qué se implementó:** selector de evento, listado en cuadrícula, creación/edición/eliminación, bloqueo fuera de Borrador, indicador comparativo (premios vs. participantes, faltantes para activar), estado de canje (Disponible/Descubierto) con ganador, casilla y fecha, enlaces cruzados con participantes.
- **Validación:** lint y build exitosos.

### Etapa 9 — Vista del participante y pantalla de inicio

- **Objetivo:** flujo completo del participante (`/` y `/participante`).
- **Qué se implementó:** portada con formulario de código (auto-mayúsculas, sin espacios) y enlace a admin; vista con casos A (selección de casilla con confirmación y animación de revelación) y B (premio ya descubierto); tablero de premios descubiertos sin identidades; botón de actualizar.
- **Validación:** lint y build exitosos.

### Etapa 10 — Ajustes de interfaz y documentación

- **Objetivo:** navegación admin, corrección de color de texto en inputs, actualización de documentación.
- **Qué se implementó:** `AdminNav` (barra de navegación con ruta activa), corrección de `color-scheme` y texto en `globals.css`/`EventForm`, actualización de `README.md` y `AGENTS.md`.

### Etapa 11 — Publicación en GitHub

- **Objetivo:** preparar y publicar el repositorio.
- **Qué se realizó:** `git init`, commit inicial (`0b4882d`), vinculación con `origin` (https://github.com/fermar807/sorteos-app.git) y `git push -u origin main` exitoso.

---

## 5. Prompts principales utilizados (resúmenes)

Los siguientes son resúmenes de la intención y terminología de los prompts originales, no citas textuales completas.

| # | Objetivo | Resumen del prompt |
|---|----------|--------------------|
| 1 | Infraestructura inicial | Crear proyecto Next.js 16+ con App Router, TypeScript estricto, Tailwind, Supabase, Lucide, ESLint, usando `src/`. Preparar estructura, dependencias y documentación. Sin funcionalidades de negocio. |
| 2 | Reglas de negocio | Documentar en README los estados de eventos (Borrador/Activo/Inactivo), congelación tras primera activación, códigos únicos, un premio por participante, anonimato de ganadores. |
| 3 | Diseño de BD | Diseñar 5 tablas (usuarios, eventos, participantes, premios, canjes) con relaciones, constraints, RLS, triggers y RPCs. Sin ejecutar SQL. Presentar propuesta para revisión. |
| 4 | Ajustes de BD | Corregir FK compuestas, concurrencia (`FOR UPDATE SKIP LOCKED` + `FOR SHARE`), `search_path` controlado, `is_admin()` sin recursión, índices mínimos. |
| 5 | Revisión QA | Revisión estática de las 3 migraciones: sintaxis, dependencias, RLS, integridad, concurrencia, compatibilidad con Supabase. |
| 6 | Fase 1 (tablas) | Crear migración SQL con las 5 tablas, PKs, FKs, UNIQUE, CHECK y defaults. No ejecutar. |
| 7 | Fase 2 (RLS) | Habilitar RLS, crear `is_admin()`, políticas por tabla, permisos básicos. |
| 8 | Fase 3 (triggers) | Triggers de congelación, validación de cantidades al activar, protección de participantes/premios, eliminación condicionada. |
| 9 | RPCs participante | Crear `consultar_sorteo_por_codigo` y `canjear_premio` (SECURITY DEFINER, atómicos, sin identidades). |
| 10 | Integración Next.js-Supabase | Revisar clientes, preparar `.env.local`, prueba de conectividad. |
| 11 | Supabase Auth | Implementar login/logout, proxy (Next.js 16), protección de rutas, validación de perfil admin. |
| 12 | Módulo eventos | Listado y creación de eventos con Server Actions y validación de identidad. |
| 13 | Estado de eventos y códigos | Activación/desactivación/reactivación, generación de códigos únicos, visualización y copia. |
| 14 | Módulo participantes | CRUD por evento, cuadrícula, exportación CSV, estado de canje. |
| 15 | Módulo premios | CRUD por evento, cuadrícula, disponibilidad/ganador, indicador comparativo. |
| 16 | Vista del participante | Pantalla de inicio, consulta de sorteo, selección de casilla, canje con animación, tablero de premios descubiertos. |
| 17 | Ajustes de UI | AdminNav, corrección de color de texto en inputs. |
| 18 | Documentación | Actualizar README y AGENTS para reflejar el progreso. |
| 19 | Publicación GitHub | Preparar y publicar repositorio. |

---

## 6. Iteraciones y colaboración con IA

Ejemplos concretos de refinamiento:

- **Profundidad técnica:** se solicitó mayor detalle en el diseño de BD antes de aprobarlo (diccionario de datos completo, triggers, concurrencia).
- **Corrección de FK compuestas:** se detectó inconsistencia en el orden de columnas (`(evento_id, id)` vs `(id, evento_id)`) y se corrigió.
- **Concurrencia:** se iteró de `FOR UPDATE` a `FOR UPDATE SKIP LOCKED` + `FOR SHARE` en el evento para permitir canjes simultáneos.
- **Funcionalidades incompletas:** en `/admin/premios` y `/admin/participantes` se detectó que faltaban el banner condicionado por estado y el detalle de ganadores en premios; se completaron.
- **Documentación sincronizada:** tras cada implementación se actualizó `README.md` y `AGENTS.md`.
- **Corrección de errores de sintaxis:** los archivos SQL contenían fences Markdown residuales que causaban error 42601; se eliminaron únicamente esas líneas.
- **Ajustes de UI:** se corrigió el texto invisible en inputs (causa raíz: `prefers-color-scheme: dark` + falta de `color-scheme`).

Estas iteraciones mejoraron la corrección, seguridad y mantenibilidad del resultado.

---

## 7. Decisiones técnicas importantes

| Decisión | Motivo / Evidencia |
|----------|--------------------|
| Next.js App Router | Requisito obligatorio; rutas modernas y Server/Client Components. |
| Separación de responsabilidades | Server Components (lectura), Server Actions (mutación), Client Components (interacción). |
| PostgreSQL (Supabase) | Requisito obligatorio; integridad referencial y RLS. |
| RLS habilitado en todas las tablas | Seguridad por fila; acceso público solo vía RPC. |
| Triggers para congelación | Garantizan reglas de negocio a nivel de BD, independiente de la app. |
| `primera_activacion_at` nullable | Distingue "nunca activado" de "activado y luego desactivado". |
| Códigos de 9 caracteres, alfabeto sin `I,L,O,0,1` | Evita caracteres ambiguos; unicidad garantizada. |
| `FOR UPDATE SKIP LOCKED` en canje | Evita asignación duplicada de premios concurrentemente. |
| `FOR SHARE` en el evento durante canje | Permite canjes simultáneos pero bloquea desactivación. |
| Supabase Auth vinculado a `usuarios` | Autenticación segura sin manejar hashes propios. |
| `getClaims()` en servidor (no `getSession()`) | Validación de identidad recomendada por Supabase SSR. |
| `proxy.ts` (Next.js 16) | Reemplaza `middleware.ts`; refresca sesión y protege rutas. |
| `search_path = ''` en funciones SECURITY DEFINER | Evita inyección de esquema. |
| `is_admin()` SECURITY DEFINER | Evita recursión de RLS al consultar `usuarios`. |
| Acceso anónimo solo vía RPC | Los participantes no tienen cuenta Auth; las RPCs validan el código. |
| Sin `service_role` en cliente | Seguridad: solo se usa la anon key pública. |

**Decisiones pendientes:** generación de tipos TypeScript de Supabase (opcional); validación en entorno de prueba de cascadas de eliminación.

---

## 8. Desafíos encontrados y soluciones

### 8.1 Configuración inicial

| Problema | Causa | Solución aplicada | Resultado comprobado |
|----------|-------|-------------------|----------------------|
| `npm` bloqueado por política de ejecución | Windows PowerShell execution policy | Uso de `cmd /c` para ejecutar npm | npm funcional |
| Nombre del proyecto con mayúsculas rechazado | Restricción de npm (sin mayúsculas) | Crear en directorio `sorteo-app` (lowercase) y renombrar | Proyecto creado |
| Directorio `SorteoApp` bloqueado por Windows | Handle abierto (antivirus/explorador) | Trabajar en `sorteo-app` y renombrar a `SorteoApp2` con PowerShell | Proyecto funcional en `SorteoApp2` |
| Timeout en instalación de dependencias | Operaciones largas | Ejecutar en background con `.bat` y verificar después | Dependencias instaladas |
| Conflicto de peer dependency (`@supabase/ssr`) | Resolución de versiones | Uso de `--legacy-peer-deps` | Instalación exitosa |

### 8.2 Base de datos

| Problema | Causa | Solución aplicada | Resultado comprobado |
|----------|-------|-------------------|----------------------|
| Error de sintaxis en migraciones (42601) | Línea residual de fence Markdown (```) en archivos SQL | Eliminar únicamente la línea residual | Migraciones aplicadas |
| `LANGUAGE plpgsql` duplicado | Declaración redundante al final de funciones | Eliminar la declaración duplicada | Sintaxis válida |
| Inconsistencia en FK compuestas | Orden de columnas `(id, evento_id)` vs `(evento_id, id)` | Corregir a `(evento_id, participante_id)` → `participantes(evento_id, id)` | Integridad garantizada |
| `eventos.estado` sin NOT NULL | Columna no declarada NOT NULL (aceptaba NULL en CHECK) | Validación explícita en trigger + documentación del ajuste | Protección garantizada |

### 8.3 Interfaz y compatibilidad

| Problema | Causa | Solución aplicada | Resultado comprobado |
|----------|-------|-------------------|----------------------|
| Texto invisible en inputs | `prefers-color-scheme: dark` + falta de `color-scheme` | Agregar `color-scheme: light` a `:root`, eliminar override oscuro, clases explícitas en inputs | Texto legible |
| Build fallido por `cacheComponents` | Incompatibilidad con `export const dynamic = "force-dynamic"` | Eliminar `cacheComponents` y `partialPrefetching` de `next.config.ts` | Build exitoso |
| Stale `.next/dev/types` tras mover archivos | Cache de tipos de rutas antiguas | Eliminar `.next/` y rebuild | Build exitoso |
| Lint: `prefer-const` | `let` usado para variable no reasignada | Cambiar a `const` | Lint OK |
| Lint: `react-hooks/set-state-in-effect` | `setState` sincrónico en efecto | Mover a IIFE async | Lint OK |

### 8.4 Concurrencia y seguridad

| Problema | Causa | Solución aplicada | Resultado comprobado |
|----------|-------|-------------------|----------------------|
| Asignación duplicada de premios | Canjes simultáneos | `FOR UPDATE SKIP LOCKED` + UNIQUE constraints | Protección garantizada |
| Desactivación durante canje | Bloqueo insuficiente | `FOR SHARE` en el evento durante canje | Desactivación espera a canjes |

---

## 9. Validación y control de calidad

### Validaciones ejecutadas (con evidencia)

| Validación | Comando | Resultado |
|------------|---------|-----------|
| Lint | `npm run lint` | Sin errores (múltiples ejecuciones) |
| Build de producción | `npm run build` | Exitoso (múltiples ejecuciones) |
| Migraciones | `npx supabase migration list --remote` | 4 migraciones registradas local y remotamente |
| Aplicación de migraciones | `npx supabase db push --remote --yes` | Exitoso (4 migraciones aplicadas) |
| Rutas | Verificación HTTP en dev server | Todas las rutas respondiendo 200 |
| Conectividad Supabase | `GET /rest/v1/` | HTTP 401 (esperado, confirma servicio activo) |

### Validaciones pendientes (sin evidencia)

- Pruebas funcionales end-to-end contra Supabase remoto con credenciales reales (login, creación de evento, activación, canje).
- Pruebas de concurrencia reales (canjes simultáneos).
- Pruebas de seguridad (intentos de acceso no autorizado).
- Verificación de cascadas de eliminación en entorno de prueba.

---

## 10. Resultado final

### Funcionalidades implementadas

- **Infraestructura:** Next.js 16, TypeScript estricto, Tailwind CSS 4, Supabase SSR, Lucide React, ESLint, Supabase CLI.
- **Base de datos:** 5 tablas (`usuarios`, `eventos`, `participantes`, `premios`, `canjes`) con RLS, triggers de congelación, validación de cantidades y 2 funciones RPC públicas.
- **Autenticación:** Supabase Auth para administrador, proxy (Next.js 16), login/logout, validación de perfil admin.
- **Módulo de eventos:** listado, creación, activación, desactivación, reactivación, conteo de participantes/premios.
- **Módulo de participantes:** listado en cuadrícula, creación, edición, eliminación, visualización y copia de códigos, exportación CSV.
- **Módulo de premios:** listado en cuadrícula, creación, edición, eliminación, indicador comparativo, estado de canjes (disponible/descubierto) con ganador.
- **Vista del participante:** pantalla de inicio con acceso rápido, consulta de sorteo, selección de casilla con confirmación, animación de revelación, tablero de premios descubiertos.
- **Navegación:** barra de navegación administrativa con ruta activa.
- **Documentación:** `README.md` y `AGENTS.md` actualizados.

### Arquitectura general

- **Frontend:** Next.js App Router con Server/Client Components, Server Actions para mutaciones.
- **Backend:** Supabase PostgreSQL con RLS, triggers y funciones RPC.
- **Seguridad:** RLS por rol, `is_admin()` SECURITY DEFINER, proxy con `getClaims()`, validación en servidor.
- **Despliegue:** considerado para Vercel (variables de entorno documentadas).

### Integración con Supabase

- Proyecto remoto: `sorteos-app` (Reference ID: `trkhzvazbofcpgtbsgym`).
- 4 migraciones aplicadas y registradas.
- Clientes SSR configurados (`client.ts`, `server.ts`).
- Variables de entorno: `.env.local` (excluido de Git) con URL y anon key.

### Despliegue en producción

- Enlace real de producción: https://sorteos-27mkmzsax-fermar-807.vercel.app/

### Funcionalidades fuera del alcance (no implementadas)

- Dashboard administrativo completo con estadísticas.
- Animaciones avanzadas de premios (se usa animación CSS simple con Tailwind).
- Generación de tipos TypeScript de Supabase.
- Pruebas automatizadas (unitarias/integración).
- Registro público de administradores (no requerido).

---

## 11. Reflexión sobre el uso de Vibe Coding

El desarrollo de Sorteos App mediante Vibe Coding demostró que la IA es una herramienta poderosa cuando se utiliza con supervisión y criterio técnico:

- **Ventajas:** aceleró la generación de código, migraciones SQL, documentación y detección de problemas. Permitió explorar alternativas técnicas rápidamente.
- **Prompts claros:** la calidad de los resultados dependió directamente de la precisión de las instrucciones. Prompts con requisitos específicos, restricciones y formato de entrega produjeron mejores resultados.
- **Revisión antes de aprobar:** cada propuesta (BD, RLS, triggers, RPCs) se revisó y ajustó antes de implementar. Esto evitó errores de seguridad e integridad.
- **Tareas pequeñas:** dividir el desarrollo en etapas y funcionalidades independientes permitió validar cada parte antes de continuar.
- **Validación del código generado:** la IA puede generar código con errores sutiles (fences Markdown en SQL, `LANGUAGE plpgsql` duplicado, `prefer-const`). La validación con `lint` y `build` fue esencial.
- **Responsabilidad del desarrollador:** la IA es un copiloto, no un responsable autónomo. Las decisiones técnicas, la seguridad y el resultado final son responsabilidad del desarrollador.

La colaboración desarrollador-IA fue efectiva porque se mantuvo un control estricto del alcance, se revisaron todas las propuestas y se validaron los resultados antes de avanzar.

---

## 12. Publicación en GitHub

- **Repositorio:** https://github.com/fermar807/sorteos-app.git
- **Rama:** `main`
- **Commit inicial:** `0b4882d` — "Initial commit: SorteosAPP" (2026-11-18)
- **Archivos publicados:** 55 (código, migraciones, configuración, documentación).
- **Archivos excluidos:** `.env.local`, `.next/`, `node_modules/`, `supabase/.temp/`, `supabase/.branches/`.

---

## Fuentes utilizadas para reconstruir el proceso

1. **Historial de conversaciones con OpenCode:** prompts, iteraciones, errores y validaciones documentados en la sesión de desarrollo.
2. **Código fuente actual:** estructura, componentes, Server Actions, clientes de Supabase, tipos.
3. **Migraciones SQL:** `supabase/migrations/` (4 archivos).
4. **Documentación del proyecto:** `README.md`, `AGENTS.md`.
5. **Historial de Git:** commit `0b4882d` (2026-11-18).
6. **Configuración:** `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `supabase/config.toml`.

### Datos no verificables

- Fechas exactas de cada etapa de desarrollo (solo se cuenta con el commit del 2026-11-18 y los timestamps de las migraciones).
- Métricas de tiempo o esfuerzo invertido.
- Pruebas funcionales ejecutadas manualmente contra Supabase (no se registraron).
- URL de producción: https://sorteos-27mkmzsax-fermar-807.vercel.app/ (verificada y documentada).