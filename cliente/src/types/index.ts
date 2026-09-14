// ---- Autenticación ----
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  rol: 'admin' | 'rh' | 'visor';
  is_active: boolean;

}

// ---- Empleados ----
export interface Empleado {
  id: number;
  numero_empleado: string;
  nombre_completo: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  activo: boolean;
  puede_contestar_encuesta: boolean;
  fecha_alta: string;
  sexo?: string;
  edad?: string;
  estado_civil?: string;
  nivel_estudios?: string;
  ocupacion?: string;
  departamento?: string;
  tipo_puesto?: string;
  tipo_contratacion?: string;
  tipo_personal?: string;
  tipo_jornada?: string;
  rotacion_turnos?: string;
  tiempo_puesto_actual?: string;
  tiempo_experiencia?: string;
}

// ---- Encuestas ----
export type TipoPregunta = 'escala' | 'opcion_multiple' | 'si_no' | 'texto_libre';
export type EstadoEncuesta = 'borrador' | 'activa' | 'cerrada';

export interface OpcionPregunta {
  valor: string | number;
  texto: string;
}

export interface Pregunta {
  id: number;
  texto: string;
  tipo: TipoPregunta;
  tipo_puntuacion: 'directa' | 'invertida';
  orden: number;
  requerida: boolean;
  opciones?: OpcionPregunta[];
}

export interface Encuesta {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoEncuesta;
  fecha_inicio: string;
  fecha_fin: string;
  total_asignados: number;
  total_respondidas: number;
  porcentaje_completado: number;
  creado_por_nombre: string;
  preguntas?: Pregunta[];
}

// ---- Reportes ----
export interface EmpleadoRiesgo {
  empleado__numero_empleado: string;
  empleado__nombre: string;
  empleado__apellido_paterno: string;
  empleado__apellido_materno: string;
  nivel_riesgo: string;
  puntaje_total: string;
}

export interface DashboardData {
  total_empleados: number;
  empleados_habilitados: number;
  total_encuestas: number;
  encuestas_activas: number;
  total_respuestas: number;
  puntaje_promedio_global: number | null;
  puntaje_ponderado: number | null;
  preguntas_directas: number;
  preguntas_invertidas: number;
  alto: number;
  muy_alto: number;
  atencion_clinica: number;
  empleados_riesgo_alto: EmpleadoRiesgo[];
}

export interface DataPeriodo {
  periodo: string;
  total_respuestas: number;
  puntaje_promedio: number | null;
}

export interface RendimientoPregunta {
  pregunta_id: number;
  pregunta: string;
  orden: number;
  promedio: number | null;
  total_respuestas: number;
  total_asignados: number;
}

// ---- Paginación ----
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
