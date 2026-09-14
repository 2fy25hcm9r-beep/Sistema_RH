import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import type { Usuario } from '../types';
import styles from './Usuarios.module.css';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'rh', label: 'Recursos Humanos' },
  { value: 'visor', label: 'Visor' },
];

interface ModalState { 
  type: 'editar' | 'rol' | 'estado' | 'eliminar' | null; 
  user: Usuario | null; 
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [adminPrincipalId, setAdminPrincipalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: null, user: null });
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', username: '' });
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Reset password modal state
  const [resetModal, setResetModal] = useState<{ solicitudId: number; username: string } | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios/cuentas/');
      const userList = data.results || data;
      setUsuarios(userList);
      const adminsActivos = userList.filter((u: Usuario) => u.rol === 'admin' && u.is_active);
      if (adminsActivos.length > 0) {
        setAdminPrincipalId(adminsActivos.reduce((min: Usuario, u: Usuario) => u.id < min.id ? u : min).id);
      }
    } catch { 
      toast.error('Error al cargar usuarios'); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const { data } = await api.get('/usuarios/solicitudes-reset/');
      // Assuming the endpoint returns an array directly
      setSolicitudes(Array.isArray(data) ? data : data.results || data);
    } catch (err) {
      console.error('Error fetching solicitudes:', err);
      toast.error('Error al cargar solicitudes de reset');
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchSolicitudes();
  }, []);

  const openModal = (type: ModalState['type'], user: Usuario) => {
    setModal({ type, user });
    if (type === 'editar') setEditForm({ first_name: user.first_name, last_name: user.last_name, username: user.username });
    else if (type === 'rol') setSelectedRole(user.rol);
  };

  const closeModal = () => setModal({ type: null, user: null });

  const handleEditar = async () => {
    if (!modal.user) return;
    try { 
      await api.patch(`/usuarios/cuentas/${modal.user.id}/`, editForm); 
      toast.success('Usuario actualizado'); 
      closeModal(); 
      fetchUsuarios(); 
    }
    catch { toast.error('Error al actualizar'); }
  };

  const handleCambiarRol = async () => {
    if (!modal.user) return;
    try { 
      await api.patch(`/usuarios/cuentas/${modal.user.id}/`, { rol: selectedRole }); 
      toast.success('Rol actualizado'); 
      closeModal(); 
      fetchUsuarios(); 
    }
    catch { toast.error('Error al actualizar rol'); }
  };

  const handleToggleEstado = async () => {
    if (!modal.user) return;
    try { 
      await api.patch(`/usuarios/cuentas/${modal.user.id}/`, { is_active: !modal.user.is_active }); 
      toast.success(modal.user.is_active ? 'Usuario desactivado' : 'Usuario activado'); 
      closeModal(); 
      fetchUsuarios(); 
    }
    catch { toast.error('Error al actualizar estado'); }
  };

  const handleEliminar = async () => {
    if (!modal.user) return;
    try { 
      await api.delete(`/usuarios/cuentas/${modal.user.id}/`); 
      toast.success('Usuario eliminado'); 
      closeModal(); 
      fetchUsuarios(); 
    }
    catch { toast.error('Error al eliminar'); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal) return;
    if (!nuevaPassword.trim()) {
      setResetError('La nueva contraseña es requerida.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      await api.post(`/usuarios/aprobar-reset/${resetModal.solicitudId}/`, { nueva_password: nuevaPassword });
      setResetSuccess('Contraseña actualizada correctamente.');
      setNuevaPassword('');
      // Close modal and refresh lists
      setResetModal(null);
      closeModal(); // In case any other modal is open
      fetchUsuarios();
      fetchSolicitudes();
    } catch (err: any) {
      setResetError('Error al actualizar la contraseña.');
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  const getRolLabel = (rol: string) => ROLES.find(r => r.value === rol)?.label || rol;
  const esAdminPrincipal = (user: Usuario) => user.id === adminPrincipalId;

  if (loading) return <div className={styles.page}><div className={styles.loading}>Cargando usuarios...</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Información de los usuarios</h2>
      </div>

      {/* Tabla de usuarios existente */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuarios</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e3a5f' }}>{user.username}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>
                  <span className={`${styles.badge} ${user.rol === 'admin' ? styles.admin : user.rol === 'rh' ? styles.rh : styles.visor}`}>
                    {getRolLabel(user.rol)}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${user.is_active ? styles.activo : styles.inactivo}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className={styles.acciones}>
                    <button onClick={() => openModal('editar', user)} className={styles.btnEditar}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Editar
                    </button>
                    <button onClick={() => openModal('rol', user)} disabled={esAdminPrincipal(user)} className={styles.btnRol}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                      Rol
                    </button>
                    <button onClick={() => openModal('estado', user)} disabled={esAdminPrincipal(user)} className={styles.btnEstado}>
                      {user.is_active ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          Desactivar
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Activar
                        </>
                      )}
                    </button>
                    <button onClick={() => openModal('eliminar', user)} disabled={esAdminPrincipal(user)} className={styles.btnEliminar}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección de solicitudes de reset */}
      <div className={styles.sectionHeader}>
        <h2>Solicitudes de reseteo de contraseña</h2>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Fecha de solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.length > 0 ? (
              solicitudes.map((solicitud: any) => (
                <tr key={solicitud.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e3a5f' }}>{solicitud.usuario}</td>
                  <td>{new Date(solicitud.fecha_solicitud).toLocaleString()}</td>
                  <td>
<button 
  onClick={() => {
    setResetModal({ solicitudId: solicitud.id, username: solicitud.usuario });
    setNuevaPassword('');
    setResetError('');
    setResetSuccess('');
  }}
  className={styles.btnPrimary}
>
Restablecer
</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className={styles.empty}>No hay solicitudes pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

{/* Modal para restablecer contraseña */}
       {resetModal && (
         <div className={styles.overlay} onClick={() => setResetModal(null)}>
           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
             <form onSubmit={handleResetPassword} className={styles.form}>
               <h3>Restablecer contraseña para {resetModal.username}</h3>
               <label>
                 Nueva contraseña
                 <input
                   type="password"
                   value={nuevaPassword}
                   onChange={e => setNuevaPassword(e.target.value)}
                   required
                   minLength={6}
                 />
               </label>
               {resetError && <p className={styles.error}>{resetError}</p>}
               {resetSuccess && <p className={styles.success}>{resetSuccess}</p>}
               <div className={styles.modalActions}>
                 <button type="button" className={styles.btnSecondary} onClick={() => setResetModal(null)}>
                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                   Cancelar
                 </button>
                 <button type="submit" className={styles.btnPrimary} disabled={resetLoading || !nuevaPassword.trim()}>
                   {resetLoading ? 'Actualizando...' : 'Confirmar'}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

      {/* Modales existentes */}
      {modal.type === 'editar' && modal.user && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Información del usuario</h3>
            <div className={styles.form}>
              <label>
                Username
                <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
              </label>
              <label>
                Nombre
                <input type="text" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              </label>
              <label>
                Apellido
                <input type="text" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={handleEditar}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'rol' && modal.user && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar rol</h3>
            <p className={styles.hint}>Rol actual: <strong>{getRolLabel(modal.user.rol)}</strong></p>
<label>
                Nuevo rol
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  {ROLES.map(rol => <option key={rol.value} value={rol.value}>{rol.label}</option>)}
                </select>
              </label>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={handleCambiarRol}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'estado' && modal.user && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{modal.user.is_active ? 'Desactivar usuario' : 'Activar usuario'}</h3>
            <p className={styles.hint}>
              ¿Estás seguro de {modal.user.is_active ? 'desactivar' : 'activar'} a <strong>{modal.user.username}</strong>?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={handleToggleEstado}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'eliminar' && modal.user && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar usuario</h3>
            <p className={styles.hint}>
              ¿Estás seguro de eliminar a <strong>{modal.user.username}</strong>?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button className={styles.btnDanger} onClick={handleEliminar}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}