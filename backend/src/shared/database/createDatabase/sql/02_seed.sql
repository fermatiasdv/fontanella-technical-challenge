-- =============================================
-- SEED DATA: T_LAWYERS (5 Abogados)
-- =============================================
INSERT INTO T_LAWYERS (NATIONAL_ID, FULL_NAME, LOCATION, TIMEZONE) VALUES
('12001', 'Harvey Specter',  'New York, USA',    'America/New_York'),
('97002', 'Mike Ross',       'New York, USA',    'America/New_York'),
('97003', 'Alicia Florrick', 'Chicago, USA',     'America/Chicago'),
('97004', 'Saul Goodman',    'Albuquerque, USA', 'America/Denver'),
('97005', 'Kim Wexler',      'Albuquerque, USA', 'America/Denver');

-- =============================================
-- SEED DATA: T_CLIENTS (5 Clientes)
-- =============================================
INSERT INTO T_CLIENTS (COMPANY_ID, TRADE_NAME, LOCATION, TIMEZONE) VALUES
('CORP-101', 'Stark Industries',    'Los Angeles, USA', 'America/Los_Angeles'),
('CORP-102', 'Wayne Enterprises',   'Gotham, USA',      'America/New_York'),
('CORP-103', 'Hooli',               'Palo Alto, USA',   'America/Los_Angeles'),
('CORP-104', 'Los Pollos Hermanos', 'Albuquerque, USA', 'America/Denver'),
('CORP-105', 'Dunder Mifflin',      'Scranton, USA',    'America/New_York');

-- =============================================
-- SEED DATA: T_WORKING_SCHEDULE (Horarios por Abogado)
-- =============================================
INSERT INTO T_WORKING_SCHEDULE (ID_LAWYER, DAY_OF_WEEK, START_TIME, END_TIME) VALUES
(1, 'Monday',    '09:00:00', '18:00:00'),
(1, 'Tuesday',   '09:00:00', '18:00:00'),
(2, 'Wednesday', '08:00:00', '17:00:00'),
(2, 'Thursday',  '08:00:00', '17:00:00'),
(3, 'Monday',    '10:00:00', '19:00:00'),
(4, 'Friday',    '09:00:00', '21:00:00'),
(5, 'Monday',    '08:30:00', '16:30:00');

-- =============================================
-- SEED DATA: T_VACATIONS (Historial y Futuras)
-- =============================================
INSERT INTO T_VACATIONS (ID_LAWYER, START_DATE, END_DATE) VALUES
(1, '2026-01-01', '2026-01-15'), -- Pasadas
(2, '2026-07-10', '2026-07-25'), -- Futuras
(3, '2026-12-20', '2027-01-05'),
(4, '2026-03-01', '2026-03-07');

-- =============================================
-- SEED DATA: T_CONTACT (20 Contactos — 2 por cada lawyer y client)
--
-- REGLAS APLICADAS:
--   1. InPerson usa SOLO ciudades válidas del enum IN_PERSON_CITIES
--      definido en ContactMethodsSection.tsx:
--      ['Buenos Aires','Santiago','Madrid','Ciudad de México','Tokyo',
--       'Prusia','New York','London','São Paulo','Paris']
--   2. Cada entidad tiene exactamente 1 contacto IS_DEFAULT = true.
--   3. IDs asignados en orden de inserción (SERIAL comienza en 1).
--
-- MAPA DE IDs:
--   Lawyer 1 (Harvey)  → VideoCall(1), InPerson 'New York'(2)
--   Lawyer 2 (Mike)    → PhoneCall(3), VideoCall(4)
--   Lawyer 3 (Alicia)  → InPerson 'New York'(5), PhoneCall(6)
--   Lawyer 4 (Saul)    → PhoneCall(7), InPerson 'Madrid'(8)
--   Lawyer 5 (Kim)     → VideoCall(9), PhoneCall(10)
--   Client 1 (Stark)   → InPerson 'New York'(11), VideoCall(12)
--   Client 2 (Wayne)   → VideoCall(13), PhoneCall(14)
--   Client 3 (Hooli)   → PhoneCall(15), VideoCall(16)
--   Client 4 (LPH)     → PhoneCall(17), InPerson 'Madrid'(18)
--   Client 5 (Dunder)  → PhoneCall(19), VideoCall(20)
-- =============================================

-- Lawyer 1 — Harvey Specter
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(1, NULL, 'VideoCall', 'https://zoom.us/j/specter-legal', true),   -- ID 1
(1, NULL, 'InPerson',  'New York',                        false);  -- ID 2

-- Lawyer 2 — Mike Ross
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(2, NULL, 'PhoneCall', '+1-555-0102',                 true),   -- ID 3
(2, NULL, 'VideoCall', 'https://zoom.us/j/mike-ross', false);  -- ID 4

-- Lawyer 3 — Alicia Florrick
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(3, NULL, 'InPerson',  'New York',        true),   -- ID 5
(3, NULL, 'PhoneCall', '+1-312-555-0103', false);  -- ID 6

-- Lawyer 4 — Saul Goodman
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(4, NULL, 'PhoneCall', '+1-505-123-4560', true),   -- ID 7
(4, NULL, 'InPerson',  'Madrid',          false);  -- ID 8

-- Lawyer 5 — Kim Wexler
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(5, NULL, 'VideoCall', 'https://kim-wexler.law/meeting', true),   -- ID 9
(5, NULL, 'PhoneCall', '+1-505-555-0105',                false);  -- ID 10

-- Client 1 — Stark Industries
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(NULL, 1, 'InPerson',  'New York',                           true),   -- ID 11
(NULL, 1, 'VideoCall', 'https://zoom.us/j/stark-industries', false);  -- ID 12

-- Client 2 — Wayne Enterprises
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(NULL, 2, 'VideoCall', 'https://meet.google.com/wayne-corp', true),   -- ID 13
(NULL, 2, 'PhoneCall', '+1-555-0202',                        false);  -- ID 14

-- Client 3 — Hooli
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(NULL, 3, 'PhoneCall', '+1-555-9876',              true),   -- ID 15
(NULL, 3, 'VideoCall', 'https://zoom.us/j/hooli',  false);  -- ID 16

-- Client 4 — Los Pollos Hermanos
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(NULL, 4, 'PhoneCall', '+1-505-555-0404', true),   -- ID 17
(NULL, 4, 'InPerson',  'Madrid',          false);  -- ID 18

-- Client 5 — Dunder Mifflin
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(NULL, 5, 'PhoneCall', '+1-570-555-1212',               true),   -- ID 19
(NULL, 5, 'VideoCall', 'https://zoom.us/j/dunder-mifflin', false); -- ID 20

-- =============================================
-- SEED DATA: T_APPOINTMENTS (10 Citas)
--
-- REGLAS APLICADAS:
--   1. ID_LAWYER e ID_CLIENT referencian registros reales de sus tablas.
--   2. ID_SELECTED_CONTACT pertenece SIEMPRE al lawyer o al client del turno.
--   3. Las fechas caen en días hábiles de cada abogado (ver T_WORKING_SCHEDULE)
--      y los horarios UTC respetan sus franjas locales.
--   4. (*) marca turnos donde lawyer y client comparten el mismo METHOD_TYPE,
--      cubriendo el caso de "métodos de contacto iguales entre partes".
--
-- CALENDARIO Mayo 2026 (días laborales usados):
--   Lunes   11, 18 → L1(Harvey), L3(Alicia), L5(Kim)
--   Martes  12, 19 → L1(Harvey)
--   Miérc.  13, 20 → L2(Mike)
--   Jueves  14, 21 → L2(Mike)
--   Viernes 15, 22 → L4(Saul)
--
-- ZONAS HORARIAS (DST de Mayo):
--   New York  = UTC-4  |  Chicago = UTC-5  |  Denver/Albuquerque = UTC-6
-- =============================================
INSERT INTO T_APPOINTMENTS (SUBJECT, DESCRIPTION, START_DATETIME, END_DATETIME, ID_LAWYER, ID_CLIENT, ID_SELECTED_CONTACT) VALUES

-- 1. Harvey(L1) + Stark(C1): ambos tienen InPerson 'New York' → (*)
--    Usa contact del lawyer [ID 2]. C1 también tiene InPerson 'New York' [ID 11].
--    Lun 11-May, 09:00-10:30 NY = 13:00-14:30 UTC
('Contrato de Confidencialidad', 'Revisión inicial NDA — reunión presencial NY',
 '2026-05-11 13:00:00+00', '2026-05-11 14:30:00+00', 1, 1, 2),

-- 2. Harvey(L1) + Hooli(C3): ambos tienen VideoCall → (*)
--    Usa VideoCall del lawyer [ID 1]. C3 también tiene VideoCall [ID 16].
--    Lun 11-May, 14:00-16:00 NY = 18:00-20:00 UTC
('Fusión de Empresas', 'Discusión sobre adquisición de Hooli',
 '2026-05-11 18:00:00+00', '2026-05-11 20:00:00+00', 1, 3, 1),

-- 3. Alicia(L3) + Wayne(C2): ambos tienen PhoneCall → (*)
--    Usa PhoneCall del client [ID 14]. L3 también tiene PhoneCall [ID 6].
--    Lun 11-May, 10:00-11:00 Chicago = 15:00-16:00 UTC
('Derechos de Autor', 'Logotipo de Wayne Enterprises',
 '2026-05-11 15:00:00+00', '2026-05-11 16:00:00+00', 3, 2, 14),

-- 4. Kim(L5) + Dunder(C5): ambos tienen VideoCall y PhoneCall → (*)
--    Usa VideoCall del lawyer [ID 9]. C5 también tiene VideoCall [ID 20].
--    Lun 11-May, 08:30-10:00 Albuquerque = 14:30-16:00 UTC
('Litigio Civil', 'Caso Dunder Mifflin vs Vance Refrigeration',
 '2026-05-11 14:30:00+00', '2026-05-11 16:00:00+00', 5, 5, 9),

-- 5. Mike(L2) + Wayne(C2): ambos tienen PhoneCall → (*)
--    Usa PhoneCall del lawyer [ID 3]. C2 también tiene PhoneCall [ID 14].
--    Miérc 13-May, 09:30-10:30 NY = 13:30-14:30 UTC
('Reunión Estratégica', 'Nuevos socios Wayne Enterprises',
 '2026-05-13 13:30:00+00', '2026-05-13 14:30:00+00', 2, 2, 3),

-- 6. Mike(L2) + Hooli(C3): ambos tienen VideoCall y PhoneCall → (*)
--    Usa VideoCall del client [ID 16]. L2 también tiene VideoCall [ID 4].
--    Jueves 14-May, 08:00-09:30 NY = 12:00-13:30 UTC
('Propiedad Intelectual', 'Revisión de patentes de software Hooli',
 '2026-05-14 12:00:00+00', '2026-05-14 13:30:00+00', 2, 3, 16),

-- 7. Saul(L4) + LPH(C4): ambos tienen PhoneCall → (*)
--    Usa PhoneCall del lawyer [ID 7]. C4 también tiene PhoneCall [ID 17].
--    Viern 15-May, 09:00-11:00 Albuquerque = 15:00-17:00 UTC
('Defensa Criminal', 'Preparación para el juicio',
 '2026-05-15 15:00:00+00', '2026-05-15 17:00:00+00', 4, 4, 7),

-- 8. Saul(L4) + LPH(C4): ambos tienen InPerson 'Madrid' → (*)
--    Usa InPerson del client [ID 18]. L4 también tiene InPerson 'Madrid' [ID 8].
--    Viern 22-May, 10:00-11:30 Albuquerque = 16:00-17:30 UTC
('Cierre de Venta', 'Terrenos y propiedades — reunión presencial Madrid',
 '2026-05-22 16:00:00+00', '2026-05-22 17:30:00+00', 4, 4, 18),

-- 9. Alicia(L3) + Stark(C1): ambos tienen InPerson 'New York' → (*)
--    Usa InPerson del lawyer [ID 5]. C1 también tiene InPerson 'New York' [ID 11].
--    Lun 18-May, 10:00-12:00 Chicago = 15:00-17:00 UTC
('Consultoría de Patentes', 'Nueva tecnología Arc Reactor — reunión presencial NY',
 '2026-05-18 15:00:00+00', '2026-05-18 17:00:00+00', 3, 1, 5),

-- 10. Harvey(L1) + Dunder(C5): usa PhoneCall del client [ID 19]
--     Martes 12-May, 13:00-15:00 NY = 17:00-19:00 UTC
('Auditoría Interna', 'Revisión de libros contables Dunder Mifflin',
 '2026-05-12 17:00:00+00', '2026-05-12 19:00:00+00', 1, 5, 19);
