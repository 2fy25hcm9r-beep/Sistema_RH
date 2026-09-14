from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.usuarios.models import Usuario
from django.core.exceptions import ValidationError
from django.conf import settings
from django.http import HttpResponse
import os

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get('password')
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            raise ValidationError('Invalid credentials')
        if not user.check_password(password):
            raise ValidationError('Invalid credentials')
        if not user.is_active:
            raise ValidationError('User is not active')
        refresh = self.get_token(user)
        data = {'refresh': str(refresh), 'access': str(refresh.access_token)}
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

def frontend_view(request):
    index_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    return HttpResponse('Frontend no compilado. Ejecuta npm run build.', status=503)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/', include('apps.encuestas.urls')),
    path('api/reportes/', include('apps.reportes.urls')),
    path('', frontend_view),
    re_path(r'^(?!api/).*$', frontend_view),
]