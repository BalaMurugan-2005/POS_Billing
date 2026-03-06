from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesInsightsViewSet

router = DefaultRouter()
router.register(r'', SalesInsightsViewSet, basename='sales-insights')

urlpatterns = [
    path('', include(router.urls)),
]