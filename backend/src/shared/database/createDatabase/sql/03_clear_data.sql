-- El orden importa por las Foreign Keys, o usamos CASCADE
-- RESTART IDENTITY resetea los números de ID a 1
TRUNCATE TABLE 
    T_APPOINTMENTS, 
    T_CONTACT, 
    T_VACATIONS, 
    T_WORKING_SCHEDULE, 
    T_LAWYERS, 
    T_CLIENTS 
RESTART IDENTITY CASCADE;

-- Mensaje de confirmación para el log
DO $$BEGIN RAISE NOTICE 'Datos eliminados y secuencias reiniciadas.'; END$$;