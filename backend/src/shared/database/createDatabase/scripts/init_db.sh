#!/bin/bash

# Cargar variables de entorno si existe el archivo .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Validar que la URL de conexión exista
if [ -z "$DB_URL" ]; then
    echo "❌ Error: La variable DB_URL no está definida en el .env"
    exit 1
fi

echo "--- ⚖️ Sistema de Gestión de DB (Supabase) ---"
echo "1) Inicializar esquema y datos (Instalación limpia)"
echo "2) Solo limpiar datos (Truncate)"
echo "3) Borrar toda la estructura (Drop)"
echo "4) Salir"
read -p "Seleccione una opción: " OPCION

case $OPCION in
    1)
        echo "⏳ Inicializando esquema..."
        psql "$DB_URL" -f ../sql/01_schema.sql
        echo "⏳ Cargando datos de prueba (Seed)..."
        psql "$DB_URL" -f ../sql/02_seed.sql
        echo "✅ Base de datos lista."
        ;;
    2)
        echo "⚠️ Limpiando contenido de las tablas..."
        psql "$DB_URL" -f ../sql/03_clear_data.sql
        echo "✅ Datos eliminados."
        ;;
    3)
        echo "🔥 BORRANDO ESTRUCTURA COMPLETA..."
        psql "$DB_URL" -f ../sql/04_drop_all.sql
        echo "✅ Tablas eliminadas."
        ;;
    4)
        exit 0
        ;;
    *)
        echo "Opción no válida."
        ;;
esac