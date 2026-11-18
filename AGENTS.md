# AGENTS.md — Instrucciones para agentes de IA

Este repositorio contiene **Sorteos App**. Cualquier agente de IA que trabaje aquí debe seguir estas reglas.

## Reglas generales

1. **Antes de realizar modificaciones, lee `README.md`** para entender la arquitectura, tecnologías y estado del proyecto.
2. **Respeta la arquitectura y las tecnologías definidas** en el README. No introduzcas frameworks o librerías nuevas sin justificación técnica.
3. **Mantén TypeScript estricto** (`strict: true`). No uses `any` sin justificación.
4. **Evita duplicar componentes y lógica.** Reutiliza lo existente.
5. **Prioriza soluciones sencillas** y fáciles de entender.
6. **No instales dependencias innecesarias.**
7. **No modifiques archivos de configuración** (`tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, etc.) sin justificación clara.
8. **Respeta las reglas de negocio documentadas** en el README (estados de eventos, modificaciones solo en Borrador, un premio por participante, etc.).
9. **Actualiza el README** cuando se implementen cambios importantes.
10. **Explica qué archivos modificaste y por qué** al finalizar una tarea.
11. **Ejecuta las verificaciones correspondientes** (`npm run lint`, `npm run build`) antes de dar por terminada una tarea.
12. **No implementes funcionalidades adicionales** que no hayan sido solicitadas.

## Estado actual del proyecto

- Infraestructura técnica implementada (Next.js 16, TypeScript, Tailwind CSS 4, Supabase SSR, Lucide React, ESLint).
- Base de datos PostgreSQL en Supabase con cuatro migraciones aplicadas: tablas, RLS/políticas, triggers y funciones RPC para participantes.
- Autenticación administrativa implementada (Supabase Auth, proxy, login/logout, validación de perfil admin).
- Módulo de eventos implementado: listado y creación de eventos en `/admin/eventos`.
- Módulo de participantes implementado: listado, creación, edición, eliminación y exportación CSV por evento en `/admin/participantes`.
- Módulo de premios implementado: listado, creación, edición y eliminación por evento en `/admin/premios`, con indicador comparativo y estado de canjes.
- Gestión de estado de eventos implementada: activación (Borrador→Activo), desactivación (Activo→Inactivo) y reactivación (Inactivo→Activo) en `/admin/eventos`.
- Generación única de códigos de 9 caracteres para participantes al activar un evento (visualización y copia en `/admin/participantes`).
- Vista funcional del participante implementada en `/participante` (consulta de sorteo, selección de casilla, canje y revelación de premio).
- Pantalla de inicio (`/`) implementada con acceso rápido por código y enlace a administración.
- Rutas restantes: ninguna placeholder (todas las rutas principales implementadas).

## Restricciones de la etapa actual

En esta etapa NO se deben implementar sin autorización expresa:

- Dashboard administrativo completo.
- Nuevas tablas, migraciones, políticas RLS, funciones o triggers (salvo autorización expresa; se creó una migración de RPCs para participantes).
- Modificación de las migraciones ya aplicadas.

## Estructura esperada

Mantén la organización de `src/` descrita en el README. No concentres todo el código en un único archivo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
