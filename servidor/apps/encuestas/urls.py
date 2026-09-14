from django.urls import include
from rest_framework.routers import SimpleRouter
from .views import EncuestaViewSet

router = SimpleRouter()
router.register(r'encuestas', EncuestaViewSet, basename='encuesta')

urlpatterns = router.urls
