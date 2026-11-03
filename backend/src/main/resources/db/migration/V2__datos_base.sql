-- Catálogos y valores por defecto (S-04). El usuario administrador lo crea la aplicación
-- al arrancar para guardar la contraseña con bcrypt.

INSERT INTO caracteristica (id_caracteristica, descripcion) VALUES
    ('COMPUTADORES', 'Aula con computadores'),
    ('SILLAS_MOVILES', 'Aula con sillas móviles');

INSERT INTO restriccion (codigo, tipo, descripcion) VALUES
    ('RD-01', 'DURA', 'El docente ya tiene otra sesión en esa franja'),
    ('RD-02', 'DURA', 'El aula ya tiene otra sesión en esa franja'),
    ('RD-03', 'DURA', 'La franja no pertenece a la grilla de franjas válidas'),
    ('RD-04', 'DURA', 'El docente no está disponible en esa franja o no está habilitado para el curso'),
    ('RD-05', 'DURA', 'El aula no tiene las características que exige el curso'),
    ('RD-06', 'DURA', 'La capacidad del aula es menor que los matriculados del grupo'),
    ('RD-07', 'DURA', 'El curso debe tener entre 1 y MAX_SESIONES sesiones semanales'),
    ('RD-08', 'DURA', 'Toda sesión debe quedar asignada para que el horario sea válido'),
    ('RD-10', 'DURA', 'Las sesiones de un grupo deben tener el mismo docente'),
    ('RV-01', 'VALIDACION', 'El grupo supera el tope de matriculados con su tolerancia'),
    ('RV-02', 'VALIDACION', 'El grupo tiene menos matriculados que el mínimo y se marca para cierre');

INSERT INTO parametro_configuracion (clave, valor, tipo_dato) VALUES
    ('CAP_MAX', '40', 'ENTERO'),
    ('TOL', '0.10', 'DECIMAL'),
    ('MIN_CIERRE', '10', 'ENTERO'),
    ('MAX_SESIONES', '4', 'ENTERO'),
    ('DUR_SESION', '2', 'ENTERO'),
    ('APERTURA_SEMANA', '07:00', 'HORA'),
    ('CIERRE_SEMANA', '22:00', 'HORA'),
    ('CIERRE_SABADO', '13:00', 'HORA'),
    ('INICIO_BLOQUEO', '12:00', 'HORA'),
    ('FIN_BLOQUEO', '13:00', 'HORA');
