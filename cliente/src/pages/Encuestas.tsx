import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import type { Encuesta, Paginated, Empleado } from '../types';
import { useAuth } from '../context/AuthContext';
import styles from './Encuestas.module.css';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const BADGE: Record<string, string> = {
  borrador: styles.borrador,
  activa: styles.activa,
  cerrada: styles.cerrada,
};

function obtenerOrdenEncuesta(titulo: string): number {
  const coincidencia = titulo.match(/Cuestionario\s*(\d+)/i);
  if (!coincidencia) return 999;
  return Number(coincidencia[1]);
}

export default function Encuestas() {
  const { usuario } = useAuth();
  const esVisor = usuario?.rol === 'visor';
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAcceso, setModalAcceso] = useState<number | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<Set<string>>(new Set());
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const fetchEncuestas = async () => {
    setLoading(true);
    const { data } = await api.get<Paginated<Encuesta>>('/encuestas/');
    const ordenadas = [...data.results].sort((a, b) => {
      const ordenA = obtenerOrdenEncuesta(a.titulo);
      const ordenB = obtenerOrdenEncuesta(b.titulo);
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.titulo.localeCompare(b.titulo, 'es');
    });
    setEncuestas(ordenadas);
    setLoading(false);
  };
  useEffect(() => { fetchEncuestas(); }, []);

  useEffect(() => {
    if (modalAcceso !== null) {
      setLoadingEmpleados(true);
      api.get(`/encuestas/${modalAcceso}/empleados-no-asignados/`).then(({ data }) => setEmpleados(data)).catch(() => toast.error('Error al cargar empleados')).finally(() => setLoadingEmpleados(false));
    }
  }, [modalAcceso]);

  const activarEncuesta = async (id: number) => { await api.post(`/encuestas/${id}/activar/`); fetchEncuestas(); };
  const cerrarEncuesta = async (id: number) => { await api.post(`/encuestas/${id}/cerrar/`); fetchEncuestas(); };

  const asignarEmpleados = async () => {
    if (!modalAcceso) return;
    const lista = Array.from(empleadosSeleccionados);
    if (lista.length === 0) { toast.error('Selecciona al menos un empleado'); return; }
    try { await api.post(`/encuestas/${modalAcceso}/asignar-empleados/`, { numeros_empleado: lista }); toast.success(`${lista.length} empleado(s) asignado(s)`); setModalAcceso(null); setEmpleadosSeleccionados(new Set()); fetchEncuestas(); }
    catch { toast.error('Error al asignar empleados'); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Encuestas</h2>
      </div>

      {loading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <div className={styles.grid}>
          {encuestas.map((enc) => (
            <div key={enc.id} className={styles.card}>
              <div className={styles.cardTop}>
                <h3>{enc.titulo}</h3>
                <span className={`${styles.badge} ${BADGE[enc.estado] ?? ''}`}>{enc.estado}</span>
              </div>
              <p className={styles.desc}>{enc.descripcion || 'Sin descripción'}</p>
              <div className={styles.acciones}>
                <a href={`${FRONTEND_URL}/encuestas/${enc.id}`} className={styles.btnAccion} target="_blank" rel="noopener noreferrer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Ver
                </a>
{!esVisor && (
                   <a href={`${FRONTEND_URL}/encuesta${obtenerOrdenEncuesta(enc.titulo) <= 3 ? obtenerOrdenEncuesta(enc.titulo) : enc.id}/responder`} className={styles.btnAccion} target="_blank" rel="noopener noreferrer">
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 18a5 5 0 0 0-10 0"/><circle cx="12" cy="8" r="4"/></svg>
                     Responder
                   </a>
                 )}
                <button onClick={() => setModalAcceso(enc.id)} className={styles.btnAccion}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Asignar
                </button>
                {!esVisor && (
                  <>
                    {enc.estado === 'borrador' && (
                      <button onClick={() => activarEncuesta(enc.id)} className={styles.btnActivar}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Activar
                      </button>
                    )}
                    {enc.estado === 'activa' && (
                      <button onClick={() => cerrarEncuesta(enc.id)} className={styles.btnCerrar}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Cerrar
                      </button>
                    )}
                    {enc.estado === 'cerrada' && (
                      <button onClick={() => activarEncuesta(enc.id)} className={styles.btnActivar}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Abrir
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {encuestas.length === 0 && <p className={styles.empty}>No hay encuestas registradas.</p>}
        </div>
      )}

      {modalAcceso !== null && (
        <div className={styles.overlay} onClick={() => { setModalAcceso(null); setEmpleadosSeleccionados(new Set()); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Asignar empleados a encuesta</h3>
            <p className={styles.hint}>Selecciona los empleados que podrán responder esta encuesta.</p>
            {loadingEmpleados ? (
              <p className={styles.loading}>Cargando empleados...</p>
            ) : (
              <select multiple size={8} className={styles.selectEmpleados} value={Array.from(empleadosSeleccionados)} onChange={(e) => {
                const opciones = Array.from(e.target.selectedOptions);
                setEmpleadosSeleccionados(new Set(opciones.map(opt => opt.value)));
              }}>
                {empleados.length === 0 ? (
                  <option disabled>No hay empleados disponibles</option>
                ) : (
                  empleados.map((emp) => <option key={emp.id} value={emp.numero_empleado}>{emp.numero_empleado} - {emp.nombre_completo}</option>)
                )}
              </select>
            )}
            <div className={styles.seleccionInfo}>
              {empleadosSeleccionados.size} empleado(s) seleccionado(s)
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => { setModalAcceso(null); setEmpleadosSeleccionados(new Set()); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={asignarEmpleados} disabled={empleadosSeleccionados.size === 0}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
