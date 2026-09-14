import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { Empleado, Paginated } from '../types';
import styles from './Empleados.module.css';

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAcceso, setFiltroAcceso] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<Partial<Empleado>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [modalConfirmAbierto, setModalConfirmAbierto] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<number | null>(null);

  const fetchEmpleados = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (busqueda) params.append('search', busqueda);
    if (filtroAcceso) params.append('puede_contestar', filtroAcceso);
    const { data } = await api.get<Paginated<Empleado>>(`/usuarios/empleados/?${params}`);
    setEmpleados(data.results);
    setLoading(false);
  };

  useEffect(() => { fetchEmpleados(); }, [busqueda, filtroAcceso]);

  const toggleAcceso = async (id: number) => { await api.patch(`/usuarios/empleados/${id}/toggle-acceso/`); fetchEmpleados(); };

  const abrirModal = (emp?: Empleado) => {
    setError('');
    if (emp) { setForm(emp); setEditandoId(emp.id); }
    else { setForm({}); setEditandoId(null); }
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setForm({}); setEditandoId(null); setError(''); };

  const guardar = async () => {
    setError('');
    try {
      if (editandoId) await api.patch(`/usuarios/empleados/${editandoId}/`, form);
      else await api.post('/usuarios/empleados/', form);
      cerrarModal(); fetchEmpleados();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      setError(e?.response?.data && typeof e.response.data === 'object' ? Object.values(e.response.data).flat().join(' ') : 'Error al guardar.');
    }
  };

  const eliminarEmpleado = async (id: number) => { setEmpleadoAEliminar(id); setModalConfirmAbierto(true); };

  const confirmarEliminar = async () => {
    if (empleadoAEliminar === null) return;
    try { await api.delete(`/usuarios/empleados/${empleadoAEliminar}/`); fetchEmpleados(); setModalConfirmAbierto(false); setEmpleadoAEliminar(null); }
    catch { alert('Error al eliminar.'); }
  };

  const cancelarEliminar = () => { setModalConfirmAbierto(false); setEmpleadoAEliminar(null); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Información de los empleados</h2>
      </div>

      <div className={styles.filtros}>
        <input
          className={styles.inputSearch}
          placeholder="Busca por identificación o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className={styles.fila1}>
          <select value={filtroAcceso} onChange={(e) => setFiltroAcceso(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Con acceso a encuestas</option>
            <option value="false">Sin acceso</option>
          </select>
          <button className={styles.btnPrimary} onClick={() => abrirModal()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Nuevo
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Cargando empleados...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Identificación</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Acceso encuesta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id}>
                  <td className={styles.noEmp}>{emp.numero_empleado}</td>
                  <td>{emp.nombre}</td>
                  <td>{emp.apellido_paterno} {emp.apellido_materno}</td>
                  <td>
                    <button
                      onClick={() => toggleAcceso(emp.id)}
                      title="Clic para cambiar"
                      className={emp.puede_contestar_encuesta ? styles.badgeOn : styles.badgeOff}
                    >
                      {emp.puede_contestar_encuesta ? '✓ Habilitado' : '✗ Deshabilitado'}
                    </button>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => abrirModal(emp)} className={styles.btnEdit}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarEmpleado(emp.id)}
                      className={styles.btnDelete}
                      style={{ background: '#fde8e8', color: '#c0392b', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editandoId ? 'Información del empleado' : 'Nuevo empleado'}</h3>
            <div className={styles.grid2}>
              <label>
                Identificación *
                <input value={form.numero_empleado ?? ''} onChange={(e) => setForm({ ...form, numero_empleado: e.target.value })} />
              </label>
              <label>
                Nombre *
                <input value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label>
                Apellido paterno *
                <input value={form.apellido_paterno ?? ''} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} />
              </label>
              <label>
                Apellido materno
                <input value={form.apellido_materno ?? ''} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} />
              </label>
              <label>
                Fecha de alta *
                <input type="date" value={form.fecha_alta ?? ''} onChange={(e) => setForm({ ...form, fecha_alta: e.target.value })} />
              </label>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={cerrarModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={guardar}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfirmAbierto && (
        <div className={styles.overlay} onClick={cancelarEliminar}>
          <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center' }}>Confirmar eliminación</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem', textAlign: 'center' }}>¿Seguro que deseas eliminar este empleado?</p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={cancelarEliminar}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button onClick={confirmarEliminar} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
