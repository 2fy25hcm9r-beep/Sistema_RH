-- Crear (si no existe) y seleccionar la base de datos
CREATE DATABASE IF NOT EXISTS sistema_rh
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_rh;

-- =============================================================
-- Tablas requeridas por Django (auth, sessions, contenttypes)
-- Se crean solo si no existen para no interferir con migrate
-- =============================================================

-- django_content_type
CREATE TABLE IF NOT EXISTS django_content_type (
    id          INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    app_label   VARCHAR(100)    NOT NULL,
    model       VARCHAR(100)    NOT NULL,
    UNIQUE KEY django_content_type_app_label_model (app_label, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- auth_permission
CREATE TABLE IF NOT EXISTS auth_permission (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    content_type_id INT             NOT NULL,
    codename        VARCHAR(100)    NOT NULL,
    UNIQUE KEY auth_permission_content_type_id_codename (content_type_id, codename),
    CONSTRAINT fk_auth_perm_ct FOREIGN KEY (content_type_id)
        REFERENCES django_content_type(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- auth_group
CREATE TABLE IF NOT EXISTS auth_group (
    id      INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(150)    NOT NULL,
    UNIQUE KEY auth_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- auth_group_permissions
CREATE TABLE IF NOT EXISTS auth_group_permissions (
    id              BIGINT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    group_id        INT     NOT NULL,
    permission_id   INT     NOT NULL,
    UNIQUE KEY auth_group_perm_uq (group_id, permission_id),
    CONSTRAINT fk_agp_group FOREIGN KEY (group_id)      REFERENCES auth_group(id)      ON DELETE CASCADE,
    CONSTRAINT fk_agp_perm  FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- django_session
CREATE TABLE IF NOT EXISTS django_session (
    session_key     VARCHAR(40)     NOT NULL PRIMARY KEY,
    session_data    LONGTEXT        NOT NULL,
    expire_date     DATETIME(6)     NOT NULL,
    KEY django_session_expire_date (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- django_admin_log (requerida por django.contrib.admin)
CREATE TABLE IF NOT EXISTS django_admin_log (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    action_time     DATETIME(6)     NOT NULL,
    object_id       LONGTEXT,
    object_repr     VARCHAR(200)    NOT NULL,
    action_flag     SMALLINT        NOT NULL CHECK (action_flag >= 0),
    change_message  LONGTEXT        NOT NULL,
    content_type_id INT             DEFAULT NULL,
    user_id         BIGINT          NOT NULL,
    CONSTRAINT fk_admin_log_ct   FOREIGN KEY (content_type_id) REFERENCES django_content_type(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- django_migrations (seguimiento de migraciones)
CREATE TABLE IF NOT EXISTS django_migrations (
    id          BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    app         VARCHAR(255)    NOT NULL,
    name        VARCHAR(255)    NOT NULL,
    applied     DATETIME(6)     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- MODULO: usuarios  (apps.usuarios)
-- =============================================================

CREATE TABLE IF NOT EXISTS usuarios_usuario (
    id              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    password        VARCHAR(128)    NOT NULL,
    last_login      DATETIME(6)     DEFAULT NULL,
    is_superuser    TINYINT         NOT NULL DEFAULT 0,
    username        VARCHAR(150)    NOT NULL,
    first_name      VARCHAR(150)    NOT NULL DEFAULT '',
    last_name       VARCHAR(150)    NOT NULL DEFAULT '',
    is_staff        TINYINT         NOT NULL DEFAULT 0,
    is_active       TINYINT         NOT NULL DEFAULT 1,
    date_joined     DATETIME(6)     NOT NULL,
    rol             VARCHAR(10)     NOT NULL DEFAULT 'visor'
                        COMMENT 'admin | rh | visor',
    UNIQUE KEY usuarios_usuario_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema (admin, RH, visor). Extiende AbstractUser.';

-- Tabla de relacion many-to-many Usuario <-> Grupo
CREATE TABLE IF NOT EXISTS usuarios_usuario_groups (
    id          BIGINT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id  BIGINT  NOT NULL,
    group_id    INT     NOT NULL,
    UNIQUE KEY uu_groups_uq (usuario_id, group_id),
    CONSTRAINT fk_uu_groups_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios_usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_uu_groups_group   FOREIGN KEY (group_id)   REFERENCES auth_group(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relacion many-to-many Usuario <-> Permission
CREATE TABLE IF NOT EXISTS usuarios_usuario_user_permissions (
    id              BIGINT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT  NOT NULL,
    permission_id   INT     NOT NULL,
    UNIQUE KEY uu_perm_uq (usuario_id, permission_id),
    CONSTRAINT fk_uu_perm_usuario FOREIGN KEY (usuario_id)   REFERENCES usuarios_usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_uu_perm_perm   FOREIGN KEY (permission_id) REFERENCES auth_permission(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- usuarios_empleado
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
    id                      BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero_empleado         VARCHAR(20)     NOT NULL
                                COMMENT 'Identificador unico del empleado (ej. EMP001)',
    nombre                  VARCHAR(100)    NOT NULL,
    apellido_paterno        VARCHAR(100)    NOT NULL,
    apellido_materno        VARCHAR(100)    NOT NULL DEFAULT '',
    sexo                    VARCHAR(1)      NOT NULL DEFAULT ''
                                COMMENT 'M = Masculino, F = Femenino',
    edad                    VARCHAR(10)     NOT NULL DEFAULT ''
                                COMMENT '15-19, 20-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65-69, 70+'
    estado_civil            VARCHAR(20)     NOT NULL DEFAULT ''
                                COMMENT 'casado, divorciado, soltero, viudo, union_libre',
    nivel_estudios          VARCHAR(30)     NOT NULL DEFAULT ''
                                COMMENT 'sin_formacion, primaria_terminada, primaria_incompleta, secundaria_terminada, secundaria_incompleta, preparatoria_terminada, preparatoria_incompleta, tecnico_terminada, tecnico_incompleta, licenciatura_terminada, licenciatura_incompleta, maestria_terminada, maestria_incompleta, doctorado_terminada, doctorado_incompleta',
    ocupacion               VARCHAR(200)    NOT NULL DEFAULT '',
    departamento            VARCHAR(200)    NOT NULL DEFAULT '',
    tipo_puesto             VARCHAR(20)     NOT NULL DEFAULT ''
                                COMMENT 'operativo, supervisor, profesional o tecnico, gerente',
    tipo_contratacion       VARCHAR(20)     NOT NULL DEFAULT ''
                                COMMENT 'obra_proyecto, indeterminado, determinado, honorarios',
    tipo_personal           VARCHAR(20)     NOT NULL DEFAULT ''
                                COMMENT 'sindicalizado, confianza, ninguno',
    tipo_jornada            VARCHAR(20)     NOT NULL DEFAULT ''
                                COMMENT 'nocturno, mixto, diurno',
    rotacion_turnos         VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    tiempo_puesto_actual    VARCHAR(10)     NOT NULL DEFAULT ''
                                COMMENT 'menos_6m, 6m_1a, 1_4a, 5_9a, 10_14a, 15_19a, 20_24a, 25a+',
    tiempo_experiencia      VARCHAR(10)     NOT NULL DEFAULT ''
                                COMMENT 'menos_6m, 6m_1a, 1_4a, 5_9a, 10_14a, 15_19a, 20_24a, 25a+',
    accidente_grave         VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    asalto                  VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    actos_violentos         VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    sequestro               VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    amenazas                VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    otro_riesgo_vida_salud  VARCHAR(2)      NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    recuerdos_recurrentes_malestar VARCHAR(2) NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    suenos_recurrentes_malestar VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    evitar_sentimientos_conversaciones VARCHAR(2) NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    evitar_actividades_lugares_personas VARCHAR(2) NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    dificultad_recordar_evento   VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    disminuye_interes_actividades VARCHAR(2)  NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    sensacion_alejamiento          VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    dificultad_expresar_sentimientos VARCHAR(2) NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    vida_futuro_limitado         VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    dificultad_dormir            VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    irritable_arranos_coraje     VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    dificultad_concentrarse      VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    nervioso_alerta              VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    sobresalta_facilmente        VARCHAR(2)   NOT NULL DEFAULT ''
                                COMMENT 'si, no',
    activo                       TINYINT         NOT NULL DEFAULT 1,
    puede_contestar_encuesta     TINYINT         NOT NULL DEFAULT 1
                                COMMENT 'TRUE = el empleado puede contestar encuestas de RH',
    fecha_alta                 DATE            NOT NULL,
    fecha_modificacion         DATETIME(6)     NOT NULL,
    UNIQUE KEY empleados_numero_empleado (numero_empleado),
    KEY idx_empleado_puede_contestar (puede_contestar_encuesta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Empleados de la empresa. Control de acceso a encuestas por numero de empleado.';

-- -------------------------------------------------------
-- usuarios_solicitudresetpassword
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_solicitudresetpassword (
    id              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    fecha_solicitud DATETIME(6)     NOT NULL,
    atendida        TINYINT         NOT NULL DEFAULT 0,
    usuario_id      BIGINT          NOT NULL,
    KEY usuarios_solicitudresetpassword_usuario_id (usuario_id),
    CONSTRAINT fk_usuarios_solicitudresetpassword_usuario_id FOREIGN KEY (usuario_id)
        REFERENCES usuarios_usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de reset de contraseña pendientes de atención por administrador';


-- =============================================================
-- MODULO: encuestas  (apps.encuestas)
-- =============================================================

-- -------------------------------------------------------
-- encuestas_encuesta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuestas_encuesta (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo              VARCHAR(200)    NOT NULL,
    descripcion         LONGTEXT        NOT NULL,
    estado              VARCHAR(10)     NOT NULL DEFAULT 'borrador'
                            COMMENT 'borrador | activa | cerrada',
    fecha_inicio        DATE            NOT NULL,
    fecha_fin           DATE            NOT NULL,
    creado_por_id       BIGINT          DEFAULT NULL,
    fecha_creacion      DATETIME(6)     NOT NULL,
    fecha_modificacion  DATETIME(6)     NOT NULL,
    KEY idx_encuesta_estado (estado),
    KEY idx_encuesta_fechas (fecha_inicio, fecha_fin),
    CONSTRAINT fk_encuesta_creado_por FOREIGN KEY (creado_por_id)
        REFERENCES usuarios_usuario(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Encuestas de evaluacion de RH.';

-- -------------------------------------------------------
-- encuestas_pregunta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuestas_pregunta (
    id              BIGINT              NOT NULL AUTO_INCREMENT PRIMARY KEY,
    encuesta_id     BIGINT              NOT NULL,
    texto           VARCHAR(500)        NOT NULL,
    tipo            VARCHAR(20)         NOT NULL DEFAULT 'escala'
                        COMMENT 'escala | opcion_multiple | si_no | texto_libre',
    tipo_puntuacion VARCHAR(10)         NOT NULL DEFAULT 'directa'
                        COMMENT 'directa | invertida',
    orden           SMALLINT UNSIGNED   NOT NULL DEFAULT 1,
    requerida       TINYINT             NOT NULL DEFAULT 1,
    UNIQUE KEY encuestas_pregunta_encuesta_orden (encuesta_id, orden),
    KEY idx_pregunta_encuesta (encuesta_id),
    CONSTRAINT fk_pregunta_encuesta FOREIGN KEY (encuesta_id)
        REFERENCES encuestas_encuesta(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Preguntas que conforman una encuesta.';

-- -------------------------------------------------------
-- encuestas_accesoencuesta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuestas_accesoencuesta (
    id                  BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    encuesta_id         BIGINT      NOT NULL,
    empleado_id         BIGINT      NOT NULL,
    puede_contestar     TINYINT     NOT NULL DEFAULT 1,
    fecha_asignacion    DATETIME(6) NOT NULL,
    UNIQUE KEY encuestas_acceso_uq (encuesta_id, empleado_id),
    KEY idx_acceso_encuesta  (encuesta_id),
    KEY idx_acceso_empleado  (empleado_id),
    CONSTRAINT fk_acceso_encuesta FOREIGN KEY (encuesta_id)
        REFERENCES encuestas_encuesta(id) ON DELETE CASCADE,
    CONSTRAINT fk_acceso_empleado FOREIGN KEY (empleado_id)
        REFERENCES usuarios_empleado(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Control de que empleados pueden contestar cada encuesta.';

-- -------------------------------------------------------
-- encuestas_respuestaencuesta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuestas_respuestaencuesta (
    id                        BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    encuesta_id               BIGINT          NOT NULL,
    empleado_id               BIGINT          NOT NULL,
    fecha_inicio_respuesta    DATETIME(6)     NOT NULL,
    fecha_completado          DATETIME(6)     DEFAULT NULL,
    completada                TINYINT         NOT NULL DEFAULT 0,
    puntaje_total             DECIMAL(5,2)    DEFAULT NULL,
    puntaje_condiciones_trabajo DECIMAL(5,2)  DEFAULT NULL,
    nivel_riesgo              VARCHAR(20)     DEFAULT NULL
                                COMMENT 'nulo | bajo | medio | alto | muy_alto',
    puntaje_normalizado       DECIMAL(5,2)    DEFAULT NULL
                                COMMENT 'Puntaje normalizado 0-100',
    KEY idx_respuesta_encuesta    (encuesta_id),
    KEY idx_respuesta_empleado    (empleado_id),
    KEY idx_respuesta_completada  (completada),
    KEY idx_respuesta_nivel_riesgo (nivel_riesgo),
    CONSTRAINT fk_respuesta_encuesta FOREIGN KEY (encuesta_id)
        REFERENCES encuestas_encuesta(id) ON DELETE CASCADE,
    CONSTRAINT fk_respuesta_empleado FOREIGN KEY (empleado_id)
        REFERENCES usuarios_empleado(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de la respuesta completa de un empleado a una encuesta.';

-- -------------------------------------------------------
-- encuestas_respuestapregunta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuestas_respuestapregunta (
    id                      BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    respuesta_encuesta_id   BIGINT      NOT NULL,
    pregunta_id             BIGINT      NOT NULL,
    valor_escala            SMALLINT    DEFAULT NULL
                                COMMENT 'Valor 1-5 para preguntas de tipo escala',
    texto_respuesta         LONGTEXT    NOT NULL DEFAULT '',
    UNIQUE KEY encuestas_resppregunta_uq (respuesta_encuesta_id, pregunta_id),
    KEY idx_resppregunta_respuesta (respuesta_encuesta_id),
    KEY idx_resppregunta_pregunta  (pregunta_id),
    CONSTRAINT fk_rp_respuesta_encuesta FOREIGN KEY (respuesta_encuesta_id)
        REFERENCES encuestas_respuestaencuesta(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_pregunta FOREIGN KEY (pregunta_id)
        REFERENCES encuestas_pregunta(id) ON DELETE CASCADE,
    CONSTRAINT chk_valor_escala CHECK (valor_escala BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Respuesta individual a cada pregunta de una encuesta.';

-- =============================================================
-- FK diferida: django_admin_log -> usuarios_usuario
-- (se agrega aqui porque la tabla ya fue creada antes)
-- =============================================================
ALTER TABLE django_admin_log
    ADD CONSTRAINT fk_admin_log_user
        FOREIGN KEY (user_id) REFERENCES usuarios_usuario(id) ON DELETE CASCADE;

-- =============================================================
-- VISTAS UTILES PARA REPORTES
-- =============================================================

-- Vista: progreso de cada encuesta
CREATE OR REPLACE VIEW v_progreso_encuesta AS
SELECT
    e.id                                            AS encuesta_id,
    e.titulo,
    e.estado,
    e.fecha_inicio,
    e.fecha_fin,
    COUNT(DISTINCT a.empleado_id)                   AS total_asignados,
    COUNT(DISTINCT CASE WHEN re.completada = 1
          THEN re.empleado_id END)                  AS total_respondidas,
    ROUND(
        COALESCE(
            COUNT(DISTINCT CASE WHEN re.completada = 1
                THEN re.empleado_id END) * 100.0
            / NULLIF(COUNT(DISTINCT a.empleado_id), 0),
        0), 1)                                      AS porcentaje_completado
FROM encuestas_encuesta e
LEFT JOIN encuestas_accesoencuesta   a  ON a.encuesta_id = e.id AND a.puede_contestar = 1
LEFT JOIN encuestas_respuestaencuesta re ON re.encuesta_id = e.id
GROUP BY e.id, e.titulo, e.estado, e.fecha_inicio, e.fecha_fin;

-- Vista: progreso mensual de respuestas
CREATE OR REPLACE VIEW v_progreso_mensual AS
SELECT
    DATE_FORMAT(re.fecha_completado, '%Y-%m-01')    AS periodo,
    COUNT(*)                                        AS total_respuestas,
    ROUND(AVG(re.puntaje_normalizado), 2)           AS puntaje_promedio
FROM encuestas_respuestaencuesta re
WHERE re.completada = 1
GROUP BY DATE_FORMAT(re.fecha_completado, '%Y-%m-01')
ORDER BY periodo;

-- Vista: promedio por pregunta (encuestas de escala)
CREATE OR REPLACE VIEW v_promedio_por_pregunta AS
SELECT
    p.encuesta_id,
    p.id                            AS pregunta_id,
    p.orden,
    p.texto                         AS pregunta,
    ROUND(AVG(rp.valor_escala), 2)  AS promedio,
    COUNT(rp.id)                    AS total_respuestas
FROM encuestas_respuestapregunta rp
JOIN encuestas_pregunta           p   ON p.id  = rp.pregunta_id
JOIN encuestas_respuestaencuesta  re  ON re.id = rp.respuesta_encuesta_id
WHERE re.completada = 1
  AND rp.valor_escala IS NOT NULL
GROUP BY p.encuesta_id, p.id, p.orden, p.texto;
