from __future__ import annotations

OPCIONES_ESCALA = [
    {'valor': 1, 'texto': 'Nunca'},
    {'valor': 2, 'texto': 'Casi nunca'},
    {'valor': 3, 'texto': 'Algunas veces'},
    {'valor': 4, 'texto': 'Casi siempre'},
    {'valor': 5, 'texto': 'Siempre'},
]

OPCIONES_SI_NO = [
    {'valor': 'si', 'texto': 'Sí'},
    {'valor': 'no', 'texto': 'No'},
]

CUESTIONARIO_1_TITULO = 'Cuestionario 1'
CUESTIONARIO_2_TITULO = 'Cuestionario 2'
CUESTIONARIO_3_TITULO = 'Cuestionario 3'

CUESTIONARIO_1_CAMPO_POR_ORDEN = {
    1: 'sexo',
    2: 'edad',
    3: 'estado_civil',
    4: 'nivel_estudios',
    5: 'ocupacion',
    6: 'departamento',
    7: 'tipo_puesto',
    8: 'tipo_contratacion',
    9: 'tipo_personal',
    10: 'tipo_jornada',
    11: 'rotacion_turnos',
    12: 'tiempo_puesto_actual',
    13: 'tiempo_experiencia',
    14: 'accidente_grave',
    15: 'asalto',
    16: 'actos_violentos',
    17: 'secuestro',
    18: 'amenazas',
    19: 'otro_riesgo_vida_salud',
    20: 'recuerdos_recurrentes_malestar',
    21: 'suenos_recurrentes_malestar',
    22: 'evitar_sentimientos_conversaciones',
    23: 'evitar_actividades_lugares_personas',
    24: 'dificultad_recordar_evento',
    25: 'disminuye_interes_actividades',
    26: 'sensacion_alejamiento',
    27: 'dificultad_expresar_sentimientos',
    28: 'vida_futuro_limitado',
    29: 'dificultad_dormir',
    30: 'irritable_arranos_coraje',
    31: 'dificultad_concentrarse',
    32: 'nervioso_alerta',
    33: 'sobresalta_facilmente',
}

OPCIONES_CUESTIONARIO_1 = {
    1: [{'valor': 'M', 'texto': 'Masculino'}, {'valor': 'F', 'texto': 'Femenino'}],
    2: [
        {'valor': '15-19', 'texto': '15 - 19'}, {'valor': '20-24', 'texto': '20 - 24'}, {'valor': '25-29', 'texto': '25 - 29'},
        {'valor': '30-34', 'texto': '30 - 34'}, {'valor': '35-39', 'texto': '35 - 39'}, {'valor': '40-44', 'texto': '40 - 44'},
        {'valor': '45-49', 'texto': '45 - 49'}, {'valor': '50-54', 'texto': '50 - 54'}, {'valor': '55-59', 'texto': '55 - 59'},
        {'valor': '60-64', 'texto': '60 - 64'}, {'valor': '65-69', 'texto': '65 - 69'}, {'valor': '70+', 'texto': '70 o más'}
    ],
    3: [
        {'valor': 'casado', 'texto': 'Casado'}, {'valor': 'divorciado', 'texto': 'Divorciado'},
        {'valor': 'soltero', 'texto': 'Soltero'}, {'valor': 'viudo', 'texto': 'Viudo'}, {'valor': 'union_libre', 'texto': 'Unión libre'}
    ],
    4: [
        {'valor': 'sin_formacion', 'texto': 'Sin formación'}, {'valor': 'primaria_terminada', 'texto': 'Primaria Terminada'},
        {'valor': 'primaria_incompleta', 'texto': 'Primaria Incompleta'}, {'valor': 'secundaria_terminada', 'texto': 'Secundaria Terminada'},
        {'valor': 'secundaria_incompleta', 'texto': 'Secundaria Incompleta'}, {'valor': 'preparatoria_terminada', 'texto': 'Preparatoria Terminada'},
        {'valor': 'preparatoria_incompleta', 'texto': 'Preparatoria Incompleta'}, {'valor': 'tecnico_terminada', 'texto': 'Técnico Terminada'},
        {'valor': 'tecnico_incompleta', 'texto': 'Técnico Incompleta'}, {'valor': 'licenciatura_terminada', 'texto': 'Licenciatura Terminada'},
        {'valor': 'licenciatura_incompleta', 'texto': 'Licenciatura Incompleta'}, {'valor': 'maestria_terminada', 'texto': 'Maestría Terminada'},
        {'valor': 'maestria_incompleta', 'texto': 'Maestría Incompleta'}, {'valor': 'doctorado_terminada', 'texto': 'Doctorado Terminada'},
        {'valor': 'doctorado_incompleta', 'texto': 'Doctorado Incompleta'}
    ],
    7: [
        {'valor': 'operativo', 'texto': 'Operativo'}, {'valor': 'supervisor', 'texto': 'Supervisor'},
        {'valor': 'profesional', 'texto': 'Profesional'}, {'valor': 'gerente', 'texto': 'Gerente'}
    ],
    8: [
        {'valor': 'obra_proyecto', 'texto': 'Por obra o proyecto'}, {'valor': 'indeterminado', 'texto': 'Tiempo indeterminado'},
        {'valor': 'determinado', 'texto': 'Temporal'}, {'valor': 'honorarios', 'texto': 'Honorarios'}
    ],
    9: [
        {'valor': 'sindicalizado', 'texto': 'Sindicalizado'}, {'valor': 'confianza', 'texto': 'Confianza'}, {'valor': 'ninguno', 'texto': 'Ninguno'}
    ],
    10: [
        {'valor': 'nocturno', 'texto': 'Nocturno'}, {'valor': 'mixto', 'texto': 'Mixto'}, {'valor': 'diurno', 'texto': 'Diurno'}
    ],
    11: OPCIONES_SI_NO,
    12: [
        {'valor': 'menos_6m', 'texto': 'Menos de 6 meses'}, {'valor': '6m_1a', 'texto': '6 meses - 1 año'},
        {'valor': '1_4a', 'texto': '1 - 4 años'}, {'valor': '5_9a', 'texto': '5 - 9 años'},
        {'valor': '10_14a', 'texto': '10 - 14 años'}, {'valor': '15_19a', 'texto': '15 - 19 años'},
        {'valor': '20_24a', 'texto': '20 - 24 años'}, {'valor': '25a+', 'texto': '25 años o más'}
    ],
    13: [
        {'valor': 'menos_6m', 'texto': 'Menos de 6 meses'}, {'valor': '6m_1a', 'texto': '6 meses - 1 año'},
        {'valor': '1_4a', 'texto': '1 - 4 años'}, {'valor': '5_9a', 'texto': '5 - 9 años'},
        {'valor': '10_14a', 'texto': '10 - 14 años'}, {'valor': '15_19a', 'texto': '15 - 19 años'},
        {'valor': '20_24a', 'texto': '20 - 24 años'}, {'valor': '25a+', 'texto': '25 años o más'}
    ],
    14: OPCIONES_SI_NO,
    15: OPCIONES_SI_NO,
    16: OPCIONES_SI_NO,
    17: OPCIONES_SI_NO,
    18: OPCIONES_SI_NO,
    19: OPCIONES_SI_NO,
    20: OPCIONES_SI_NO,
    21: OPCIONES_SI_NO,
    22: OPCIONES_SI_NO,
    23: OPCIONES_SI_NO,
    24: OPCIONES_SI_NO,
    25: OPCIONES_SI_NO,
    26: OPCIONES_SI_NO,
    27: OPCIONES_SI_NO,
    28: OPCIONES_SI_NO,
    29: OPCIONES_SI_NO,
    30: OPCIONES_SI_NO,
    31: OPCIONES_SI_NO,
    32: OPCIONES_SI_NO,
    33: OPCIONES_SI_NO,
}


def get_opciones_pregunta(encuesta_titulo: str, tipo: str, orden: int):
    if tipo == 'escala':
        return OPCIONES_ESCALA
    if tipo == 'si_no':
        return OPCIONES_SI_NO
    if encuesta_titulo == CUESTIONARIO_1_TITULO:
        return OPCIONES_CUESTIONARIO_1.get(orden, [])
    return []
