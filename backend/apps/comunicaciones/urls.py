from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    ConversacionViewSet,
    MensajeGeneralViewSet,
    MiConversacionView, ReaccionView
)

router = DefaultRouter()
router.register(r'conversaciones', ConversacionViewSet,
                basename='conversacion')
router.register(r'chat-general', MensajeGeneralViewSet,
                basename='chat-general')

urlpatterns = [
    path('mi-conversacion/', MiConversacionView.as_view(),
         name='mi-conversacion'),
    path('chat-general/<int:mensaje_id>/reaccionar/', ReaccionView.as_view(), 
         name='reaccionar'),
] + router.urls