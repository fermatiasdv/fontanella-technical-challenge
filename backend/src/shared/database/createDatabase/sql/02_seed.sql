-- =============================================
-- SEED DATA: T_LAWYERS (5 Abogados)
-- =============================================
INSERT INTO T_LAWYERS (NATIONAL_ID, FULL_NAME, LOCATION, TIMEZONE) VALUES
('LAW-001', 'Harvey Specter', 'New York, USA', 'America/New_York'),
('LAW-002', 'Mike Ross', 'New York, USA', 'America/New_York'),
('LAW-003', 'Alicia Florrick', 'Chicago, USA', 'America/Chicago'),
('LAW-004', 'Saul Goodman', 'Albuquerque, USA', 'America/Denver'),
('LAW-005', 'Kim Wexler', 'Albuquerque, USA', 'America/Denver');

-- =============================================
-- SEED DATA: T_CLIENTS (5 Clientes)
-- =============================================
INSERT INTO T_CLIENTS (COMPANY_ID, TRADE_NAME, LOCATION, TIMEZONE) VALUES
('CORP-101', 'Stark Industries', 'Los Angeles, USA', 'America/Los_Angeles'),
('CORP-102', 'Wayne Enterprises', 'Gotham, USA', 'America/New_York'),
('CORP-103', 'Hooli', 'Palo Alto, USA', 'America/Los_Angeles'),
('CORP-104', 'Los Pollos Hermanos', 'Albuquerque, USA', 'America/Denver'),
('CORP-105', 'Dunder Mifflin', 'Scranton, USA', 'America/New_York');

-- =============================================
-- SEED DATA: T_WORKING_SCHEDULE (Horarios por Abogado)
-- =============================================
INSERT INTO T_WORKING_SCHEDULE (ID_LAWYER, DAY_OF_WEEK, START_TIME, END_TIME) VALUES
(1, 'Monday', '09:00:00', '18:00:00'), (1, 'Tuesday', '09:00:00', '18:00:00'),
(2, 'Wednesday', '08:00:00', '17:00:00'), (2, 'Thursday', '08:00:00', '17:00:00'),
(3, 'Monday', '10:00:00', '19:00:00'), (4, 'Friday', '09:00:00', '21:00:00'),
(5, 'Monday', '08:30:00', '16:30:00');

-- =============================================
-- SEED DATA: T_VACATIONS (Historial y Futuras)
-- =============================================
INSERT INTO T_VACATIONS (ID_LAWYER, START_DATE, END_DATE) VALUES
(1, '2026-01-01', '2026-01-15'), -- Pasadas
(2, '2026-07-10', '2026-07-25'), -- Futuras
(3, '2026-12-20', '2027-01-05'),
(4, '2026-03-01', '2026-03-07');

-- =============================================
-- SEED DATA: T_CONTACT (10 Contactos Mix Abogados/Clientes)
-- =============================================
INSERT INTO T_CONTACT (ID_LAWYER, ID_CLIENT, METHOD_TYPE, VALUE, IS_DEFAULT) VALUES
(1, NULL, 'VideoCall', 'https://zoom.us/j/specter-legal', true),
(2, NULL, 'PhoneCall', '+1-555-0102', true),
(NULL, 1, 'InPerson', 'Stark Tower Floor 90', true),
(NULL, 2, 'VideoCall', 'https://meet.google.com/wayne-corp', true),
(3, NULL, 'InPerson', '123 Michigan Ave, Chicago', true),
(NULL, 3, 'PhoneCall', '+1-555-9876', true),
(4, NULL, 'PhoneCall', '+1-505-123-456', true),
(5, NULL, 'VideoCall', 'https://kim-wexler.law/meeting', true),
(NULL, 4, 'InPerson', '1200 Venetti Drive', true),
(NULL, 5, 'PhoneCall', '+1-570-555-1212', true);

-- =============================================
-- SEED DATA: T_APPOINTMENTS (10 Citas con lógica de negocio)
-- =============================================
INSERT INTO T_APPOINTMENTS (SUBJECT, DESCRIPTION, START_DATETIME, END_DATETIME, ID_LAWYER, ID_CLIENT, ID_SELECTED_CONTACT) VALUES
('Contrato de Confidencialidad', 'Revisión inicial de términos', '2026-05-10 10:00:00+00', '2026-05-10 11:30:00+00', 1, 1, 3),
('Fusión de Empresas', 'Discusión sobre adquisición de Hooli', '2026-05-11 14:00:00+00', '2026-05-11 16:00:00+00', 1, 3, 1),
('Defensa Criminal', 'Preparación para el juicio', '2026-05-12 09:00:00+00', '2026-05-12 11:00:00+00', 4, 4, 7),
('Derechos de Autor', 'Logotipo de Wayne Ent.', '2026-05-13 15:00:00+00', '2026-05-13 16:00:00+00', 3, 2, 4),
('Litigio Civil', 'Caso Dunder Mifflin vs Vance Refrigeration', '2026-05-14 11:00:00+00', '2026-05-14 12:30:00+00', 5, 5, 8),
('Reunión Estratégica', 'Nuevos socios', '2026-05-15 09:30:00+00', '2026-05-15 10:30:00+00', 2, 2, 2),
('Auditoría Interna', 'Revisión de libros', '2026-05-16 13:00:00+00', '2026-05-16 15:00:00+00', 1, 5, 10),
('Consultoría de Patentes', 'Nueva tecnología Arc', '2026-05-17 10:00:00+00', '2026-05-17 12:00:00+00', 3, 1, 5),
('Cierre de Venta', 'Terrenos Albuquerque', '2026-05-18 16:00:00+00', '2026-05-18 17:30:00+00', 4, 4, 9),
('Seguimiento Mensual', 'Actualización de estatus', '2026-05-19 08:00:00+00', '2026-05-19 09:00:00+00', 2, 3, 6);