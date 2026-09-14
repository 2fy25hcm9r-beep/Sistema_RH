import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import type { Encuesta, Pregunta } from '../types';
import styles from './EncuestaDetalle.module.css';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

function obtenerOrdenEncuesta(titulo: string): number {
  const coincidencia = titulo.match(/Cuestionario\s*(\d+)/i);
  if (!coincidencia) return 999;
  return Number(coincidencia[1]);
}

export default function EncuestaDetalle() {
  const { id } = useParams<{ id: string }>();
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [modalPregunta, setModalPregunta] = useState(false);
  const [pregForm, setPregForm] = useState<Partial<Pregunta>>({ tipo: 'escala', orden: 1, requerida: true, tipo_puntuacion: 'directa' });
  const [error, setError] = useState('');

  const fetchEncuesta = async () => {
    const { data } = await api.get<Encuesta>(`/encuestas/${id}/`);
    setEncuesta(data);
  };

  useEffect(() => { fetchEncuesta(); }, [id]);

  const guardarPregunta = async () => {
    setError('');
    try {
      await api.post(`/encuestas/${id}/preguntas/`, { texto: pregForm.texto, tipo: pregForm.tipo, tipo_puntuacion: 'directa', orden: pregForm.orden, requerida: pregForm.requerida });
      setModalPregunta(false);
      setPregForm({ tipo: 'escala', orden: 1, requerida: true });
      fetchEncuesta();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      setError(data && typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n') : 'Error al guardar la pregunta.');
    }
  };

  if (!encuesta) return <div className={styles.page}><p className={styles.loading}>Cargando encuesta...</p></div>;

  return (
    <div className={styles.page}>
      <Link to="/encuestas" className={styles.breadcrumb}>← Encuestas</Link>

      <div className={styles.cabecera}>
        <div>
          <h2>{encuesta.titulo}</h2>
          <p>{encuesta.descripcion}</p>
<p className={styles.fechas}>{encuesta.fecha_inicio} - {encuesta.fecha_fin}</p>
          {encuesta.estado === 'activa' && (
            <button onClick={() => { 
              const orden = obtenerOrdenEncuesta(encuesta.titulo);
              const path = orden <= 3 
                ? `${FRONTEND_URL}/encuesta${orden}/responder` 
                : `${FRONTEND_URL}/encuesta/${encuesta.id}/responder`;
              navigator.clipboard.writeText(path); 
              toast.success('Link copiado'); 
            }} className={styles.btnLink}>
              📋 Copiar link para empleados
            </button>
          )}
        </div>
        <div className={styles.stats}>
          {[{ v: encuesta.total_asignados, l: 'Asignados' }, { v: encuesta.total_respondidas, l: 'Respondidas' }, { v: `${encuesta.porcentaje_completado}%`, l: 'Completado' }].map(({ v, l }) => (
            <div key={l} className={styles.stat}>
              <span>{v}</span>
              <label>{l}</label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.seccion}>
        <div className={styles.seccionHeader}>
          <h3>Preguntas ({encuesta.preguntas?.length ?? 0})</h3>
          {encuesta.estado === 'borrador' && (
            <button onClick={() => setModalPregunta(true)} className={styles.btnPrimary}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar
            </button>
          )}
        </div>

        {(encuesta.preguntas ?? []).length === 0 ? (
          <p className={styles.empty}>Esta encuesta no tiene preguntas aún.</p>
        ) : (
          <div className={styles.preguntas}>
            {(encuesta.preguntas ?? []).map((p) => (
              <div key={p.id} className={styles.pregunta}>
                <div className={styles.pregNum}>P{p.orden}</div>
                <div className={styles.pregBody}>
                  <p>{p.texto}</p>
                  <div className={styles.badges}>
                    <span className={styles.tipo}>{p.tipo.replace('_', ' ')}</span>
                    <span className={p.tipo_puntuacion === 'invertida' ? styles.invertida : styles.directa}>
                      {p.tipo_puntuacion === 'invertida' ? 'Invertida' : 'Directa'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalPregunta && (
        <div className={styles.overlay} onClick={() => setModalPregunta(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Nueva pregunta</h3>
            <div className={styles.form}>
              <label>
                <span>Texto *</span>
                <input value={pregForm.texto ?? ''} onChange={(e) => setPregForm({ ...pregForm, texto: e.target.value })} />
              </label>
              <label>
                <span>Tipo *</span>
                <select value={pregForm.tipo} onChange={(e) => setPregForm({ ...pregForm, tipo: e.target.value as Pregunta['tipo'] })}>
                  <option value="escala">Escala (1-5)</option>
                  <option value="opcion_multiple">Opción múltiple</option>
                  <option value="si_no">Sí / No</option>
                  <option value="texto_libre">Texto libre</option>
                </select>
              </label>
              <label>
                <span>Orden</span>
                <input type="number" min={1} value={pregForm.orden ?? 1} onChange={(e) => setPregForm({ ...pregForm, orden: Number(e.target.value) })} />
              </label>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setModalPregunta(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={guardarPregunta}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
