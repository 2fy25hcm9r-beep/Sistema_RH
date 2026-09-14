from rest_framework import serializers
from .models import (
    Encuesta, Pregunta,
    AccesoEncuesta, RespuestaEncuesta, RespuestaPregunta
)
from .constants import get_opciones_pregunta, CUESTIONARIO_1_TITULO
from apps.usuarios.serializers import EmpleadoListSerializer


SECCION_I_PREGUNTAS = [14, 15, 16, 17, 18, 19]
SECCION_II_PREGUNTAS = [20, 21]
SECCION_III_PREGUNTAS = [22, 23, 24, 25, 26, 27, 28]
SECCION_IV_PREGUNTAS = [29, 30, 31, 32, 33]
TODAS_SECCIONES_TRAUMATICO = SECCION_I_PREGUNTAS + SECCION_II_PREGUNTAS + SECCION_III_PREGUNTAS + SECCION_IV_PREGUNTAS


# ---------- Preguntas ----------

class PreguntaSerializer(serializers.ModelSerializer):
    opciones = serializers.SerializerMethodField()

    class Meta:
        model = Pregunta
        fields = ['id', 'texto', 'tipo', 'tipo_puntuacion', 'orden', 'requerida', 'opciones']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['tipo'] = instance.tipo if instance.tipo in dict(Pregunta.TIPOS) else str(instance.tipo)
        return data

    def get_opciones(self, instance):
        return get_opciones_pregunta(instance.encuesta.titulo, instance.tipo, instance.orden)


# ---------- Encuestas ----------

class EncuestaListSerializer(serializers.ModelSerializer):
    total_asignados = serializers.ReadOnlyField()
    total_respondidas = serializers.ReadOnlyField()
    porcentaje_completado = serializers.ReadOnlyField()
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model = Encuesta
        fields = [
            'id', 'titulo', 'descripcion', 'estado',
            'fecha_inicio', 'fecha_fin',
            'total_asignados', 'total_respondidas', 'porcentaje_completado',
            'creado_por_nombre', 'fecha_creacion',
        ]


class EncuestaDetalleSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, required=False)
    total_asignados = serializers.ReadOnlyField()
    total_respondidas = serializers.ReadOnlyField()
    porcentaje_completado = serializers.ReadOnlyField()

    class Meta:
        model = Encuesta
        fields = [
            'id', 'titulo', 'descripcion', 'estado',
            'fecha_inicio', 'fecha_fin', 'creado_por',
            'total_asignados', 'total_respondidas', 'porcentaje_completado',
            'preguntas', 'fecha_creacion', 'fecha_modificacion',
        ]
        read_only_fields = ['creado_por']


# ---------- Accesos ----------

class AccesoEncuestaSerializer(serializers.ModelSerializer):
    empleado_info = EmpleadoListSerializer(source='empleado', read_only=True)

    class Meta:
        model = AccesoEncuesta
        fields = ['id', 'encuesta', 'empleado', 'empleado_info', 'puede_contestar', 'fecha_asignacion']
        read_only_fields = ['fecha_asignacion']


# ---------- Respuestas ----------

class RespuestaPreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaPregunta
        fields = ['pregunta', 'valor_escala', 'texto_respuesta']

    def validate(self, attrs):
        pregunta = attrs.get('pregunta')
        if pregunta.tipo == 'escala' and attrs.get('valor_escala') is None:
            raise serializers.ValidationError(
                {'valor_escala': 'Este campo es requerido para preguntas de escala.'}
            )
        return attrs


class EnviarRespuestaSerializer(serializers.Serializer):
    pregunta = serializers.PrimaryKeyRelatedField(queryset=Pregunta.objects.select_related('encuesta').all())
    valor_escala = serializers.IntegerField(required=False, allow_null=True)
    texto_respuesta = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        pregunta = attrs.get('pregunta')
        if pregunta.tipo == 'escala' and attrs.get('valor_escala') is None:
            raise serializers.ValidationError(
                {'valor_escala': 'Este campo es requerido para preguntas de escala.'}
            )
        return attrs


class EnviarRespuestaEncuestaSerializer(serializers.Serializer):
    numero_empleado = serializers.CharField()
    respuestas = EnviarRespuestaSerializer(many=True)

    def validate_numero_empleado(self, value):
        from apps.usuarios.models import Empleado
        try:
            empleado = Empleado.objects.get(
                numero_empleado=value.strip().upper(),
                activo=True
            )
        except Empleado.DoesNotExist:
            raise serializers.ValidationError(
                'Número de empleado no encontrado o inactivo.'
            )
        self._empleado = empleado
        return value

    def validate(self, attrs):
        respuestas = attrs.get('respuestas', [])
        
        if not respuestas:
            raise serializers.ValidationError({'respuestas': 'Se requiere al menos una respuesta.'})
        
        errores = {}
        
        primera_pregunta = respuestas[0]['pregunta']
        from .models import Encuesta
        encuesta = Encuesta.objects.filter(id=primera_pregunta.encuesta_id).first()
        
        if encuesta and encuesta.titulo == CUESTIONARIO_1_TITULO:
            respuestas_dict = {r['pregunta'].orden: r for r in respuestas}
            
            evento_si = False
            for orden in SECCION_I_PREGUNTAS:
                resp = respuestas_dict.get(orden)
                if resp:
                    valor = str(
                        resp.get('texto_respuesta') or 
                        resp.get('valor_escala') or ''
                    ).lower()
                    if valor == 'si' or valor == 'sí':
                        evento_si = True
                        break
            
            if evento_si:
                preguntas_requeridas = SECCION_II_PREGUNTAS + SECCION_III_PREGUNTAS + SECCION_IV_PREGUNTAS
                for orden in preguntas_requeridas:
                    if orden not in respuestas_dict:
                        errores[f'pregunta_{orden}'] = 'Esta pregunta es obligatoria cuando hay evento traumático.'
            
            def _es_si(v: str) -> bool:
                v_lower = v.lower()
                return v_lower == 'si' or v_lower == 'sí'

            si_sec_ii = sum(
                1 for o in SECCION_II_PREGUNTAS 
                if _es_si(str(respuestas_dict.get(o, {}).get('texto_respuesta') or 
                       respuestas_dict.get(o, {}).get('valor_escala') or ''))
            )
            si_sec_iii = sum(
                1 for o in SECCION_III_PREGUNTAS 
                if _es_si(str(respuestas_dict.get(o, {}).get('texto_respuesta') or 
                       respuestas_dict.get(o, {}).get('valor_escala') or ''))
            )
            si_sec_iv = sum(
                1 for o in SECCION_IV_PREGUNTAS 
                if _es_si(str(respuestas_dict.get(o, {}).get('texto_respuesta') or 
                       respuestas_dict.get(o, {}).get('valor_escala') or ''))
            )
            
            if evento_si:
                attrs['_requiere_clinica'] = si_sec_ii >= 1 or si_sec_iii >= 3 or si_sec_iv >= 2
            else:
                attrs['_requiere_clinica'] = False
        
        if errores:
            raise serializers.ValidationError(errores)
        
        return attrs

    @property
    def requiere_atencion_clinica(self):
        if not hasattr(self, '_requiere_clinica'):
            return False
        return self._requiere_clinica


class RespuestaEncuestaSerializer(serializers.ModelSerializer):
    puntaje_condiciones_trabajo = serializers.ReadOnlyField()
    nivel_riesgo = serializers.ReadOnlyField()
    empleado_info = EmpleadoListSerializer(source='empleado', read_only=True)
    respuestas_preguntas = RespuestaPreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = RespuestaEncuesta
        fields = [
            'id', 'encuesta', 'empleado', 'empleado_info',
            'fecha_inicio_respuesta', 'fecha_completado',
            'puntaje_condiciones_trabajo', 'nivel_riesgo',
        ]