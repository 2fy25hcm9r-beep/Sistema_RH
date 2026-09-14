
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UsuarioManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('El nombre de usuario es obligatorio')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')
        return self.create_user(username, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('admin', 'Administrador'),
        ('rh', 'Recursos Humanos'),
        ('visor', 'Visor de Reportes'),
    ]
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    rol = models.CharField(max_length=10, choices=ROLES, default='visor')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.get_full_name()} ({self.username})'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()









class Empleado(models.Model):
    """
    Empleado de la empresa. Se identifica por su número de empleado.
    Solo los empleados con 'puede_contestar=True' podrán responder encuestas.
    """
    numero_empleado = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, default='')
    activo = models.BooleanField(default=True)
    puede_contestar_encuesta = models.BooleanField(
        default=True,
        help_text='Habilita al empleado para contestar encuestas de RH'
    )
    fecha_alta = models.DateField()
    fecha_modificacion = models.DateTimeField(auto_now=True)

    SEXO_OPCIONES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
    ]
    sexo = models.CharField(max_length=1, choices=SEXO_OPCIONES, blank=True, default='')

    EDAD_OPCIONES = [
        ('15-19', '15 - 19'),
        ('20-24', '20 - 24'),
        ('25-29', '25 - 29'),
        ('30-34', '30 - 34'),
        ('35-39', '35 - 39'),
        ('40-44', '40 - 44'),
        ('45-49', '45 - 49'),
        ('50-54', '50 - 54'),
        ('55-59', '55 - 59'),
        ('60-64', '60 - 64'),
        ('65-69', '65 - 69'),
        ('70+', '70 o más'),
    ]
    edad = models.CharField(max_length=10, choices=EDAD_OPCIONES, blank=True, default='')

    ESTADO_CIVIL_OPCIONES = [
        ('casado', 'Casado'),
        ('divorciado', 'Divorciado'),
        ('soltero', 'Soltero'),
        ('viudo', 'Viudo'),
        ('union_libre', 'Unión libre'),
    ]
    estado_civil = models.CharField(max_length=20, choices=ESTADO_CIVIL_OPCIONES, blank=True, default='')

    NIVEL_ESTUDIOS_OPCIONES = [
        ('sin_formacion', 'Sin formación'),
        ('primaria_terminada', 'Primaria Terminada'),
        ('primaria_incompleta', 'Primaria Incompleta'),
        ('secundaria_terminada', 'Secundaria Terminada'),
        ('secundaria_incompleta', 'Secundaria Incompleta'),
        ('preparatoria_terminada', 'Preparatoria o Bachillerato Terminada'),
        ('preparatoria_incompleta', 'Preparatoria o Bachillerato Incompleta'),
        ('tecnico_terminada', 'Técnico Superior Terminada'),
        ('tecnico_incompleta', 'Técnico Superior Incompleta'),
        ('licenciatura_terminada', 'Licenciatura Terminada'),
        ('licenciatura_incompleta', 'Licenciatura Incompleta'),
        ('maestria_terminada', 'Maestría Terminada'),
        ('maestria_incompleta', 'Maestría Incompleta'),
        ('doctorado_terminada', 'Doctorado Terminada'),
        ('doctorado_incompleta', 'Doctorado Incompleta'),
    ]
    nivel_estudios = models.CharField(max_length=30, choices=NIVEL_ESTUDIOS_OPCIONES, blank=True, default='')

    ocupacion = models.CharField(max_length=200, blank=True, default='')
    departamento = models.CharField(max_length=200, blank=True, default='')

    TIPO_PUESTO_OPCIONES = [
        ('operativo', 'Operativo'),
        ('supervisor', 'Supervisor'),
        ('profesional', 'Profesional o técnico'),
        ('gerente', 'Gerente'),
    ]
    tipo_puesto = models.CharField(max_length=20, choices=TIPO_PUESTO_OPCIONES, blank=True, default='')

    TIPO_CONTRATACION_OPCIONES = [
        ('obra_proyecto', 'Por obra o proyecto'),
        ('indeterminado', 'Tiempo indeterminado'),
        ('determinado', 'Por tiempo determinado (temporal)'),
        ('honorarios', 'Honorarios'),
    ]
    tipo_contratacion = models.CharField(max_length=20, choices=TIPO_CONTRATACION_OPCIONES, blank=True, default='')

    TIPO_PERSONAL_OPCIONES = [
        ('sindicalizado', 'Sindicalizado'),
        ('confianza', 'Confianza'),
        ('ninguno', 'Ninguno'),
    ]
    tipo_personal = models.CharField(max_length=20, choices=TIPO_PERSONAL_OPCIONES, blank=True, default='')

    TIPO_JORNADA_OPCIONES = [
        ('nocturno', 'Fijo nocturno (entre las 20:00 y 6:00 hrs)'),
        ('mixto', 'Fijo mixto (combinación de nocturno y diurno)'),
        ('diurno', 'Fijo diurno (entre las 6:00 y 20:00 hrs)'),
    ]
    tipo_jornada = models.CharField(max_length=20, choices=TIPO_JORNADA_OPCIONES, blank=True, default='')

    ROTACION_OPCIONES = [
        ('si', 'Sí'),
        ('no', 'No'),
    ]
    rotacion_turnos = models.CharField(max_length=2, choices=ROTACION_OPCIONES, blank=True, default='')

    TIEMPO_PUESTO_OPCIONES = [
        ('menos_6m', 'Menos de 6 meses'),
        ('6m_1a', 'Entre 6 meses y 1 año'),
        ('1_4a', 'Entre 1 a 4 años'),
        ('5_9a', 'Entre 5 a 9 años'),
        ('10_14a', 'Entre 10 a 14 años'),
        ('15_19a', 'Entre 15 a 19 años'),
        ('20_24a', 'Entre 20 a 24 años'),
        ('25a+', '25 años o más'),
    ]
    tiempo_puesto_actual = models.CharField(max_length=10, choices=TIEMPO_PUESTO_OPCIONES, blank=True, default='')
    tiempo_experiencia = models.CharField(max_length=10, choices=TIEMPO_PUESTO_OPCIONES, blank=True, default='')

    SI_NO_OPCIONES = [
        ('si', 'Sí'),
        ('no', 'No'),
    ]

    accidente_grave = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    asalto = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    actos_violentos = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    secuestro = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    amenazas = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    otro_riesgo_vida_salud = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')

    recuerdos_recurrentes_malestar = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    suenos_recurrentes_malestar = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    evitar_sentimientos_conversaciones = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    evitar_actividades_lugares_personas = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    dificultad_recordar_evento = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    disminuye_interes_actividades = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    sensacion_alejamiento = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    dificultad_expresar_sentimientos = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    vida_futuro_limitado = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    dificultad_dormir = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    irritable_arranos_coraje = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    dificultad_concentrarse = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    nervioso_alerta = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')
    sobresalta_facilmente = models.CharField(max_length=2, choices=SI_NO_OPCIONES, blank=True, default='')

    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['apellido_paterno', 'apellido_materno', 'nombre']

    def __str__(self):
        return f'[{self.numero_empleado}] {self.nombre} {self.apellido_paterno}'

    @property
    def nombre_completo(self):
        return f'{self.nombre} {self.apellido_paterno} {self.apellido_materno}'.strip()


class SolicitudResetPassword(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    atendida = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Solicitud de Reset de Contraseña'
        verbose_name_plural = 'Solicitudes de Reset de Contraseña'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f'Solicitud de {self.usuario.username} el {self.fecha_solicitud}'
