Actúa como un Backend Engineer senior especializado en testing.

Quiero que implementes un sistema completo de testing para un backend existente con las siguientes características:

## 🧩 Stack del proyecto
- Runtime: Node.js
- Framework: Express
- Lenguaje: TypeScript
- Base de datos: PostgreSQL (usando Supabase, sin ORM)
- Arquitectura: Modular (controllers + services + repositories opcional)
- Endpoints: YA IMPLEMENTADOS

---

## 🎯 Objetivo

Implementar testing profesional usando Jest + Supertest sobre endpoints existentes, incluyendo:

- Configuración completa de testing
- Tests de integración sobre endpoints HTTP
- Tests de lógica (si aplica en services)
- Manejo de base de datos de testing (Supabase)
- Mocking de dependencias externas
- Cobertura mínima: 80%

---

## ⚙️ Requerimientos técnicos

### 1. Setup de entorno

- Instalar y configurar:
  - jest
  - ts-jest
  - supertest
  - @types/jest

- Crear:
  - jest.config.ts
  - tsconfig específico para testing (si es necesario)
  - script en package.json:
    - "test"
    - "test:watch"
    - "test:coverage"

---

### 2. Estructura de testing

Crear estructura profesional:

src/
  __tests__/
    setup.ts
    helpers/
    integration/
    services/ (si aplica)

---

### 3. Configuración global (setup)

- Crear setup global para:
  - conexión a base de datos de testing (Supabase)
  - limpieza de datos antes/después de tests
  - carga de variables de entorno (.env.test)

- Asegurar aislamiento entre tests (no compartir estado)

---

### 4. Testing de endpoints (PRIORIDAD ALTA)

Para los endpoints existentes (ej: appointments, auth, users):

Generar tests de integración usando Supertest que validen:

#### Casos positivos
- respuestas 200 / 201
- estructura del JSON
- persistencia correcta en base de datos

#### Casos negativos
- errores 400 (validaciones)
- errores 401/403 (auth)
- errores 404
- errores 500

#### Validaciones
- datos obligatorios
- formatos incorrectos
- edge cases

---

### 5. Base de datos (Supabase)

- NO usar mocks para DB principal
- Usar una DB de testing separada (schema o proyecto Supabase distinto)
- Antes de cada test:
  - limpiar tablas relevantes
- Después de cada test:
  - rollback lógico o limpieza

---

### 6. Autenticación

Si hay auth:

- testear:
  - login válido
  - token JWT
  - acceso a rutas protegidas
  - rechazo sin token

---

### 7. Mocking (solo cuando aplique)

Mockear:
- servicios externos (emails, APIs)
- funciones de tiempo si afectan lógica

NO mockear:
- lógica core
- base de datos principal

---

### 8. Cobertura

Configurar Jest coverage para medir:

- statements
- branches
- functions
- lines

Objetivo mínimo: 80%

---

## 📦 Output esperado

Quiero que generes:

1. Archivos de configuración completos
2. Setup global de testing
3. Tests reales sobre endpoints existentes (no ejemplos genéricos)
4. Helpers reutilizables (ej: crear usuario, auth token)
5. Scripts listos para ejecutar

---

## 🚨 Importante

- No expliques teoría
- No des ejemplos abstractos
- Trabajá directamente sobre un proyecto real
- Asumí buenas prácticas de producción
- Código limpio, tipado y mantenible

---

## 📌 Contexto funcional

El sistema es una agenda (gestión de citas), por lo tanto incluye:

- creación de citas
- consulta de citas
- validaciones de fechas
- posible manejo de zonas horarias

---

Implementá todo el sistema de testing listo para ejecutar.