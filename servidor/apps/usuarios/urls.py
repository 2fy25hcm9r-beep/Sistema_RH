from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import EmpleadoViewSet, UsuarioViewSet, EmpleadoDatosView, SolicitudResetPasswordView, ResetPasswordAdminView, AprobarResetView

router = SimpleRouter()
router.register(r'empleados', EmpleadoViewSet, basename='empleado')
router.register(r'cuentas', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('', include(router.urls)),
    path('recuperar-password/', SolicitudResetPasswordView.as_view(), name='recuperar-password'),
    path('solicitudes-reset/', ResetPasswordAdminView.as_view(), name='solicitudes-reset'),
    path('aprobar-reset/<int:id>/', AprobarResetView.as_view(), name='aprobar-reset'),
    path('empleado-datos/', EmpleadoDatosView.as_view(), name='empleado-datos'),
]
