from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Empleado


class EmpleadoListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Empleado
        fields = [
            'id', 'numero_empleado', 'nombre_completo', 'nombre',
            'apellido_paterno', 'apellido_materno',
            'activo', 'puede_contestar_encuesta', 'fecha_alta',
        ]


class EmpleadoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Empleado
        fields = '__all__'

    def validate_numero_empleado(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError('El número de empleado no puede estar vacío.')
        return value


class EmpleadoDatosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = [
            'sexo', 'edad', 'estado_civil', 'nivel_estudios',
            'ocupacion', 'departamento', 'tipo_puesto', 'tipo_contratacion',
            'tipo_personal', 'tipo_jornada', 'rotacion_turnos',
            'tiempo_puesto_actual', 'tiempo_experiencia',
            'accidente_grave', 'asalto', 'actos_violentos', 'secuestro', 'amenazas', 'otro_riesgo_vida_salud',
            'recuerdos_recurrentes_malestar', 'suenos_recurrentes_malestar',
            'evitar_sentimientos_conversaciones', 'evitar_actividades_lugares_personas',
            'dificultad_recordar_evento', 'disminuye_interes_actividades',
            'sensacion_alejamiento', 'dificultad_expresar_sentimientos', 'vida_futuro_limitado',
            'dificultad_dormir', 'irritable_arranos_coraje',
            'dificultad_concentrarse', 'nervioso_alerta', 'sobresalta_facilmente'
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(required=True)
    nueva_password = serializers.CharField(required=True, validators=[validate_password])
    confirmar_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['nueva_password'] != attrs['confirmar_password']:
            raise serializers.ValidationError({'confirmar_password': 'Las contraseñas no coinciden.'})
        return attrs


class CrearUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'first_name', 'last_name', 'rol', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            attrs['rol'] = 'visor'
        elif not (request.user.is_staff or getattr(request.user, 'rol', None) == 'admin'):
            attrs['rol'] = 'visor'
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password2')
        validated_data.pop('password')
        rol = validated_data.get('rol', 'visor')
        validated_data['is_staff'] = (rol == 'admin') if rol == 'admin' else validated_data.get('is_staff', False)
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            rol=validated_data.get('rol', 'visor'),
            password=password
        )
        return user
