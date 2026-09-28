-- Inicialización de la base de datos EPSEL Papeletas
-- Este script se ejecuta una sola vez al crear el contenedor de PostgreSQL

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Para búsquedas de texto rápidas

-- Comentario de auditoría
COMMENT ON DATABASE epsel_papeletas IS 'Base de datos del Sistema de Autorización de Salida de Practicantes — EPSEL S.A.';
