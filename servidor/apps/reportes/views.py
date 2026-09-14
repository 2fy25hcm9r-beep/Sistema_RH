from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services import (
    resumen_dashboard,
    distribucion_escala,
    distribucion_dia,
    distribucion_riesgo,
    listar_empleados_respuestas,
    detalle_respuesta_empleado,
)


class DashboardGeneralView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        titulo = request.query_params.get('titulo')
        return Response(resumen_dashboard(titulo))


class DistribucionEscalaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(distribucion_escala())


class DistribucionPorDiaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(distribucion_dia())


class DistribucionRiesgoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        titulo = request.query_params.get('titulo')
        return Response(distribucion_riesgo(titulo))


class ListaEmpleadosRespuestasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        encuesta_id = request.query_params.get('encuesta_id')
        return Response(listar_empleados_respuestas(int(encuesta_id)) if encuesta_id else listar_empleados_respuestas())


class RespuestasEmpleadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, respuesta_id):
        detalle = detalle_respuesta_empleado(respuesta_id)
        if detalle is None:
            return Response({'error': 'Respuesta no encontrada'}, status=404)
        return Response(detalle)
