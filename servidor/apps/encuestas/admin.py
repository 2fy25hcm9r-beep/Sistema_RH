from django.contrib import admin
from .models import Encuesta, Pregunta, AccesoEncuesta, RespuestaEncuesta


class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 1


class AccesoInline(admin.TabularInline):
    model = AccesoEncuesta
    extra = 0
    readonly_fields = ['fecha_asignacion']


@admin.register(Encuesta)
class EncuestaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'estado', 'fecha_inicio', 'fecha_fin', 'total_asignados', 'total_respondidas']
    list_filter = ['estado']
    search_fields = ['titulo']
    inlines = [PreguntaInline, AccesoInline]
    readonly_fields = ['fecha_creacion', 'fecha_modificacion']


@admin.register(RespuestaEncuesta)
class RespuestaEncuestaAdmin(admin.ModelAdmin):
    list_display = ['empleado', 'encuesta', 'completada', 'puntaje_total', 'fecha_completado']
    list_filter = ['completada', 'encuesta']
    search_fields = ['empleado__numero_empleado', 'empleado__apellido_paterno']
    readonly_fields = ['fecha_inicio_respuesta', 'fecha_completado']
