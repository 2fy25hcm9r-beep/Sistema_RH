from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.usuarios.models import Empleado
from .constants import CUESTIONARIO_1_TITULO, CUESTIONARIO_1_CAMPO_POR_ORDEN
from .models import RespuestaEncuesta, RespuestaPregunta


@dataclass
class ResultadoRespuestaEncuesta:
    puntaje_total: float | None
    nivel_riesgo: str | None
    puntaje_normalizado: float | None


def _calcular_nivel_riesgo(puntaje_condiciones_trabajo: int | None) -> str | None:
    if puntaje_condiciones_trabajo is None:
        return None
    if puntaje_condiciones_trabajo < 50:
        return 'nulo'
    if puntaje_condiciones_trabajo <= 74:
        return 'bajo'
    if puntaje_condiciones_trabajo <= 98:
        return 'medio'
    if puntaje_condiciones_trabajo <= 139:
        return 'alto'
    return 'muy_alto'


def guardar_respuesta_encuesta(*, encuesta, empleado: Empleado, respuestas_data: list[dict[str, Any]]) -> ResultadoRespuestaEncuesta:
    with transaction.atomic():
        respuesta_enc = RespuestaEncuesta.objects.create(encuesta=encuesta, empleado=empleado)

        puntaje_condiciones_trabajo = 0
        total_validadas = 0
        suma_normalizados = 0.0
        actualizaciones: dict[str, str] = {}

        for resp in respuestas_data:
            pregunta = resp['pregunta']
            valor_texto = str(resp.get('texto_respuesta') or resp.get('valor_escala') or '')

            RespuestaPregunta.objects.create(
                respuesta_encuesta=respuesta_enc,
                pregunta=pregunta,
                valor_escala=resp.get('valor_escala'),
                texto_respuesta=valor_texto,
            )

            if encuesta.titulo == CUESTIONARIO_1_TITULO:
                campo_empleado = CUESTIONARIO_1_CAMPO_POR_ORDEN.get(pregunta.orden)
                if campo_empleado and valor_texto:
                    actualizaciones[campo_empleado] = valor_texto

            if pregunta.tipo == 'escala' and resp.get('valor_escala') is not None:
                valor_obtenido = resp['valor_escala']
                normalizado = ((valor_obtenido - 1) / 4) * 100
                suma_normalizados += normalizado

                if pregunta.tipo_puntuacion == 'invertida':
                    puntaje_pregunta = 5 - valor_obtenido
                else:
                    puntaje_pregunta = valor_obtenido - 1

                puntaje_condiciones_trabajo += puntaje_pregunta
                total_validadas += 1

        if encuesta.titulo == CUESTIONARIO_1_TITULO and actualizaciones:
            Empleado.objects.filter(id=empleado.id).update(**actualizaciones)

        if total_validadas > 0:
            puntaje_normalizado = round(suma_normalizados / total_validadas, 2)
            nivel_riesgo = _calcular_nivel_riesgo(puntaje_condiciones_trabajo)
        else:
            puntaje_condiciones_trabajo = None
            nivel_riesgo = None
            puntaje_normalizado = None

        respuesta_enc.completada = True
        respuesta_enc.fecha_completado = timezone.now()
        respuesta_enc.puntaje_total = puntaje_condiciones_trabajo
        respuesta_enc.puntaje_condiciones_trabajo = puntaje_condiciones_trabajo
        respuesta_enc.nivel_riesgo = nivel_riesgo
        respuesta_enc.puntaje_normalizado = puntaje_normalizado
        respuesta_enc.save()

    return ResultadoRespuestaEncuesta(
        puntaje_total=puntaje_condiciones_trabajo,
        nivel_riesgo=nivel_riesgo,
        puntaje_normalizado=puntaje_normalizado,
    )
