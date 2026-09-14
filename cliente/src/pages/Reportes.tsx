import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import type { Paginated } from '../types';
import styles from './Reportes.module.css';
import { obtenerNumeroPreguntaVisible } from '../utils/encuestas';
import { esSi } from '../utils/encuestas';

interface EmpleadoRespuesta {
  id: number;
  empleado_id: number;
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  puntaje: number;
  nivel_riesgo: string;
  fecha: string;
}

interface PreguntaRespuesta {
  orden: number;
  texto: string;
  tipo_pregunta: string;
  tipo_puntuacion: string;
  valor_escala: number | null;
  respuesta_texto: string;
}

interface DetalleEmpleado {
  empleado: {
    nombre_completo: string;
    numero_empleado: string;
  };
  puntaje: number;
  nivel_riesgo: string;
  fecha: string;
  preguntas: PreguntaRespuesta[];
}

interface Encuesta {
  id: number;
  titulo: string;
}

const PREGUNTAS_SECCION_II = [20, 21];
const PREGUNTAS_SECCION_III = [22, 23, 24, 25, 26, 27, 28];
const PREGUNTAS_SECCION_IV = [29, 30, 31, 32, 33];

export default function Reportes() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [encuestaId, setEncuestaId] = useState<number | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoRespuesta[]>([]);
  const [detalleEmpleado, setDetalleEmpleado] = useState<DetalleEmpleado | null>(null);
  const [loading, setLoading] = useState(true);

  const calcularAtencionClinicaPreguntas = (preguntas: PreguntaRespuesta[]): Set<number> => {
    const set = new Set<number>();
    const countSeccionIII = preguntas.filter(p => PREGUNTAS_SECCION_III.includes(p.orden) && esSi(p.respuesta_texto)).length;
    const countSeccionIV = preguntas.filter(p => PREGUNTAS_SECCION_IV.includes(p.orden) && esSi(p.respuesta_texto)).length;
    
    preguntas.forEach(p => {
      if (PREGUNTAS_SECCION_II.includes(p.orden) && esSi(p.respuesta_texto)) {
        set.add(p.orden);
      }
      if (PREGUNTAS_SECCION_III.includes(p.orden) && esSi(p.respuesta_texto)) {
        if (countSeccionIII >= 3) set.add(p.orden);
      }
      if (PREGUNTAS_SECCION_IV.includes(p.orden) && esSi(p.respuesta_texto)) {
        if (countSeccionIV >= 2) set.add(p.orden);
      }
    });
    return set;
  };

  const preguntasAtencionClinica = detalleEmpleado ? calcularAtencionClinicaPreguntas(detalleEmpleado.preguntas) : new Set<number>();

  // Cargar lista de encuestas al montar
  useEffect(() => {
    const fetchEncuestas = async () => {
      try {
        const { data } = await api.get<Paginated<Encuesta>>('/encuestas/?search=Cuestionario');
        // Ordenar encuestas por título (ej. Cuestionario 1, Cuestionario 2...)
        const encuestasOrdenadas = data.results.sort((a, b) => a.titulo.localeCompare(b.titulo));
        setEncuestas(encuestasOrdenadas);
        if (encuestasOrdenadas.length > 0) {
          setEncuestaId(encuestasOrdenadas[0].id);
        } else {
          setLoading(false);
        }
      } catch {
        toast.error('Error al cargar los cuestionarios');
        setLoading(false);
      }
    };
    fetchEncuestas();
  }, []);

  // Cargar empleados cuando cambia la encuesta seleccionada
  useEffect(() => {
    if (encuestaId === null) return;
    setLoading(true);
    setDetalleEmpleado(null);
    api.get<EmpleadoRespuesta[]>(`/reportes/empleados-respuestas/?encuesta_id=${encuestaId}`)
      .then(({ data }) => setEmpleados(data))
      .catch(() => toast.error('Error al cargar empleados'))
      .finally(() => setLoading(false));
  }, [encuestaId]);

  const verRespuestas = async (respuestaId: number) => {
    try {
      const { data } = await api.get<DetalleEmpleado>(`/reportes/empleado/${respuestaId}/respuestas/`);
      setDetalleEmpleado(data);
    } catch {
      toast.error('Error al cargar respuestas del empleado');
    }
  };

  const getRiesgoColor = (nivel: string) => {
    const niveles: Record<string, string> = {
      'nulo': '#27ae60',
      'bajo': '#2ecc71',
      'medio': '#f39c12',
      'alto': '#e67e22',
      'muy_alto': '#e74c3c',
    };
    return niveles[nivel?.toLowerCase()] || '#27ae60';
  };

  const getRiesgoLabel = (nivel: string) => {
    const niveles: Record<string, string> = {
      'nulo': 'Nulo',
      'bajo': 'Bajo',
      'medio': 'Medio',
      'alto': 'Alto',
      'muy_alto': 'Muy alto',
    };
    return niveles[nivel?.toLowerCase()] || 'Nulo';
  };

  const isCuestionario1 = encuestas.find(e => e.id === encuestaId)?.titulo === 'Cuestionario 1';

  if (loading) return <div className={styles.page}><div className={styles.loading}>Cargando...</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Análisis por empleado</h2>
      </div>

      {!detalleEmpleado && encuestas.length > 0 && (
        <div className={styles.tabsContainer}>
          {encuestas.map((enc) => (
            <button
              key={enc.id}
              className={`${styles.tab} ${encuestaId === enc.id ? styles.activeTab : ''}`}
              onClick={() => setEncuestaId(enc.id)}
            >
              {enc.titulo}
            </button>
          ))}
        </div>
      )}

      {detalleEmpleado ? (
        <div className={styles.card}>
          <div className={styles.cabecera}>
            <div>
              <h3>{detalleEmpleado.empleado.nombre_completo}</h3>
              <p>ID: {detalleEmpleado.empleado.numero_empleado} | Fecha: {detalleEmpleado.fecha} {!isCuestionario1 && `| Puntaje: ${detalleEmpleado.puntaje} pts`}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                className={styles.badge}
                style={isCuestionario1 
                  ? { background: detalleEmpleado.nivel_riesgo === 'Si' ? '#fdecea' : '#eafaf1', color: detalleEmpleado.nivel_riesgo === 'Si' ? '#e74c3c' : '#27ae60' }
                  : { background: getRiesgoColor(detalleEmpleado.nivel_riesgo) + '20', color: getRiesgoColor(detalleEmpleado.nivel_riesgo) }}
              >
                {isCuestionario1 
                  ? `Requiere atención: ${detalleEmpleado.nivel_riesgo === 'Si' ? 'Sí' : 'No'}`
                  : `Riesgo: ${getRiesgoLabel(detalleEmpleado.nivel_riesgo)}`}
              </span>
              <button onClick={() => setDetalleEmpleado(null)} className={styles.btnVolver}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Volver
              </button>
            </div>
          </div>
          <div className={styles.detallePreguntas}>
            {detalleEmpleado.preguntas.map((pregunta) => {
              const numeroMostrar = obtenerNumeroPreguntaVisible(pregunta.texto, pregunta.orden);
              
              return (
                <div
                  key={pregunta.orden}
                  className={styles.preguntaItem}
                  style={{ borderLeft: `4px solid ${pregunta.tipo_puntuacion === 'invertida' ? '#9b59b6' : '#2980b9'}` }}
                >
                  <div className={styles.preguntaHeader}>
                    {numeroMostrar !== null && <span className={styles.preguntaNumero}>P{numeroMostrar}</span>}
                    <span
                      className={styles.badge}
                      style={{ background: pregunta.tipo_puntuacion === 'invertida' ? '#f5eef8' : '#eaf4fb', color: pregunta.tipo_puntuacion === 'invertida' ? '#9b59b6' : '#2980b9' }}
                    >
                      {pregunta.tipo_puntuacion === 'invertida' ? 'Invertida' : 'Directa'}
                    </span>
                  </div>
                  <p className={styles.preguntaTexto}>{pregunta.texto}</p>
                  <div className={styles.respuestaContainer}>
                    <span
                      className={styles.badge}
                      style={{
                        background: isCuestionario1 && detalleEmpleado.nivel_riesgo === 'Si' && preguntasAtencionClinica.has(pregunta.orden) ? '#fff3cd' : '#d5f5e3',
                        color: isCuestionario1 && detalleEmpleado.nivel_riesgo === 'Si' && preguntasAtencionClinica.has(pregunta.orden) ? '#856404' : '#27ae60'
                      }}
                    >
                      {pregunta.respuesta_texto}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                {!isCuestionario1 && <th>Puntaje</th>}
                <th>{isCuestionario1 ? 'Requiere atención' : 'Riesgo'}</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id}>
                  <td className={styles.nombreEmpleado}>
                    <div>{emp.nombre_completo}</div>
                    <div className={styles.idEmpleado}>ID: {emp.numero_empleado}</div>
                  </td>
                  {!isCuestionario1 && <td style={{ fontWeight: 600 }}>{emp.puntaje} pts</td>}
                  <td>
                    {isCuestionario1 ? (
                      <span
                        className={styles.badge}
                        style={{ background: emp.nivel_riesgo === 'Si' ? '#fdecea' : '#eafaf1', color: emp.nivel_riesgo === 'Si' ? '#e74c3c' : '#27ae60' }}
                      >
                        {emp.nivel_riesgo === 'Si' ? 'Sí' : 'No'}
                      </span>
                    ) : (
                      <span
                        className={styles.badge}
                        style={{ background: getRiesgoColor(emp.nivel_riesgo) + '20', color: getRiesgoColor(emp.nivel_riesgo) }}
                      >
                        {getRiesgoLabel(emp.nivel_riesgo)}
                      </span>
                    )}
                  </td>
                  <td className={styles.fecha}>{emp.fecha}</td>
                  <td>
                    <button onClick={() => verRespuestas(emp.id)} className={styles.btnVer}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr><td colSpan={isCuestionario1 ? 4 : 5} className={styles.empty}>No hay respuestas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
