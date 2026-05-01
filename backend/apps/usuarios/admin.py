from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering     = ('email',)
    list_display = ('email', 'username', 'is_staff', 'is_active')
    search_fields = ('email', 'username')

    # Formulario de CREACIÓN de usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )

    # Formulario de EDICIÓN de usuario
    fieldsets = (
        (None,           {'fields': ('username', 'email', 'password')}),
        ('Permisos',     {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups')}),
        ('Fechas',       {'fields': ('last_login', 'date_joined')}),
    )