import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../api/axios';
import type { Encuesta, Pregunta, Paginated } from '../types';
import styles from './ResponderEncuesta.module.css';
import {
  debeOcultarsePregunta,
  esSi,
  obtenerNumeroPreguntaVisible,
  esPreguntaRequeridaCondicional,
} from '../utils/encuestas';

interface Respuesta { pregunta: number; valor_escala?: number; texto_respuesta?: string; }

export default function ResponderEncuesta() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [mostrarBloqueServicio, setMostrarBloqueServicio] = useState(false);
  const [mostrarBloqueJefe, setMostrarBloqueJefe] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        let data;
        const pathNum = location.pathname.match(/\/encuesta(\d+)\/responder/);
        const numEncuesta = pathNum ? pathNum[1] : null;
        
        if (numEncuesta === '2') {
          const resp = await api.get<Paginated<Encuesta>>('/encuestas/', { params: { search: 'Cuestionario 2', ordering: 'id' } });
          const c2 = resp.data.results?.find(e => e.titulo === 'Cuestionario 2');
          if (c2) data = await api.get<Encuesta>(`/encuestas/${c2.id}/`);
        } else if (numEncuesta === '3') {
          const resp = await api.get<Paginated<Encuesta>>('/encuestas/', { params: { search: 'Cuestionario 3', ordering: 'id' } });
          const c3 = resp.data.results?.find(e => e.titulo === 'Cuestionario 3');
          if (c3) data = await api.get<Encuesta>(`/encuestas/${c3.id}/`);
        } else if (id === '2') {
          const resp = await api.get<Paginated<Encuesta>>('/encuestas/', { params: { search: 'Cuestionario 2', ordering: 'id' } });
          const c2 = resp.data.results?.find(e => e.titulo === 'Cuestionario 2');
          if (c2) data = await api.get<Encuesta>(`/encuestas/${c2.id}/`);
        } else if (id === '3') {
          const resp = await api.get<Paginated<Encuesta>>('/encuestas/', { params: { search: 'Cuestionario 3', ordering: 'id' } });
          const c3 = resp.data.results?.find(e => e.titulo === 'Cuestionario 3');
          if (c3) data = await api.get<Encuesta>(`/encuestas/${c3.id}/`);
        } else {
          data = await api.get<Encuesta>(`/encuestas/${id}/`);
        }
        const encuestaData = data?.data;
        if (!encuestaData) { setErrorCarga('No se pudo cargar la encuesta.'); setLoading(false); return; }
        if (encuestaData.estado !== 'activa') setErrorCarga('Esta encuesta no está disponible.');
        else setEncuesta(encuestaData);
      } catch { setErrorCarga('No se pudo cargar la encuesta.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, location.pathname]);

  const [eventoTraumatico, setEventoTraumatico] = useState(false);

  useEffect(() => {
    if (completado) {
      const timer = setTimeout(() => { setCompletado(false); setNumeroEmpleado(''); setValidado(false); setRespuestas({}); setEventoTraumatico(false); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [completado]);

  useEffect(() => {
    if (encuesta?.titulo === 'Cuestionario 1') {
      let foundSi = false;
      for (const pregunta of encuesta.preguntas || []) {
        if ([14, 15, 16, 17, 18, 19].includes(pregunta.orden)) {
          const resp = respuestas[pregunta.id];
          if (esSi(resp?.texto_respuesta) || esSi(resp?.valor_escala)) {
            foundSi = true;
            break;
          }
        }
      }
      setEventoTraumatico(foundSi);
    }
  }, [respuestas, encuesta]);

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
      if (error === 'La encuesta ya fue respondida.') {
        setYaRespondida(true);
      } else {
        setModalValidacion(error || 'Error al validar tu identificación.');
      }
      setValidado(false);
    } finally { setEnviando(false); }
  };

  const verificarYaRespondida = async (numero: string) => {
    try {
      const encuestaId = encuesta?.id;
      if (!encuestaId) return false;
      await api.post(`/encuestas/${encuestaId}/validar-empleado/`, { numero_empleado: numero.trim() });
      return false;
    } catch (err: any) {
      console.log('Error verificación:', err?.response?.data?.error);
      return err?.response?.data?.error === 'La encuesta ya fue respondida.';
    }
  };

  const handleRespuesta = (preguntaId: number, tipo: string, valor: any) => {
    if (!validado) {
      setModalValidacion('Por favor ingresa tu número de identificación antes de responder');
      return;
    }
    if (yaRespondida) {
      setModalValidacion('La encuesta ya fue respondida.');
      return;
    }
    if (tipo === 'si_no' && typeof valor === 'string') {
      const textoPregunta = encuesta?.preguntas?.find((p) => p.id === preguntaId)?.texto || '';
      // Punto frágil: esta lógica sigue dependiendo del texto exacto de la pregunta.
      if (textoPregunta.toLowerCase().includes('brindar servicio') || textoPregunta.toLowerCase().includes('servicio a clientes')) {
        setMostrarBloqueServicio(esSi(valor));
      }
      if (textoPregunta.toLowerCase().includes('jefe de otros') || textoPregunta.toLowerCase().includes('jefe de trabajadores')) {
        setMostrarBloqueJefe(esSi(valor));
      }
    }
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { pregunta: preguntaId, ...(tipo === 'escala' && { valor_escala: valor }), ...(tipo === 'opcion_multiple' || tipo === 'si_no' ? { texto_respuesta: valor } : {}), ...(tipo === 'texto_libre' && { texto_respuesta: valor }) }
    }));
  };

  const preguntasVisibles = useMemo(() => {
    if (!encuesta) return [];
    return encuesta.preguntas?.filter(p => {
      if (encuesta.titulo === 'Cuestionario 1') {
        const orden = p.orden;
        if (orden >= 1 && orden <= 19) return true;
        if (orden >= 20 && orden <= 33) return eventoTraumatico;
        return false;
      }
      return !debeOcultarsePregunta(p.texto, mostrarBloqueServicio, mostrarBloqueJefe);
    }) || [];
  }, [encuesta, mostrarBloqueServicio, mostrarBloqueJefe, eventoTraumatico]);

  const numeroMostrar = (pregunta: Pregunta) => {
    if (encuesta?.titulo === 'Cuestionario 1') return pregunta.orden;
    return obtenerNumeroPreguntaVisible(pregunta.texto, pregunta.orden);
  };

  const enviarRespuestas = async () => {
    if (!validado) { setModalValidacion('Por favor ingresa y valida tu número de empleado.'); return; }
    const preguntasRequeridasVisibles = preguntasVisibles.filter(p => {
      return p.requerida || esPreguntaRequeridaCondicional(p.texto);
    });
    const faltantes = preguntasRequeridasVisibles.filter(p => 
      !respuestas[p.id] || 
      (p.tipo === 'si_no' && !respuestas[p.id]?.texto_respuesta)
    );
    if (faltantes.length > 0) {
      setModalValidacion('Por favor responde todas las preguntas requeridas'); return;
    }
    
    if (encuesta?.titulo === 'Cuestionario 1' && eventoTraumatico) {
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
    } catch (err: any) {
      setModalValidacion(err?.response?.data?.error || 'Error al enviar las respuestas.');
    } finally { setEnviando(false); }
  };

  const renderOpciones = (pregunta: any) => {
    const handleClick = async (valor: any) => {
      if (!validado) {
        setModalValidacion('Por favor ingresa tu número de identificación antes de responder');
        return;
      }
      if (yaRespondida) {
        setModalValidacion('La encuesta ya fue respondida.');
        return;
      }
      const yaRespondio = await verificarYaRespondida(numeroEmpleado);
      if (yaRespondio) {
        setYaRespondida(true);
        setModalValidacion('La encuesta ya fue respondida.');
        return;
      }
      handleRespuesta(pregunta.id, pregunta.tipo, valor);
    };

    if (pregunta.tipo === 'escala') {
      const opcionesRenderizar = pregunta.opciones || [];
      return (
        <div className={styles.opciones}>
          {opcionesRenderizar.map((opcion: any) => (
            <button key={opcion.valor} type="button" onClick={() => handleClick(opcion.valor)}
              className={`${styles.opcionBtn} ${String(respuestas[pregunta.id]?.valor_escala) === String(opcion.valor) ? styles.selected : ''}`}>
              {opcion.texto}
            </button>
          ))}
        </div>
      );
    }
    if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'si_no') {
      const opcionesRenderizar = pregunta.opciones || [];
      return (
        <div className={styles.opciones}>
          {opcionesRenderizar.map((opcion: any) => (
            <button key={opcion.valor ?? opcion.id} type="button" onClick={() => handleClick(opcion.valor ?? opcion.texto)}
              className={`${styles.opcionBtn} ${respuestas[pregunta.id]?.texto_respuesta === String(opcion.valor ?? opcion.texto) ? styles.selected : ''}`}>
              {opcion.texto}
            </button>
          ))}
        </div>
      );
    }
    if (pregunta.tipo === 'texto_libre') {
      // Punto frágil: este bloque depende de que la pregunta siga etiquetada como texto_libre.
      return (
        <div className={styles.textoLibre}>
          <textarea value={respuestas[pregunta.id]?.texto_respuesta || ''} onChange={(e) => {
            if (!yaRespondida) {
              handleRespuesta(pregunta.id, 'texto_libre', e.target.value);
            }
          }}
            placeholder="Escribe tu respuesta aquí..." className={styles.textarea} />
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando encuesta...</p>
      </div>
    </div>
  );

  if (!encuesta) return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h2>⚠ Error</h2>
        <p>{errorCarga || 'No se pudo cargar la encuesta.'}</p>
        <button onClick={() => window.location.reload()} className={styles.btnAceptar}>Aceptar</button>
      </div>
    </div>
  );

  if (yaRespondida) return (
    <div className={styles.container}>
      <div className={styles.overlayModal}>
        <div className={styles.modalValidacion}>
          <h2>✓</h2>
          <p className={styles.gracias}>La encuesta ya fue respondida.</p>
          <button onClick={() => window.location.reload()} className={styles.btnAceptar}>Aceptar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.formCardInner}>
          <div className={styles.header}>
            <div className={styles.logoWrap}>
              <img src="/logo_delma.webp" alt="Logo Delma" className={styles.logoImg} />
            </div>
            <div className={styles.empleadoInput}>
              <label htmlFor="numeroEmpleado">Número de identificación</label>
              <input id="numeroEmpleado" ref={inputRef} type="text" autoComplete="username" value={numeroEmpleado}
                onChange={e => { setNumeroEmpleado(e.target.value); setValidado(false); }} onBlur={validarEmpleado} disabled={validado}
                className={styles.input} />
            </div>
          </div>

          <div className={styles.titulo}>
            <h2>{encuesta.titulo}</h2>
            {encuesta.descripcion && <p>{encuesta.descripcion}</p>}
          </div>

          {preguntasVisibles.map((pregunta) => {
            const num = numeroMostrar(pregunta);
            return (
              <div key={pregunta.id} className={styles.pregunta}>
                <div className={styles.preguntaHeader}>
                  {num !== null && <span className={styles.preguntaNumero}>{num}.</span>}
                  <h3 className={styles.preguntaTexto}>{pregunta.texto}</h3>
                </div>
                {renderOpciones(pregunta)}
              </div>
            );
          })}

          <div className={styles.enviarBtn}>
            <button onClick={enviarRespuestas} disabled={enviando} className={styles.btnEnviar}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>

      {modalValidacion && (
        <div className={styles.overlayModal} onClick={() => setModalValidacion('')}>
          <div className={styles.modalValidacion} onClick={(e) => e.stopPropagation()}>
            <p>{modalValidacion}</p>
            <button onClick={() => { setModalValidacion(''); setTimeout(() => inputRef.current?.focus(), 100); }}
              className={styles.btnAceptar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Aceptar
            </button>
          </div>
        </div>
      )}

      {completado && (
        <div className={styles.overlayModal} onClick={() => setCompletado(false)}>
          <div className={styles.modalValidacion} onClick={(e) => e.stopPropagation()}>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.gracias}>¡Gracias!</p>
            <p className={styles.completadoText}>Tus respuestas han sido registradas exitosamente.</p>
            <button onClick={() => { setCompletado(false); setNumeroEmpleado(''); setValidado(false); setRespuestas({}); }}
              className={styles.btnAceptar}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}