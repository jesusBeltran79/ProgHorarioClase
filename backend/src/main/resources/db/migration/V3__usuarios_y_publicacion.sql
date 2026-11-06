-- Módulo de usuarios. Dos perfiles. ADMIN gestiona todo y DOCENTE consulta su horario y declara
-- su disponibilidad. Un usuario DOCENTE queda ligado a un registro de la tabla docente.

ALTER TABLE usuario DROP CONSTRAINT ck_usuario_rol;
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_rol CHECK (rol IN ('ADMIN', 'DOCENTE'));
ALTER TABLE usuario ADD COLUMN id_docente VARCHAR(10);
ALTER TABLE usuario ADD CONSTRAINT fk_usuario_docente FOREIGN KEY (id_docente) REFERENCES docente (id_docente);
ALTER TABLE usuario ADD COLUMN activo BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_docente CHECK (rol = 'ADMIN' OR id_docente IS NOT NULL);

-- Solo un horario publicado a la vez. Es el que ven los docentes en su portal.
ALTER TABLE ejecucion_horario ADD COLUMN publicado BOOLEAN DEFAULT FALSE NOT NULL;
