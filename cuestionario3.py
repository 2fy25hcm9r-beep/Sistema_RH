# Updated NOM-035 script with all 74 questions

import os
import sys
import django
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.encuestas.models import Encuesta, Pregunta
from apps.usuarios.models import Usuario

def crear_cuestionario_3():
    admin = Usuario.objects.filter(rol='admin').first()
    if not admin:
        admin = Usuario.objects.first()
        if not admin:
            print('ERROR: No hay usuarios en el sistema. Crea uno primero.')
            sys.exit(1)

    encuesta = Encuesta.objects.filter(titulo='Cuestionario 3').first()
    if not encuesta:
        encuesta = Encuesta.objects.create(
            titulo='Cuestionario 3',
            descripcion='Identificar los factores de riesgo psicosocial y evaluar el entorno organizacional en los centros de trabajo.',
            estado='activa',
            fecha_inicio=date.today(),
            fecha_fin=date(2099, 12, 31),
            creado_por=admin,
        )
    else:
        encuesta.descripcion = 'Identificar los factores de riesgo psicosocial y evaluar el entorno organizacional en los centros de trabajo.'
        encuesta.estado = 'activa'
        encuesta.fecha_inicio = date.today()
        encuesta.fecha_fin = date(2099, 12, 31)
        encuesta.creado_por = admin
        encuesta.save()

    preguntas_nom035 = [
        (1, 'El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica.', True, 'escala', True),
        (2, 'Mi trabajo me exige hacer mucho esfuerzo físico.', False, 'escala', True),
        (3, 'Me preocupa sufrir un accidente en mi trabajo.', False, 'escala', True),
        (4, 'Considero que en mi trabajo se aplican las normas de seguridad y salud.', True, 'escala', True),
        (5, 'Considero que las actividades que realizo son peligrosas.', False, 'escala', True),
        (6, 'Debo quedarme tiempo adicional a mi turno.', False, 'escala', True),
        (7, 'Debo trabajar sin parar.', False, 'escala', True),
        (8, 'Es necesario mantener un ritmo de trabajo acelerado.', False, 'escala', True),
        (9, 'Mi trabajo exige que esté muy concentrado.', False, 'escala', True),
        (10, 'Mi trabajo requiere memorizar mucha información.', False, 'escala', True),
        (11, 'Debo tomar decisiones difíciles muy rápido.', False, 'escala', True),
        (12, 'Atiendo varios asuntos al mismo tiempo.', False, 'escala', True),
        (13, 'Soy responsable de cosas de mucho valor.', False, 'escala', True),
        (14, 'Respondo por los resultados de toda mi área.', False, 'escala', True),
        (15, 'Me dan órdenes contradictorias.', False, 'escala', True),
        (16, 'Me piden hacer cosas innecesarias.', False, 'escala', True),
        (17, 'Trabajo horas extras más de tres veces por semana.', False, 'escala', True),
        (18, 'Trabajo en días de descanso o festivos.', False, 'escala', True),
        (19, 'El trabajo perjudica mis actividades personales.', False, 'escala', True),
        (20, 'Atiendo asuntos laborales en casa.', False, 'escala', True),
        (21, 'Pienso en asuntos familiares durante el trabajo.', False, 'escala', True),
        (22, 'Mis responsabilidades familiares afectan mi trabajo.', False, 'escala', True),
        (23, 'Mi trabajo permite desarrollar nuevas habilidades.', True, 'escala', True),
        (24, 'Puedo aspirar a un mejor puesto.', True, 'escala', True),
        (25, 'Puedo tomar pausas cuando las necesito.', True, 'escala', True),
        (26, 'Puedo decidir cuánto trabajo realizo.', True, 'escala', True),
        (27, 'Puedo decidir la velocidad de trabajo.', True, 'escala', True),
        (28, 'Puedo cambiar el orden de mis actividades.', True, 'escala', True),
        (29, 'Los cambios dificultan mi trabajo.', False, 'escala', True),
        (30, 'Se toman en cuenta mis ideas en los cambios.', True, 'escala', True),
        (31, 'Me informan claramente mis funciones.', True, 'escala', True),
        (32, 'Me explican los resultados esperados.', True, 'escala', True),
        (33, 'Me explican los objetivos de mi trabajo.', True, 'escala', True),
        (34, 'Sé con quién resolver problemas laborales.', True, 'escala', True),
        (35, 'Me permiten asistir a capacitaciones.', True, 'escala', True),
        (36, 'Recibo capacitación útil.', True, 'escala', True),
        (37, 'Mi jefe ayuda a organizar mejor el trabajo.', True, 'escala', True),
        (38, 'Mi jefe considera mis opiniones.', True, 'escala', True),
        (39, 'Mi jefe comunica información oportunamente.', True, 'escala', True),
        (40, 'La orientación de mi jefe me ayuda.', True, 'escala', True),
        (41, 'Mi jefe ayuda a resolver problemas.', True, 'escala', True),
        (42, 'Confío en mis compañeros.', True, 'escala', True),
        (43, 'Los problemas se solucionan respetuosamente.', True, 'escala', True),
        (44, 'Me hacen sentir parte del grupo.', True, 'escala', True),
        (45, 'Los compañeros colaboran en equipo.', True, 'escala', True),
        (46, 'Los compañeros me ayudan cuando tengo dificultades.', True, 'escala', True),
        (47, 'Me informan sobre lo que hago bien.', True, 'escala', True),
        (48, 'La evaluación me ayuda a mejorar.', True, 'escala', True),
        (49, 'Me pagan a tiempo.', True, 'escala', True),
        (50, 'Recibo un pago justo.', True, 'escala', True),
        (51, 'Reconocen mis resultados.', True, 'escala', True),
        (52, 'Hay oportunidades de crecimiento.', True, 'escala', True),
        (53, 'Mi trabajo es estable.', True, 'escala', True),
        (54, 'Existe continua rotación de personal.', False, 'escala', True),
        (55, 'Siento orgullo de trabajar aquí.', True, 'escala', True),
        (56, 'Me siento comprometido con mi trabajo.', True, 'escala', True),
        (57, 'Puedo expresarme libremente.', True, 'escala', True),
        (58, 'Recibo críticas constantes.', False, 'escala', True),
        (59, 'Recibo burlas o humillaciones.', False, 'escala', True),
        (60, 'Se ignora mi presencia.', False, 'escala', True),
        (61, 'Manipulan situaciones para hacerme quedar mal.', False, 'escala', True),
        (62, 'Ignoran mis éxitos laborales.', False, 'escala', True),
        (63, 'Bloquean oportunidades de ascenso.', False, 'escala', True),
        (64, 'He presenciado violencia laboral.', False, 'escala', True),
        (65, 'En mi trabajo debo brindar servicio a clientes o usuarios:', False, 'si_no', False),
        (66, 'Atiendo clientes muy enojados.', False, 'escala', False),
        (67, 'Atiendo personas necesitadas o enfermas.', False, 'escala', False),
        (68, 'Debo mostrar sentimientos distintos a los míos.', False, 'escala', False),
        (69, 'Atiendo situaciones de violencia.', False, 'escala', False),
        (70, 'Soy jefe de otros trabajadores:', False, 'si_no', False),
        (71, 'Mis subordinados comunican tarde asuntos laborales.', False, 'escala', False),
        (72, 'Dificultan el logro de resultados.', False, 'escala', False),
        (73, 'Cooperan poco cuando se necesita.', False, 'escala', False),
        (74, 'Ignoran sugerencias de mejora.', False, 'escala', False),
    ]

    for pregunta_data in preguntas_nom035:
        num, texto, es_invertida, tipo, requerida = pregunta_data
        Pregunta.objects.update_or_create(
            encuesta=encuesta,
            orden=num,
            defaults={
                'texto': texto,
                'tipo': tipo,
                'tipo_puntuacion': 'invertida' if es_invertida else 'directa',
                'requerida': requerida,
            }
        )

    print('[OK] Cuestionario 3 creado exitosamente')

if __name__ == '__main__':
    crear_cuestionario_3()