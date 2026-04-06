-- 1. Borramos primero las tablas que dependen de otras (Hijas)
DROP TABLE IF EXISTS T_APPOINTMENTS;
DROP TABLE IF EXISTS T_CONTACT;
DROP TABLE IF EXISTS T_VACATIONS;
DROP TABLE IF EXISTS T_WORKING_SCHEDULE;

-- 2. Borramos las tablas maestras (Padres)
DROP TABLE IF EXISTS T_LAWYERS;
DROP TABLE IF EXISTS T_CLIENTS;

-- Mensaje de confirmación
DO $$BEGIN RAISE NOTICE 'Estructura completa eliminada con éxito.'; END$$;