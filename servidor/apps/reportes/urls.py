from django.urls import path
from .views import (
    DashboardGeneralView,
    DistribucionEscalaView,
    DistribucionPorDiaView,
    DistribucionRiesgoView,
    ListaEmpleadosRespuestasView,
    RespuestasEmpleadoView,
)

urlpatterns = [
    path('dashboard/', DashboardGeneralView.as_view(), name='dashboard-general'),
    path('distribucion-escala/', DistribucionEscalaView.as_view(), name='distribucion-escala'),
    path('distribucion-dia/', DistribucionPorDiaView.as_view(), name='distribucion-dia'),
    path('distribucion-riesgo/', DistribucionRiesgoView.as_view(), name='distribucion-riesgo'),
    path('empleados-respuestas/', ListaEmpleadosRespuestasView.as_view(), name='empleados-respuestas'),
    path('empleado/<int:respuesta_id>/respuestas/', RespuestasEmpleadoView.as_view(), name='empleado-respuestas'),
]
