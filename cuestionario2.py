import os
import sys
import django
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.encuestas.models import Encuesta, Pregunta
from apps.usuarios.models import Usuario

def crear_cuestionario_2():
    admin = Usuario.objects.filter(rol='admin').first()
    if not admin:
        admin = Usuario.objects.first()
        if not admin:
            print('ERROR: No hay usuarios en el sistema. Crea uno primero.')
            sys.exit(1)

    encuesta = Encuesta.objects.filter(titulo='Cuestionario 2').first()
    if not encuesta:
        encuesta = Encuesta.objects.create(
            titulo='Cuestionario 2',
            descripcion='Identificar los factores de riesgo psicosocial en los centros de trabajo.',
            estado='activa',
            fecha_inicio=date.today(),
            fecha_fin=date(2099, 12, 31),
            creado_por=admin,
        )
    else:
        encuesta.descripcion = 'Identificar los factores de riesgo psicosocial en los centros de trabajo.'
        encuesta.estado = 'activa'
        encuesta.fecha_inicio = date.today()
        encuesta.fecha_fin = date(2099, 12, 31)
        encuesta.creado_por = admin
        encuesta.save()

    preguntas_list = [
        (1, 'Mi trabajo me exige hacer mucho esfuerzo físico.', True),
        (2, 'Me preocupa sufrir un accidente en mi trabajo.', True),
        (3, 'Considero que las actividades que realizo son peligrosas.', True),
        (4, 'Debo quedarme tiempo adicional a mi turno.', True),
        (5, 'Debo trabajar sin parar.', True),
        (6, 'Considero que es necesario mantener un ritmo de trabajo acelerado.', True),
        (7, 'Exige que esté muy concentrado.', True),
        (8, 'Mi trabajo requiere que memorice mucha información.', True),
        (9, 'Mi trabajo exige que atienda varios asuntos al mismo tiempo.', True),
        (10, 'En mi trabajo soy responsable de cosas de mucho valor.', True),
        (11, 'Respondo ante mi jefe por los resultados de toda mi área de trabajo.', True),
        (12, 'En mi trabajo me dan órdenes contradictorias.', True),
        (13, 'Considero que en mi trabajo me piden hacer cosas innecesarias.', True),
        (14, 'Trabajo horas extras más de tres veces a la semana.', True),
        (15, 'Mi trabajo me exige laborar en días de descanso, festivos o fines de semana.', True),
        (16, 'Considero que el tiempo en el trabajo es mucho y perjudica mis actividades familiares o personales.', True),
        (17, 'Pienso en las actividades familiares o personales cuando estoy en mi trabajo.', True),
        (18, 'Mi trabajo permite que desarrolle nuevas habilidades.', False),
        (19, 'En mi trabajo puedo aspirar a un mejor puesto.', False),
        (20, 'Durante mi jornada de trabajo puedo tomar pausas cuando las necesito.', False),
        (21, 'Puedo decidir la velocidad a la que realizo mis actividades en mi trabajo.', False),
        (22, 'Puedo cambiar el orden de las actividades que realizo en mi trabajo.', False),
        (23, 'Me informan con claridad cuáles son mis funciones.', False),
        (24, 'Me explican claramente los resultados que deben obtener en mi trabajo.', False),
        (25, 'Me informan con quién puedo resolver problemas asuntos de trabajo.', False),
        (26, 'Me permiten asistir a capacitaciones relacionadas con mi trabajo.', False),
        (27, 'Recibo capacitación útil para hacer mi trabajo.', False),
        (28, 'Mi jefe tiene en cuenta mis puntos de vista y opiniones.', False),
        (29, 'Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo.', False),
        (30, 'Puedo confiar en mis compañeros de trabajo.', False),
        (31, 'Cuando tenemos que realizar trabajo de equipo los compañeros colaboran.', False),
        (32, 'Mis compañeros de trabajo me ayudan cuando tengo dificultades.', False),
        (33, 'En mi trabajo puedo expresarme libremente sin interrupciones.', False),
        (34, 'Recibo críticas constantes a mi persona y/o trabajo.', True),
        (35, 'Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones.', True),
        (36, 'Se ignora mi presencia o se me excluye de las reuniones de trabajo y en la toma de decisiones.', True),
        (37, 'Se manipulan las situaciones de trabajo para hacerme parecer un mal trabajador.', True),
        (38, 'Se ignoran mis éxitos laborales y se atribuyen a otros trabajadores.', True),
        (39, 'Me bloquean o impiden las oportunidades que tengo para obtener ascenso o mejora en mi trabajo.', True),
        (40, 'He presenciado actos de violencia en mi centro de trabajo.', True),
        (41, 'En mi trabajo debo brindar servicio a clientes o usuarios:', False),
        (42, 'Atiendo clientes muy enojados.', False),
        (43, 'Atiendo personas necesitadas o enfermas.', False),
        (44, 'Debo mostrar sentimientos distintos a los míos.', False),
        (45, 'Soy jefe de otros trabajadores:', False),
        (46, 'Mis subordinados comunican tarde asuntos laborales.', False),
        (47, 'Dificultan el logro de resultados.', False),
        (48, 'Ignoran sugerencias de mejora.', False),
    ]

    for num, texto, es_invertida in preguntas_list:
        requerida = num <= 40 or (num >= 42 and num <= 48)
        Pregunta.objects.update_or_create(
            encuesta=encuesta,
            orden=num,
            defaults={
                'texto': texto,
                'tipo': 'si_no' if num in [41, 45] else 'escala',
                'tipo_puntuacion': 'invertida' if es_invertida else 'directa',
                'requerida': requerida,
            }
        )

    print('[OK] Cuestionario 2 creado exitosamente')

if __name__ == '__main__':
    crear_cuestionario_2()