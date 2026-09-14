from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.usuarios.models import Empleado, Usuario


class Encuesta(models.Model):
    ESTADO = [
        ('borrador', 'Borrador'),
        ('activa', 'Activa'),
        ('cerrada', 'Cerrada'),
    ]
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default='')
    estado = models.CharField(max_length=10, choices=ESTADO, default='borrador')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='encuestas_creadas'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Encuesta'
        verbose_name_plural = 'Encuestas'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.titulo

    @property
    def total_asignados(self):
        return self.accesos.filter(puede_contestar=True).count()

    @property
    def total_respondidas(self):
        return self.respuestas.filter(completada=True).count()

    @property
    def porcentaje_completado(self):
        asignados = self.total_asignados
        if asignados == 0:
            return 0
        return round((self.total_respondidas / asignados) * 100, 1)


class Pregunta(models.Model):
    TIPOS = [
        ('escala', 'Escala (1-5)'),
        ('opcion_multiple', 'Opción Múltiple'),
        ('si_no', 'Sí / No'),
        ('texto_libre', 'Texto Libre'),
    ]
    TIPO_PUNTUACION = [
        ('directa', 'Directa'),
        ('invertida', 'Invertida'),
    ]
    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='preguntas'
    )
    texto = models.CharField(max_length=500)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='escala')
    tipo_puntuacion = models.CharField(max_length=10, choices=TIPO_PUNTUACION, default='directa', help_text='Directa: Siempre=4, Nunca=0. Invertida: Siempre=0, Nunca=4')
    orden = models.PositiveSmallIntegerField(default=1)
    requerida = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        ordering = ['encuesta', 'orden']
        unique_together = [['encuesta', 'orden']]

    def __str__(self):
        return f'[{self.encuesta}] P{self.orden}: {self.texto[:60]}'


class AccesoEncuesta(models.Model):
    """Controla qué empleados tienen acceso a contestar una encuesta específica."""
    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='accesos'
    )
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.CASCADE,
        related_name='accesos_encuestas'
    )
    puede_contestar = models.BooleanField(default=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Acceso a Encuesta'
        verbose_name_plural = 'Accesos a Encuestas'
        unique_together = [['encuesta', 'empleado']]

    def __str__(self):
        estado = 'habilitado' if self.puede_contestar else 'deshabilitado'
        return f'{self.empleado} → {self.encuesta} [{estado}]'


class RespuestaEncuesta(models.Model):
    """Registro de la respuesta completa de un empleado a una encuesta."""
    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='respuestas'
    )
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.CASCADE,
        related_name='respuestas_encuestas'
    )
    fecha_inicio_respuesta = models.DateTimeField(auto_now_add=True)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    completada = models.BooleanField(default=False)
    puntaje_total = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    puntaje_condiciones_trabajo = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Puntaje de las 30 preguntas de condiciones de trabajo")
    nivel_riesgo = models.CharField(max_length=20, null=True, blank=True, choices=[("nulo", "Nulo"), ("bajo", "Bajo"), ("medio", "Medio"), ("alto", "Alto"), ("muy_alto", "Muy Alto")])
    puntaje_normalizado = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Puntaje normalizado 0-100")

    class Meta:
        verbose_name = 'Respuesta de Encuesta'
        verbose_name_plural = 'Respuestas de Encuestas'

    def __str__(self):
        return f'{self.empleado} - {self.encuesta} ({"completada" if self.completada else "pendiente"})'


class RespuestaPregunta(models.Model):
    """Respuesta individual a una pregunta dentro de una encuesta respondida."""
    respuesta_encuesta = models.ForeignKey(
        RespuestaEncuesta,
        on_delete=models.CASCADE,
        related_name='respuestas_preguntas'
    )
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='respuestas'
    )
    valor_escala = models.SmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    texto_respuesta = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Respuesta a Pregunta'
        verbose_name_plural = 'Respuestas a Preguntas'
        unique_together = [['respuesta_encuesta', 'pregunta']]

    def __str__(self):
        return f'Resp. de {self.respuesta_encuesta.empleado} a P{self.pregunta.orden}'
