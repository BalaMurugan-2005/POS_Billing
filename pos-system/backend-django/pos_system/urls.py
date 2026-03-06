"""
URL configuration for pos_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger schema view
schema_view = get_schema_view(
    openapi.Info(
        title="POS System API",
        default_version='v1',
        description="Point of Sale System API Documentation",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@pos.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # API endpoints
    path('api/', include('api.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/reporting/', include('reporting.urls')),
    path('api/sales-insights/', include('sales_insights.urls')),
    
    # path('__debug__/', include('debug_toolbar.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)