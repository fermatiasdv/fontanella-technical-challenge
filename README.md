# Fontanella Project

El módulo de desarrollo de citas permite crear, consultar, actualizar y eliminar citas entre abogados y clientes, aplicando un conjunto de validaciones de negocio antes de confirmar cualquier agendamiento. Al crear o modificar una cita, el sistema verifica que el horario solicitado caiga dentro del horario laboral configurado del abogado y que este no esté de vacaciones, que también respete la disponibilidad del cliente (lunes a viernes, 09:00–18:00 en su zona horaria), que ambas partes compartan un método de contacto compatible (y, en caso de citas presenciales, que se encuentren en la misma ciudad), y que el intervalo no se solape con citas ya existentes; todas las fechas se normalizan a UTC internamente para garantizar consistencia entre zonas horarias.

Este repositorio contiene el desarrollo del proyecto **Fontanella**, dividido en dos aplicaciones principales: un **Backend** (Node.js + Express + Supabase) y un **Client / Frontend** (React + Vite).

---

## Requisitos previos

- Node.js >= 20
- Cuenta y proyecto en Supabase (Se requerirá la URL y la llave `service-role`).

---

## Instalación de dependencias

El proyecto se divide en dos directorios principales: `backend` y `client`. Es necesario instalar las dependencias de forma separada para cada entorno.

```bash
# 1. Clonar el repositorio
git clone https://github.com/fermatiasdv/fontanella-technical-challenge.git fontanella
cd fontanella

# 2. Instalación de dependencias del Backend
cd backend
npm install

# 3. Instalación de dependencias del Client (Frontend)
cd ../client
npm install
```

---

## Configuración (Variables de entorno)

Ambos entornos requieren su propia configuración que se realiza mediante archivos `.env`.

### Configuración del Backend

Dirígete a la carpeta `backend` y crea un archivo `.env` basándote en el archivo de ejemplo y completando los datos conectando a la base de datos de Supabase.

```bash
cd backend
cp .env.example .env
```

**Variables principales en `backend/.env`**:
- `PORT`: Puerto donde correrá el backend (ej. `3000`).
- `NODE_ENV`: Entorno de ejecución (`development` o `production`).
- `SUPABASE_URL`: **(Requerido)** URL de tu proyecto de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: **(Requerido)** Clave `service-role` de tu proyecto de Supabase (no exponer en el frontend).
- `APP_TIMEZONE`: Zona horaria por defecto (ej. `America/Argentina/Buenos_Aires`).
- `APP_CORS_ORIGIN`: Orígenes permitidos (por defecto `*` para local).

### Configuración del Client (Frontend)

Dirígete a la carpeta `client` y crea un archivo `.env` propio que apunte a la API de tu backend.

```bash
cd client
echo "VITE_API_URL=http://localhost:3000" > .env
```

**Variables principales en `client/.env`**:
- `VITE_API_URL`: **(Requerido)** La URL del backend. En entorno local suele ser `http://localhost:3000`.

---

## Pasos para levantar la aplicación

Para ejecutar la aplicación localmente, debes levantar tanto el backend como el frontend en terminales separadas.

### 1. Iniciar el Backend
En una terminal, desde la raíz del proyecto, ejecuta:

```bash
cd backend
npm run dev
```
El servidor backend iniciará y, por defecto, estará disponible en `http://localhost:3000`.

### 2. Iniciar el Client (Frontend)
En otra terminal, desde la raíz del proyecto, ejecuta:

```bash
cd client
npm run dev
```
Vite iniciará el frontend en modo de desarrollo y proporcionará una URL local (generalmente `http://localhost:5173`). Puedes hacer clic en dicha URL o abrir el navegador manualmente.

---

## Material adicional

Para obtener una visión completa y detallada del funcionamiento interno del proyecto, te invitamos a consultar el siguiente documento. Encontrarás aspectos clave para entender los fundamentos del proyecto:

🔗 **[Ver Documentación en Notion (Arquitectura y Decisiones)](https://www.notion.so/335220f57c0d803cbbd1ecadfeacd206?v=33c220f57c0d80febe94000cdc1b835e&source=copy_link)**
