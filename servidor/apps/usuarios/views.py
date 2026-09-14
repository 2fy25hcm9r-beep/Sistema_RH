from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import Empleado, Usuario, SolicitudResetPassword
from .serializers import (
    EmpleadoSerializer, EmpleadoListSerializer, EmpleadoDatosSerializer,
    UsuarioSerializer, CrearUsuarioSerializer,
    CambiarPasswordSerializer
)
from .serializers_forgot import ForgotPasswordSerializer
from .serializers_reset import ResetPasswordSerializer


class EsAdminDeAplicacion(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or getattr(user, 'rol', None) == 'admin')
        )


class EsAdminOUsuarioRH(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or getattr(user, 'rol', None) in ['admin', 'rh'])
        )


class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_empleado', 'nombre', 'apellido_paterno']
    ordering_fields = ['numero_empleado', 'apellido_paterno', 'fecha_alta']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [EsAdminOUsuarioRH()]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmpleadoListSerializer
        return EmpleadoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        activo = self.request.query_params.get('activo')
        puede_contestar = self.request.query_params.get('puede_contestar')

        if activo is not None:
            qs = qs.filter(activo=activo.lower() == 'true')
        if puede_contestar is not None:
            qs = qs.filter(puede_contestar_encuesta=puede_contestar.lower() == 'true')
        return qs

    @action(detail=True, methods=['patch'], url_path='toggle-acceso')
    def toggle_acceso_encuesta(self, request, pk=None):
        empleado = self.get_object()
        empleado.puede_contestar_encuesta = not empleado.puede_contestar_encuesta
        empleado.save(update_fields=['puede_contestar_encuesta'])
        return Response({
            'numero_empleado': empleado.numero_empleado,
            'nombre_completo': empleado.nombre_completo,
            'puede_contestar_encuesta': empleado.puede_contestar_encuesta,
        })

    @action(detail=False, methods=['post'], url_path='dar-de-alta-masivo')
    def alta_masiva(self, request):
        numeros = request.data.get('numeros_empleado', [])
        if not isinstance(numeros, list) or not numeros:
            return Response(
                {'error': 'Se requiere una lista de números de empleado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        actualizados = Empleado.objects.filter(
            numero_empleado__in=numeros
        ).update(puede_contestar_encuesta=True)
        return Response({'empleados_habilitados': actualizados})


class EmpleadoDatosView(APIView):
    permission_classes = [EsAdminOUsuarioRH]

    def post(self, request):
        numero_empleado = request.data.get('numero_empleado', '').strip().upper()
        if not numero_empleado:
            return Response({'error': 'Número de empleado requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            empleado = Empleado.objects.get(numero_empleado=numero_empleado, activo=True)
        except Empleado.DoesNotExist:
            return Response({'error': 'Empleado no encontrado o inactivo.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmpleadoDatosSerializer(empleado, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'mensaje': 'Datos guardados exitosamente.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('username')
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ('list', 'retrieve', 'perfil_actual', 'cambiar_password'):
            return [IsAuthenticated()]
        return [EsAdminDeAplicacion()]

    def _es_ultimo_admin(self, user):
        if user.rol != 'admin':
            return False
        admins_activos = Usuario.objects.filter(rol='admin', is_active=True).count()
        return admins_activos <= 1

    def partial_update(self, request, *args, **kwargs):
        usuario = self.get_object()
        nuevo_rol = request.data.get('rol')
        nuevo_is_active = request.data.get('is_active')

        if nuevo_is_active is False and self._es_ultimo_admin(usuario):
            return Response(
                {'error': 'No se puede desactivar al último administrador de la plataforma.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if nuevo_rol and nuevo_rol != 'admin' and self._es_ultimo_admin(usuario):
            return Response(
                {'error': 'No se puede cambiar el rol del último administrador de la plataforma.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        if 'rol' in serializer.validated_data:
            usuario = serializer.save()
            usuario.is_staff = (usuario.rol == 'admin')
            usuario.save(update_fields=['is_staff'])
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        usuario = self.get_object()
        if self._es_ultimo_admin(usuario):
            return Response(
                {'error': 'No se puede eliminar al último administrador de la plataforma.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'create':
            return CrearUsuarioSerializer
        return UsuarioSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UsuarioSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def perfil_actual(self, request):
        if request.method == 'PATCH':
            serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='cambiar-password')
    def cambiar_password(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['password_actual']):
            return Response(
                {'password_actual': 'La contraseña actual es incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data['nueva_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Contraseña actualizada correctamente.'})


class SolicitudResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            # Still return a generic message for security
            return Response({'detail': 'Si el usuario existe, recibirás una notificación para restablecer tu contraseña.'})
        
        # Create a pending reset request
        SolicitudResetPassword.objects.create(usuario=user, atendida=False)
        return Response({'detail': 'Si el usuario existe, recibirás una notificación para restablecer tu contraseña.'})


class ResetPasswordAdminView(APIView):
    permission_classes = [IsAuthenticated, EsAdminDeAplicacion]

    def get(self, request):
        solicitudes = SolicitudResetPassword.objects.filter(atendida=False).select_related('usuario')
        data = []
        for s in solicitudes:
            data.append({
                'id': s.id,
                'usuario': s.usuario.username,
                'fecha_solicitud': s.fecha_solicitud,
            })
        return Response(data)


class AprobarResetView(APIView):
    permission_classes = [IsAuthenticated, EsAdminDeAplicacion]

    def post(self, request, id):
        try:
            solicitud = SolicitudResetPassword.objects.get(id=id, atendida=False)
        except SolicitudResetPassword.DoesNotExist:
            return Response({'detail': 'Solicitud no encontrada o ya atendida.'}, status=status.HTTP_404_NOT_FOUND)
        
        nueva_password = request.data.get('nueva_password')
        if not nueva_password:
            return Response({'detail': 'La nueva contraseña es requerida.'}, status=status.HTTP_400_BAD_REQUEST)
        
        usuario = solicitud.usuario
        usuario.set_password(nueva_password)
        usuario.save(update_fields=['password'])
        
        solicitud.atendida = True
        solicitud.save(update_fields=['atendida'])
        
        return Response({'detail': 'Contraseña actualizada correctamente.'})