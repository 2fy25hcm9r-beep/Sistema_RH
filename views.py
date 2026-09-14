from django.views.generic import TemplateView
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
import os

class FrontendAppView(TemplateView):
    def get(self, request, *args, **kwargs):
        index_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read())
        return HttpResponse('Frontend no compilado. Ejecuta npm run build.', status=503)