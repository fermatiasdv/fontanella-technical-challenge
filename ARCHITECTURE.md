1. Overview
Este documento define los estándares técnicos, patrones de diseño y flujos de trabajo para el desarrollo del MVP. El objetivo es garantizar un sistema escalable, con tipado fuerte y manejo consistente de datos temporales.

2. Technical Stack & Skills Selection
Se han seleccionado los siguientes principios de backend-architecture y frontend-best-practices:

Backend (Node.js + Express + TypeScript)
Layered Architecture: Separación estricta en Routes, Controllers, Services y DataAccess.

Time-Consistency Skill: Validación obligatoria de husos horarios.

Uso de UTC como estándar de almacenamiento.

Integración con timeapi.io para sincronización externa de red.

Type-Safe Persistence: Integración con Supabase (PostgreSQL) utilizando tipos generados automáticamente para evitar inconsistencias entre DB y API.

Frontend (React + TypeScript + SASS)
Atomic Design (Simplified): Organización de componentes por responsabilidad (atoms, molecules, templates).

State Integrity: Uso de hooks personalizados para persistencia de estado y sincronización con el servidor.

Hierarchical Styling: Uso de SASS con arquitectura 7-1, priorizando variables globales y mixins para escalabilidad visual.

3. Project Structure
Plaintext
/
├── ARCHITECTURE.md          # Este documento
├── .github/workflows/       # CI/CD (GitHub Actions)
├── client/                  # Frontend (Azure Static Web Apps)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/          # SASS hierarchized design
│   │   └── types/
├── backend/                 # Backend (Azure App Service)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/        # Business logic & timeapi.io integration
│   │   ├── middleware/      # Global error & timezone validation
│   │   └── config/          # Supabase & Env variables
└── database/                # Supabase/PostgreSQL schemas & RLS policies
4. Time & Data Integrity Strategy
Dada la complejidad de los múltiples husos horarios:

Ingreso: Todas las fechas recibidas se validan y convierten a objeto Date de TS.

Validación: Se consulta timeapi.io para procesos críticos que requieran una estampa de tiempo de servidor (Server-side Truth).

Almacenamiento: PostgreSQL almacenará todo en TIMESTAMPTZ para asegurar que el offset se conserve o se normalice a UTC.

5. Development Workflow (GitFlow & Standards)
Para asegurar la trazabilidad con Jira, se implementa la siguiente política de Git:

Branching Model
main: Producción.

develop: Integración de features.

feature/JIRA-ID-description: Desarrollo de nuevas funcionalidades.

fix/JIRA-ID-description: Corrección de errores.

chore/description: Tareas de mantenimiento o configuración.

Commit Convention
Cada commit debe seguir el formato:
<tipo>(scope): [JIRA-ID] descripción breve

Ejemplo: feat(auth): [PROJ-123] implement supabase auth provider

6. Infrastructure & Deployment (CI/CD)
El despliegue está automatizado mediante GitHub Actions:

Frontend: Despliegue automático a Azure Static Web Apps tras merge en main.

Backend: Despliegue a Azure App Service con validación previa de tipos de TypeScript.

Database: Gestión de esquemas a través del dashboard/CLI de Supabase.

7. AI Instructions (System Prompting)
Instrucción para la IA: Al generar código para este proyecto, prioriza siempre la robustez del tipado. No omitas validaciones de tipos en los servicios. Si una función maneja fechas, asegúrate de incluir lógica de normalización UTC. Sigue el patrón de carpetas definido en la sección 3.