from django.contrib import admin
from .models import Usuario, Empleado


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_empleado', 'nombre_completo',
        'activo', 'puede_contestar_encuesta', 'fecha_alta'
    ]
    list_filter = ['activo', 'puede_contestar_encuesta']
    search_fields = ['numero_empleado', 'nombre', 'apellido_paterno']
    list_editable = ['puede_contestar_encuesta', 'activo']
    ordering = ['apellido_paterno', 'nombre']


from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'rol')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'rol', 'is_active', 'is_staff', 'is_superuser'),
        }),
    )
    list_display = ['username', 'first_name', 'last_name', 'rol', 'is_active']
    list_filter = ['rol', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'first_name', 'last_name']
    ordering = ['username']
