from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from django.db.models import Avg, Count

from ..encuestas.constants import CUESTIONARIO_2_TITULO, CUESTIONARIO_3_TITULO, OPCIONES_ESCALA
from ..encuestas.models import Encuesta, RespuestaEncuesta, RespuestaPregunta
from ..usuarios.models import Empleado


@dataclass
class RespuestaEmpleadoReporte:
    id: int
    empleado_id: int
    numero_empleado: str
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    nombre_completo: str
    puntaje: float
    nivel_riesgo: str | None
    fecha: str


@dataclass
class PreguntaRespuestaReporte:
    orden: int
    texto: str
    tipo_pregunta: str
    tipo_puntuacion: str
    valor_escala: int | None
    respuesta_texto: str


@dataclass
class DetalleRespuestaReporte:
    empleado: dict[str, str]
    puntaje: float
    nivel_riesgo: str | None
    fecha: str
    preguntas: list[dict[str, Any]]


def obtener_encuesta_reporte() -> Encuesta | None:
    encuesta = (
        Encuesta.objects.filter(titulo=CUESTIONARIO_3_TITULO)
        .first()
        or Encuesta.objects.filter(titulo=CUESTIONARIO_2_TITULO).first()
    )
    return encuesta


def resumen_dashboard(encuesta_titulo: str | None = None) -> dict[str, Any]:
    qs = RespuestaEncuesta.objects.filter(completada=True)
    if encuesta_titulo:
        qs = qs.filter(encuesta__titulo=encuesta_titulo)

    total_respuestas = qs.count()
    alto = qs.filter(nivel_riesgo='alto').values('empleado').distinct().count()
    muy_alto = qs.filter(nivel_riesgo='muy_alto').values('empleado').distinct().count()

    # Calcular atención clínica evaluando las respuestas reales del Cuestionario 1
    # (el campo nivel_riesgo no almacena este valor, se calcula dinámicamente)
    resp_c1 = RespuestaEncuesta.objects.filter(
        completada=True, encuesta__titulo='Cuestionario 1'
    ).prefetch_related('respuestas_preguntas__pregunta')

    def _es_si(v: str | None) -> bool:
        return bool(v and v.lower() in ('si', 'sí'))

    atencion_clinica = 0
    for resp in resp_c1:
        rps = {rp.pregunta.orden: rp.texto_respuesta for rp in resp.respuestas_preguntas.all()}
        si_ii = sum(1 for o in [20, 21] if _es_si(rps.get(o)))
        si_iii = sum(1 for o in [22, 23, 24, 25, 26, 27, 28] if _es_si(rps.get(o)))
        si_iv = sum(1 for o in [29, 30, 31, 32, 33] if _es_si(rps.get(o)))
        if si_ii >= 1 or si_iii >= 3 or si_iv >= 2:
            atencion_clinica += 1

    return {
        'total_respuestas': total_respuestas,
        'atencion_clinica': atencion_clinica,
        'alto': alto,
        'muy_alto': muy_alto,
    }


def distribucion_escala() -> list[dict[str, Any]]:
    datos = (
        RespuestaPregunta.objects.filter(respuesta_encuesta__completada=True, valor_escala__isnull=False)
        .values('valor_escala')
        .annotate(cantidad=Count('id'))
        .order_by('valor_escala')
    )
    total = sum(item['cantidad'] for item in datos)
    return [
        {
            'valor': item['valor_escala'],
            'cantidad': item['cantidad'],
            'porcentaje': round((item['cantidad'] / total * 100), 2) if total > 0 else 0,
        }
        for item in datos
    ]


def distribucion_dia() -> list[dict[str, Any]]:
    dias_semana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    datos: list[dict[str, Any]] = []
    for i, nombre_dia in enumerate(dias_semana, 1):
        count = RespuestaEncuesta.objects.filter(completada=True, fecha_completado__week_day=i).count()
        datos.append({'dia': nombre_dia, 'cantidad': count})
    return datos


def distribucion_riesgo(encuesta_titulo: str | None = None) -> list[dict[str, Any]]:
    niveles = ['nulo', 'bajo', 'medio', 'alto', 'muy_alto']
    datos = []
    
    qs = RespuestaEncuesta.objects.filter(completada=True)
    if encuesta_titulo:
        qs = qs.filter(encuesta__titulo=encuesta_titulo)

    for nivel in niveles:
        count = qs.filter(nivel_riesgo=nivel).values('empleado').distinct().count()
        datos.append({'nivel': nivel, 'cantidad': count})
    return datos


def listar_empleados_respuestas(encuesta_id: int | None = None) -> list[dict[str, Any]]:
    qs = RespuestaEncuesta.objects.filter(completada=True).select_related('empleado', 'encuesta')
    if encuesta_id:
        qs = qs.filter(encuesta_id=encuesta_id)

    # Pre-cargar todas las respuestas_preguntas si hay respuestas del Cuestionario 1
    # para no hacer una consulta N+1.
    resp_preguntas = RespuestaPregunta.objects.filter(
        respuesta_encuesta__in=qs,
        respuesta_encuesta__encuesta__titulo='Cuestionario 1'
    ).select_related('pregunta')
    
    resp_por_encuesta = {}
    for rp in resp_preguntas:
        resp_por_encuesta.setdefault(rp.respuesta_encuesta_id, []).append(rp)

    def _es_si(v: str | None) -> bool:
        return bool(v and v.lower() in ('si', 'sí'))

    datos: list[dict[str, Any]] = []
    for respuesta in qs:
        nombre_completo = f"{respuesta.empleado.nombre} {respuesta.empleado.apellido_paterno} {respuesta.empleado.apellido_materno}".strip()
        
        nivel_riesgo = respuesta.nivel_riesgo
        if respuesta.encuesta.titulo == 'Cuestionario 1':
            preguntas = resp_por_encuesta.get(respuesta.id, [])
            resp_dict = {p.pregunta.orden: p for p in preguntas}
            
            # Sección II (Q20-21)
            si_sec_ii = sum(1 for o in [20, 21] if _es_si(resp_dict.get(o).texto_respuesta if resp_dict.get(o) else ''))
            # Sección III (Q22-28)
            si_sec_iii = sum(1 for o in [22, 23, 24, 25, 26, 27, 28] if _es_si(resp_dict.get(o).texto_respuesta if resp_dict.get(o) else ''))
            # Sección IV (Q29-33)
            si_sec_iv = sum(1 for o in [29, 30, 31, 32, 33] if _es_si(resp_dict.get(o).texto_respuesta if resp_dict.get(o) else ''))
            
            requiere_clinica = si_sec_ii >= 1 or si_sec_iii >= 3 or si_sec_iv >= 2
            nivel_riesgo = 'Si' if requiere_clinica else 'No'

        datos.append(
            asdict(
                RespuestaEmpleadoReporte(
                    id=respuesta.id,
                    empleado_id=respuesta.empleado.id,
                    numero_empleado=respuesta.empleado.numero_empleado,
                    nombre=respuesta.empleado.nombre,
                    apellido_paterno=respuesta.empleado.apellido_paterno,
                    apellido_materno=respuesta.empleado.apellido_materno,
                    nombre_completo=nombre_completo,
                    puntaje=float(respuesta.puntaje_total) if respuesta.puntaje_total else 0,
                    nivel_riesgo=nivel_riesgo,
                    fecha=respuesta.fecha_completado.strftime('%d/%m/%Y') if respuesta.fecha_completado else '',
                )
            )
        )
    return datos


def detalle_respuesta_empleado(respuesta_id: int) -> dict[str, Any] | None:
    try:
        respuesta = RespuestaEncuesta.objects.select_related('empleado', 'encuesta').get(id=respuesta_id, completada=True)
    except RespuestaEncuesta.DoesNotExist:
        return None

    respuestas_preguntas = (
        RespuestaPregunta.objects.filter(respuesta_encuesta=respuesta)
        .select_related('pregunta')
        .order_by('pregunta__orden')
    )

    def _es_si(v: str | None) -> bool:
        return bool(v and v.lower() in ('si', 'sí'))

    preguntas: list[dict[str, Any]] = []
    resp_dict = {}
    for respuesta_pregunta in respuestas_preguntas:
        valor = respuesta_pregunta.valor_escala
        texto_resp = _get_texto_respuesta(respuesta_pregunta)
        resp_dict[respuesta_pregunta.pregunta.orden] = texto_resp
        preguntas.append(
            asdict(
                PreguntaRespuestaReporte(
                    orden=respuesta_pregunta.pregunta.orden,
                    texto=respuesta_pregunta.pregunta.texto,
                    tipo_pregunta=respuesta_pregunta.pregunta.tipo,
                    tipo_puntuacion=respuesta_pregunta.pregunta.tipo_puntuacion,
                    valor_escala=valor,
                    respuesta_texto=texto_resp,
                )
            )
        )

    nivel_riesgo = respuesta.nivel_riesgo
    if respuesta.encuesta.titulo == 'Cuestionario 1':
        si_sec_ii = sum(1 for o in [20, 21] if _es_si(resp_dict.get(o, '')))
        si_sec_iii = sum(1 for o in [22, 23, 24, 25, 26, 27, 28] if _es_si(resp_dict.get(o, '')))
        si_sec_iv = sum(1 for o in [29, 30, 31, 32, 33] if _es_si(resp_dict.get(o, '')))
        requiere_clinica = si_sec_ii >= 1 or si_sec_iii >= 3 or si_sec_iv >= 2
        nivel_riesgo = 'Si' if requiere_clinica else 'No'

    return {
        'empleado': {
            'nombre_completo': f"{respuesta.empleado.nombre} {respuesta.empleado.apellido_paterno} {respuesta.empleado.apellido_materno}".strip(),
            'numero_empleado': respuesta.empleado.numero_empleado,
        },
        'puntaje': float(respuesta.puntaje_total) if respuesta.puntaje_total else 0,
        'nivel_riesgo': nivel_riesgo,
        'fecha': respuesta.fecha_completado.strftime('%d/%m/%Y') if respuesta.fecha_completado else '',
        'preguntas': preguntas,
    }

def _get_texto_respuesta(rp: RespuestaPregunta) -> str:
    if rp.valor_escala:
        opciones_escala = {item['valor']: item['texto'] for item in OPCIONES_ESCALA}
        return opciones_escala.get(rp.valor_escala, str(rp.valor_escala))
    return rp.texto_respuesta or ''
