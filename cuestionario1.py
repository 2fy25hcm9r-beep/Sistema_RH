import os
import sys
import django
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.encuestas.models import Encuesta, Pregunta
from apps.usuarios.models import Usuario

def crear_cuestionario_1():
    admin = Usuario.objects.filter(rol='admin').first()
    if not admin:
        admin = Usuario.objects.first()
        if not admin:
            print('ERROR: No hay usuarios en el sistema. Crea uno primero.')
            sys.exit(1)

    encuesta = Encuesta.objects.filter(titulo='Cuestionario 1').first()
    if not encuesta:
        encuesta = Encuesta.objects.create(
            titulo='Cuestionario 1',
            descripcion='Identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.',
            estado='activa',
            fecha_inicio=date.today(),
            fecha_fin=date(2099, 12, 31),
            creado_por=admin,
        )
    else:
        encuesta.descripcion = 'Identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.'
        encuesta.estado = 'activa'
        encuesta.fecha_inicio = date.today()
        encuesta.fecha_fin = date(2099, 12, 31)
        encuesta.creado_por = admin
        encuesta.save()

    preguntas = [
        (1, 'Sexo:', 'opcion_multiple', True),
        (2, 'Edad en años:', 'opcion_multiple', True),
        (3, 'Estado civil:', 'opcion_multiple', True),
        (4, 'Nivel de estudios:', 'opcion_multiple', True),
        (5, 'Ocupación/profesión/puesto:', 'texto_libre', True),
        (6, 'Departamento/Sección/Área:', 'texto_libre', True),
        (7, 'Tipo de puesto:', 'opcion_multiple', True),
        (8, 'Tipo de contratación:', 'opcion_multiple', True),
        (9, 'Tipo de personal:', 'opcion_multiple', True),
        (10, 'Tipo de jornada de trabajo:', 'opcion_multiple', True),
        (11, 'Realiza rotación de turnos:', 'si_no', True),
        (12, 'Tiempo en el puesto actual:', 'opcion_multiple', True),
        (13, 'Tiempo experiencia laboral:', 'opcion_multiple', True),
    ]

    preguntas_seccion_i = [
        (14, '¿Accidente que tenga como consecuencia la muerte, la pérdida de un miembro o una lesión grave?', 'si_no', True),
        (15, '¿Asaltos?', 'si_no', True),
        (16, '¿Actos violentos que derivaron en lesiones graves?', 'si_no', True),
        (17, '¿Secuestro?', 'si_no', True),
        (18, '¿Amenazas?', 'si_no', True),
        (19, '¿Cualquier otro que ponga en riesgo su vida o salud, y/o la de otras personas?', 'si_no', True),
    ]

    preguntas_seccion_ii = [
        (20, '¿Ha tenido recuerdos recurrentes sobre el acontecimiento que le provocan malestares?', 'si_no', False),
        (21, '¿Ha tenido sueños de carácter recurrente sobre el acontecimiento, que le producen malestar?', 'si_no', False),
    ]

    preguntas_seccion_iii = [
        (22, '¿Se ha esforzado por evitar todo tipo de sentimientos, conversaciones o situaciones que le puedan recordar el acontecimiento?', 'si_no', False),
        (23, '¿Se ha esforzado por evitar todo tipo de actividades, lugares o personas que motivan recuerdos del acontecimiento?', 'si_no', False),
        (24, '¿Ha tenido dificultad para recordar alguna parte importante del evento?', 'si_no', False),
        (25, '¿Ha disminuido su interés en sus actividades cotidianas?', 'si_no', False),
        (26, '¿Se ha sentido usted alejado o distante de los demás?', 'si_no', False),
        (27, '¿Ha notado que tiene dificultad para expresar sus sentimientos?', 'si_no', False),
        (28, '¿Ha tenido la impresión de que su vida se va a acortar, que va a morir antes que otras personas o que tiene un futuro limitado?', 'si_no', False),
    ]

    preguntas_seccion_iv = [
        (29, '¿Ha tenido usted dificultades para dormir?', 'si_no', False),
        (30, '¿Ha estado particularmente irritable o le han dado arranques de coraje?', 'si_no', False),
        (31, '¿Ha tenido dificultad para concentrarse?', 'si_no', False),
        (32, '¿Ha estado nervioso o constantemente en alerta?', 'si_no', False),
        (33, '¿Se ha sobresaltado fácilmente por cualquier cosa?', 'si_no', False),
    ]

    for num, texto, tipo, requerida in preguntas + preguntas_seccion_i + preguntas_seccion_ii + preguntas_seccion_iii + preguntas_seccion_iv:
        Pregunta.objects.update_or_create(
            encuesta=encuesta,
            orden=num,
            defaults={
                'texto': texto,
                'tipo': tipo,
                'tipo_puntuacion': 'directa',
                'requerida': requerida,
            }
        )

    print('[OK] Cuestionario 1 creado exitosamente')

if __name__ == '__main__':
    crear_cuestionario_1()