import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import api from '../api/axios';
import type { Encuesta, Pregunta, Paginated } from '../types';
import styles from './ResponderEncuesta.module.css';
import { esSi } from '../utils/encuestas';

interface Respuesta { pregunta: number; valor_escala?: number; texto_respuesta?: string; }

const PREGUNTAS_SECCION_I = [14, 15, 16, 17, 18, 19];
const PREGUNTAS_SECCION_II = [20, 21];
const PREGUNTAS_SECCION_III = [22, 23, 24, 25, 26, 27, 28];
const PREGUNTAS_SECCION_IV = [29, 30, 31, 32, 33];

export default function ResponderEncuesta1() {
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [numeroEmpleado, setNumeroEmpleado] = useState('');
  const [yaRespondida, setYaRespondida] = useState(false);
  const [respuestas, setRespuestas] = useState<Record<number, Respuesta>>({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [validado, setValidado] = useState(false);
  const [modalValidacion, setModalValidacion] = useState('');
  const [errorCarga, setErrorCarga] = useState('');
  const [eventoTraumatico, setEventoTraumatico] = useState(false);
  const [atencionClinicaSeccionII, setAtencionClinicaSeccionII] = useState(false);
  const [atencionClinicaSeccionIII, setAtencionClinicaSeccionIII] = useState(false);
  const [atencionClinicaSeccionIV, setAtencionClinicaSeccionIV] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get<Paginated<Encuesta>>('/encuestas/', { params: { search: 'Cuestionario 1', ordering: 'id' } });
        const c1 = data.results?.find(e => e.titulo === 'Cuestionario 1');
        if (!c1) { setErrorCarga('El Cuestionario 1 no está disponible.'); return; }
        if (c1.estado !== 'activa') { setErrorCarga('El Cuestionario 1 no está activo.'); return; }
        const { data: encuestaCompleta } = await api.get<Encuesta>(`/encuestas/${c1.id}/`);
        setEncuesta(encuestaCompleta);
      } catch (e) { setErrorCarga('No se pudo cargar la encuesta.'); console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (completado) {
      const t = setTimeout(() => { setCompletado(false); setNumeroEmpleado(''); setValidado(false); setRespuestas({}); setEventoTraumatico(false); setAtencionClinicaSeccionII(false); setAtencionClinicaSeccionIII(false); setAtencionClinicaSeccionIV(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [completado]);

  const handleRespuesta = useCallback((preguntaId: number, valor: string | number) => {
    if (!validado) { setModalValidacion('Por favor ingresa tu número de identificación antes de responder'); return; }
    if (yaRespondida) return;
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { pregunta: preguntaId, texto_respuesta: String(valor) }
    }));
  }, [validado, yaRespondida]);

useEffect(() => {
    let foundSi = false;
    for (const pregunta of encuesta?.preguntas || []) {
      if (PREGUNTAS_SECCION_I.includes(pregunta.orden)) {
        const resp = respuestas[pregunta.id];
        if (esSi(resp?.texto_respuesta)) {
          foundSi = true;
          break;
        }
      }
    }
    setEventoTraumatico(foundSi);
  }, [respuestas, encuesta]);

  useEffect(() => {
    if (!eventoTraumatico) {
      setAtencionClinicaSeccionII(false);
      setAtencionClinicaSeccionIII(false);
      setAtencionClinicaSeccionIV(false);
      return;
    }

    let countSeccionII = 0;
    let countSeccionIII = 0;
    let countSeccionIV = 0;

    for (const preg of encuesta?.preguntas || []) {
      const resp = respuestas[preg.id];
      if (esSi(resp?.texto_respuesta)) {
        if (PREGUNTAS_SECCION_II.includes(preg.orden)) {
          countSeccionII++;
        }
        if (PREGUNTAS_SECCION_III.includes(preg.orden)) {
          countSeccionIII++;
        }
        if (PREGUNTAS_SECCION_IV.includes(preg.orden)) {
          countSeccionIV++;
        }
      }
    }

    setAtencionClinicaSeccionII(countSeccionII >= 1);
    setAtencionClinicaSeccionIII(countSeccionIII >= 3);
    setAtencionClinicaSeccionIV(countSeccionIV >= 2);
  }, [respuestas, encuesta, eventoTraumatico]);

const preguntasVisibles = useMemo(() => {
     const preguntas = encuesta?.preguntas || [];
     return [...preguntas].sort((a, b) => a.orden - b.orden).filter(p => {
       const orden = p.orden;
       // Always show questions 1-19 (so user can answer section I to detect traumatic events)
       if (orden >= 1 && orden <= 19) {
         return true;
       }
       // Show questions 20-33 only if there was a traumatic event (sections II-IV)
       if (orden >= 20 && orden <= 33) {
         return eventoTraumatico;
       }
       // Don't show any other questions
       return false;
     });
   }, [encuesta, eventoTraumatico]);

  const renderPregunta = (pregunta: Pregunta) => {
    const tipo = (pregunta.tipo || '').trim().toLowerCase();
    const opciones = pregunta.opciones || [];
    const tiposVisibles = ['opcion_multiple', 'si_no', 'texto_libre', 'escala'];

    if (tipo === 'texto_libre') {
      return (
        <div className={styles.textoLibre}>
          <textarea value={respuestas[pregunta.id]?.texto_respuesta || ''} onChange={e => handleRespuesta(pregunta.id, e.target.value)}
            placeholder="Escribe tu respuesta aquí..." className={styles.textarea} />
        </div>
      );
    }
    if (opciones.length > 0) {
      return (
        <div className={styles.opciones}>
          {opciones.map(op => (
            <button key={op.valor} type="button" onClick={() => handleRespuesta(pregunta.id, op.valor)}
              className={`${styles.opcionBtn} ${respuestas[pregunta.id]?.texto_respuesta === String(op.valor) ? styles.selected : ''}`}>
              {op.texto}
            </button>
          ))}
        </div>
      );
    }
    if (tipo === 'si_no') {
      return (
        <div className={styles.opciones}>
          {['si', 'no'].map(valor => (
            <button key={valor} type="button" onClick={() => handleRespuesta(pregunta.id, valor)}
              className={`${styles.opcionBtn} ${respuestas[pregunta.id]?.texto_respuesta === valor ? styles.selected : ''}`}>
              {valor === 'si' ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      );
    }
    return (
      <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>
        Tipo desconocido: '{pregunta.tipo}' (debe ser uno de: {tiposVisibles.join(', ')})
      </span>
    );
  };

  const validarEmpleado = async () => {
    if (!numeroEmpleado.trim()) { setModalValidacion('Por favor ingresa tu número de identificación.'); return; }
    setEnviando(true);
    try {
      const encuestaId = encuesta?.id;
      if (!encuestaId) return;
      await api.post(`/encuestas/${encuestaId}/validar-empleado/`, { numero_empleado: numeroEmpleado.trim() });
      setValidado(true);
    } catch (err: any) {
      const error = err?.response?.data?.error;
      if (error === 'La encuesta ya fue respondida.') setYaRespondida(true);
      else setModalValidacion(error || 'Error al validar.');
      setValidado(false);
    } finally { setEnviando(false); }
  };

const enviarRespuestas = async () => {
    if (!validado) { setModalValidacion('Por favor ingresa y valida tu número de empleado.'); return; }
    
    const faltantes = preguntasVisibles.filter(p => p.requerida).filter(p => !respuestas[p.id]?.texto_respuesta);
    if (faltantes.length > 0) { setModalValidacion('Por favor responde todas las preguntas requeridas.'); return; }
    
    if (eventoTraumatico) {
      const preguntasSeccionesSiguientes = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
      const faltantesSecciones = preguntasSeccionesSiguientes.filter(orden => {
        const pregunta = encuesta?.preguntas?.find(p => p.orden === orden);
        return pregunta && !respuestas[pregunta.id]?.texto_respuesta;
      });
      if (faltantesSecciones.length > 0) { setModalValidacion('Por favor responde las preguntas adicionales.'); return; }
    }
    
    setEnviando(true);
    try {
      const encuestaId = encuesta?.id;
      if (!encuestaId) return;
      await api.post(`/encuestas/${encuestaId}/responder/`, { numero_empleado: numeroEmpleado.trim(), respuestas: Object.values(respuestas) });
      setCompletado(true);
    } catch (err: any) { setModalValidacion(err?.response?.data?.error || 'Error al enviar.'); }
    finally { setEnviando(false); }
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}><div className={styles.spinner}></div><p>Cargando...</p></div>
    </div>
  );

  if (!encuesta) return (
    <div className={styles.container}>
      <div className={styles.errorCard}><h2>⚠ Error</h2><p>{errorCarga || 'No se pudo cargar.'}</p><button onClick={() => window.location.reload()} className={styles.btnAceptar}>Aceptar</button></div>
    </div>
  );

  if (yaRespondida) return (
    <div className={styles.container}>
      <div className={styles.overlayModal}>
        <div className={styles.modalValidacion}><h2>✓</h2><p className={styles.gracias}>La encuesta ya fue respondida.</p><button onClick={() => window.location.reload()} className={styles.btnAceptar}>Aceptar</button></div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formCardInner}>
          <div className={styles.header}>
            <div className={styles.logoWrap}><img src="/logo_delma.webp" alt="Logo" className={styles.logoImg} /></div>
            <div className={styles.empleadoInput}>
              <label htmlFor="numeroEmpleado">Número de identificación</label>
              <input id="numeroEmpleado" ref={inputRef} type="text" autoComplete="username" value={numeroEmpleado}
                onChange={e => { setNumeroEmpleado(e.target.value); setValidado(false); }} onBlur={validarEmpleado} disabled={validado}
                className={styles.input} />
            </div>
          </div>

          <div className={styles.titulo}><h2>{encuesta.titulo}</h2>{encuesta.descripcion && <p>{encuesta.descripcion}</p>}</div>

{/* Información del empleado fieldset for questions 1-13 */}
          <fieldset style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}>
              Información del empleado
            </legend>
            {preguntasVisibles
              .filter(pregunta => pregunta.orden >= 1 && pregunta.orden <= 13)
              .map((pregunta) => (
                <div key={pregunta.id} className={styles.pregunta}>
                  <div className={styles.preguntaHeader}>
                    <span className={styles.preguntaNumero}>{pregunta.orden}.</span>
                    <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                  </div>
                  {renderPregunta(pregunta)}
                </div>
              ))}
          </fieldset>

          {/* I. Acontecimiento traumático severo fieldset for questions 14-19 */}
          <fieldset style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}>
              I. Acontecimiento traumático severo
            </legend>
            {preguntasVisibles
              .filter(pregunta => pregunta.orden >= 14 && pregunta.orden <= 19)
              .map((pregunta) => (
                <div key={pregunta.id} className={styles.pregunta}>
                  <div className={styles.preguntaHeader}>
                    <span className={styles.preguntaNumero}>{pregunta.orden}.</span>
                    <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                  </div>
                  {renderPregunta(pregunta)}
                </div>
              ))}
          </fieldset>

          {/* II. Recuerdos persistentes sobre el acontecimiento (durante el último mes) */}
          {eventoTraumatico && (
            <fieldset style={{ border: `2px solid ${atencionClinicaSeccionII ? '#ffc107' : '#ccc'}`, padding: '1rem', marginBottom: '1.5rem' }}>
              <legend style={{ fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}>
                II. Recuerdos persistentes sobre el acontecimiento (durante el último mes)
              </legend>
              {preguntasVisibles
                .filter(pregunta => pregunta.orden >= 20 && pregunta.orden <= 21)
                .map((pregunta) => (
                  <div key={pregunta.id} className={styles.pregunta}>
                    <div className={styles.preguntaHeader}>
                      <span className={styles.preguntaNumero}>{pregunta.orden}.</span>
                      <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                    </div>
                    {renderPregunta(pregunta)}
                  </div>
                ))}
            </fieldset>
          )}

          {/* III. Esfuerzo por evitar circunstancias parecidas o asociadas al acontecimiento (durante el último mes) */}
          {eventoTraumatico && (
            <fieldset style={{ border: `2px solid ${atencionClinicaSeccionIII ? '#ffc107' : '#ccc'}`, padding: '1rem', marginBottom: '1.5rem' }}>
              <legend style={{ fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}>
                III. Esfuerzo por evitar circunstancias parecidas o asociadas al acontecimiento (durante el último mes)
              </legend>
              {preguntasVisibles
                .filter(pregunta => pregunta.orden >= 22 && pregunta.orden <= 28)
                .map((pregunta) => (
                  <div key={pregunta.id} className={styles.pregunta}>
                    <div className={styles.preguntaHeader}>
                      <span className={styles.preguntaNumero}>{pregunta.orden}.</span>
                      <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                    </div>
                    {renderPregunta(pregunta)}
                  </div>
                ))}
            </fieldset>
          )}

          {/* IV. Afectación (durante el último mes) */}
          {eventoTraumatico && (
            <fieldset style={{ border: `2px solid ${atencionClinicaSeccionIV ? '#ffc107' : '#ccc'}`, padding: '1rem', marginBottom: '1.5rem' }}>
              <legend style={{ fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}>
                IV. Afectación (durante el último mes)
              </legend>
              {preguntasVisibles
                .filter(pregunta => pregunta.orden >= 29 && pregunta.orden <= 33)
                .map((pregunta) => (
                  <div key={pregunta.id} className={styles.pregunta}>
                    <div className={styles.preguntaHeader}>
                      <span className={styles.preguntaNumero}>{pregunta.orden}.</span>
                      <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                    </div>
                    {renderPregunta(pregunta)}
                  </div>
                ))}
            </fieldset>
          )}

          <div className={styles.enviarBtn}>
            <button onClick={enviarRespuestas} disabled={enviando} className={styles.btnEnviar}>{enviando ? 'Enviando...' : 'Enviar'}</button>
          </div>
        </div>
      </div>

      {modalValidacion && (
        <div className={styles.overlayModal} onClick={() => setModalValidacion('')}>
          <div className={styles.modalValidacion} onClick={e => e.stopPropagation()}>
            <p>{modalValidacion}</p>
            <button onClick={() => { setModalValidacion(''); setTimeout(() => inputRef.current?.focus(), 100); }} className={styles.btnAceptar}>Aceptar</button>
          </div>
        </div>
      )}

      {completado && (
        <div className={styles.overlayModal} onClick={() => setCompletado(false)}>
          <div className={styles.modalValidacion}>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.gracias}>¡Gracias por tus respuestas!</p>
            <button onClick={() => { setCompletado(false); setNumeroEmpleado(''); setValidado(false); setRespuestas({}); setEventoTraumatico(false); }} className={styles.btnAceptar}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}