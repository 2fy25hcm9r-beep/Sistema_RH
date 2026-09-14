from django.db.models import Avg, Count, Q, Prefetch
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.usuarios.models import Empleado, Usuario
from .models import (
    Encuesta, Pregunta,
    AccesoEncuesta, RespuestaEncuesta
)
from .services import guardar_respuesta_encuesta
from .serializers import (
    EncuestaListSerializer, EncuestaDetalleSerializer,
    PreguntaSerializer, AccesoEncuestaSerializer,
    RespuestaEncuestaSerializer, EnviarRespuestaEncuestaSerializer,
    SECCION_II_PREGUNTAS, SECCION_III_PREGUNTAS, SECCION_IV_PREGUNTAS
)
from .constants import CUESTIONARIO_1_TITULO

class EncuestaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_inicio', 'estado']

    def get_permissions(self):
        if self.action in ('retrieve', 'validar_empleado', 'responder'):
            return [AllowAny()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def _verificar_permiso_admin_o_rh(self, request):
        rol = getattr(request.user, 'rol', None)
        if rol not in ('admin', 'rh'):
            return Response(
                {'error': 'No tienes permisos para realizar esta acción.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    @action(detail=True, methods=['post'], url_path='activar')
    def activar_encuesta(self, request, pk=None):
        error = self._verificar_permiso_admin_o_rh(request)
        if error: return error
        encuesta = self.get_object()
        encuesta.estado = 'activa'
        encuesta.save()
        return Response({'mensaje': 'Encuesta activada exitosamente.'})

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_encuesta(self, request, pk=None):
        error = self._verificar_permiso_admin_o_rh(request)
        if error: return error
        encuesta = self.get_object()
        encuesta.estado = 'cerrada'
        encuesta.save()
        return Response({'mensaje': 'Encuesta cerrada exitosamente.'})

    @action(detail=True, methods=['get'], url_path='empleados-no-asignados')
    def empleados_no_asignados(self, request, pk=None):
        encuesta = self.get_object()
        empleados_asignados = AccesoEncuesta.objects.filter(encuesta=encuesta).values_list('empleado_id', flat=True)
        empleados = Empleado.objects.filter(
            activo=True,
            puede_contestar_encuesta=True
        ).exclude(id__in=empleados_asignados)
        from apps.usuarios.serializers import EmpleadoListSerializer
        serializer = EmpleadoListSerializer(empleados, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='preguntas')
    def crear_pregunta(self, request, pk=None):
        """Crea una pregunta para la encuesta especificada."""
        encuesta = self.get_object()
        serializer = PreguntaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(encuesta=encuesta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        usuarios_prefetch = Prefetch('creado_por', queryset=Usuario.objects.order_by('username'))
        return Encuesta.objects.prefetch_related(
            usuarios_prefetch,
            'preguntas', 'accesos', 'respuestas'
        ).all()

    def get_serializer_class(self):
        if self.action == 'list':
            return EncuestaListSerializer
        return EncuestaDetalleSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['post'], url_path='asignar-empleados')
    def asignar_empleados(self, request, pk=None):
        """Asigna empleados a la encuesta por números de empleado."""
        encuesta = self.get_object()
        numeros = request.data.get('numeros_empleado', [])
        if not isinstance(numeros, list):
            return Response(
                {'error': 'Se requiere una lista de números de empleado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empleados = Empleado.objects.filter(
            numero_empleado__in=[n.strip().upper() for n in numeros],
            activo=True,
            puede_contestar_encuesta=True
        )
        creados, omitidos = 0, 0
        for empleado in empleados:
            _, created = AccesoEncuesta.objects.get_or_create(
                encuesta=encuesta,
                empleado=empleado,
                defaults={'puede_contestar': True}
            )
            if created:
                creados += 1
            else:
                omitidos += 1

        no_encontrados = set(n.strip().upper() for n in numeros) - set(
            empleados.values_list('numero_empleado', flat=True)
        )
        return Response({
            'asignados': creados,
            'ya_existentes': omitidos,
            'no_encontrados': list(no_encontrados),
        })

    @action(detail=True, methods=['get'], url_path='empleados-asignados')
    def empleados_asignados(self, request, pk=None):
        encuesta = self.get_object()
        accesos = AccesoEncuesta.objects.filter(encuesta=encuesta).select_related('empleado')
        serializer = AccesoEncuestaSerializer(accesos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='validar-empleado', permission_classes=[AllowAny], authentication_classes=[])
    def validar_empleado(self, request, pk=None):
        """
        Endpoint público para validar si un empleado puede acceder a la encuesta.
        """
        encuesta = self.get_object()

        if encuesta.estado != 'activa':
            return Response(
                {'error': 'Esta encuesta no está activa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_empleado = request.data.get('numero_empleado', '').strip().upper()
        if not numero_empleado:
            return Response(
                {'error': 'Número de empleado requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            empleado = Empleado.objects.get(
                numero_empleado=numero_empleado,
                activo=True
            )
        except Empleado.DoesNotExist:
            return Response(
                {'error': 'Número de empleado no encontrado o inactivo.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar empleado activo
        if not empleado.activo:
            return Response(
                {'error': 'Tu cuenta está inactiva. Contacta a Recursos Humanos.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verificar que no haya respondido ya
        if RespuestaEncuesta.objects.filter(encuesta=encuesta, empleado=empleado, completada=True).exists():
            return Response(
                {'error': 'La encuesta ya fue respondida.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'mensaje': 'Validación exitosa.', 'empleado': empleado.nombre_completo})

    @action(detail=True, methods=['post'], url_path='responder', permission_classes=[AllowAny], authentication_classes=[])
    def responder(self, request, pk=None):
        encuesta = self.get_object()

        if encuesta.estado != 'activa':
            return Response(
                {'error': 'Esta encuesta no está activa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EnviarRespuestaEncuestaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        empleado = serializer._empleado
        respuestas_data = serializer.validated_data['respuestas']
        resultado = guardar_respuesta_encuesta(encuesta=encuesta, empleado=empleado, respuestas_data=respuestas_data)

        respuesta_payload = {'mensaje': 'Encuesta completada exitosamente.'}
        if resultado.nivel_riesgo is not None:
            respuesta_payload.update({'puntaje': resultado.puntaje_total, 'nivel_riesgo': resultado.nivel_riesgo})
        
        requiere_clinica = False
        if encuesta.titulo == CUESTIONARIO_1_TITULO:
            def _es_si(v: str) -> bool:
                v_lower = v.lower()
                return v_lower == 'si' or v_lower == 'si'

            respuestas_dict = {r['pregunta'].orden: r for r in respuestas_data}
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
            requiere_clinica = si_sec_ii >= 1 or si_sec_iii >= 3 or si_sec_iv >= 2

        respuesta_payload['requiere_atencion_clinica'] = requiere_clinica
        return Response(respuesta_payload)

    @action(detail=True, methods=['get'], url_path='progreso')
    def progreso(self, request, pk=None):
        """Resumen de progreso de la encuesta."""
        encuesta = self.get_object()
        return Response({
            'encuesta_id': encuesta.id,
            'titulo': encuesta.titulo,
            'estado': encuesta.estado,
            'fecha_inicio': encuesta.fecha_inicio,
            'fecha_fin': encuesta.fecha_fin,
            'total_asignados': encuesta.total_asignados,
            'total_respondidas': encuesta.total_respondidas,
            'porcentaje_completado': encuesta.porcentaje_completado,
        })


class PreguntaViewSet(viewsets.ModelViewSet):
    serializer_class = PreguntaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pregunta.objects.filter(
            encuesta_id=self.kwargs.get('encuesta_pk')
        )

    def perform_create(self, serializer):
        encuesta = Encuesta.objects.get(pk=self.kwargs['encuesta_pk'])
        serializer.save(encuesta=encuesta)


class RespuestaEncuestaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RespuestaEncuestaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_completado', 'puntaje_total']

    def get_queryset(self):
        return RespuestaEncuesta.objects.select_related(
            'empleado',
            'encuesta',
            'encuesta__creado_por'
        ).prefetch_related(
            'respuestas_preguntas'
        ).filter(
            encuesta_id=self.kwargs.get('encuesta_pk')
        )
