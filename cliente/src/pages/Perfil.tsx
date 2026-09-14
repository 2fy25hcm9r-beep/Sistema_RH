import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Perfil.module.css';

const ROL_LABEL: Record<string, string> = { admin: 'Administrador', rh: 'Recursos Humanos', visor: 'Visor' };

export default function Perfil() {
  const { usuario, refreshUsuario } = useAuth();
  const [form, setForm] = useState<{ username: string; first_name: string; last_name: string }>({ username: '', first_name: '', last_name: '' });
  const [pwForm, setPwForm] = useState({ password_actual: '', nueva_password: '', confirmar_password: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) setForm({ username: usuario.username ?? '', first_name: usuario.first_name ?? '', last_name: usuario.last_name ?? '' });
  }, [usuario]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const cambiandoPassword = pwForm.password_actual || pwForm.nueva_password || pwForm.confirmar_password;

    if (cambiandoPassword) {
      const pw = pwForm.nueva_password;
      const missingChecks: string[] = [];

      if (pw.length < 8) missingChecks.push('m\u00ednimo 8 caracteres');
      if (!/[A-Z]/.test(pw)) missingChecks.push('una may\u00fascula');
      if (!/[a-z]/.test(pw)) missingChecks.push('una min\u00fascula');
      if (!/[0-9]/.test(pw)) missingChecks.push('un n\u00famero');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) missingChecks.push('un car\u00e1cter especial');

      if (missingChecks.length > 0) {
        setErr('La contrase\u00f1a debe contener: ' + missingChecks.join(', ') + '.');
        return;
      }

      if (pwForm.nueva_password !== pwForm.confirmar_password) {
        setErr('Las contrase\u00f1as nuevas no coinciden.');
        return;
      }

      if (pwForm.nueva_password !== pwForm.confirmar_password) {
        setErr('Las contrase\u00f1as nuevas no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      await api.patch('/usuarios/cuentas/me/', form);
      await refreshUsuario();
      if (cambiandoPassword) {
        await api.post('/usuarios/cuentas/cambiar-password/', pwForm);
        setPwForm({ password_actual: '', nueva_password: '', confirmar_password: '' });
      }
      setMsg('Cambios guardados correctamente.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      setErr(data && typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Información del perfil</h2>

      <div className={styles.card}>
        <form onSubmit={guardar} className={styles.form}>
          <div className={styles.sectionHeader}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3>Datos personales</h3>
          </div>

          <div className={styles.infoRow2}>
            <label className="block">
              <span className={styles.label}>Usuario</span>
              <input value={form.username ?? ''} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Ingresa tu usuario" autoComplete="username" />
            </label>
            <div>
              <span className={styles.label}>Rol</span>
              <p className={styles.value}>{ROL_LABEL[usuario?.rol ?? ''] ?? usuario?.rol}</p>
            </div>
          </div>

          <div className={styles.infoRow2}>
            <label className="block">
              <span className={styles.label}>Nombre</span>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Ingresa tu nombre" autoComplete="given-name" />
            </label>
            <label className="block">
              <span className={styles.label}>Apellido</span>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Ingresa tu apellido" autoComplete="family-name" />
            </label>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sectionHeader}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div>
              <h3>Cambiar contraseña</h3>
              <span className={styles.optional}>(dejar en blanco para no cambiar)</span>
            </div>
          </div>

          <div className={styles.infoRow2}>
            <label className="block">
              <span className={styles.label}>Contraseña actual</span>
              <input type="password" value={pwForm.password_actual} onChange={(e) => setPwForm({ ...pwForm, password_actual: e.target.value })} autoComplete="current-password" />
            </label>
          </div>

          <div className={styles.grid2}>
            <label className="block">
              <span className={styles.label}>Nueva contraseña</span>
              <input type="password" value={pwForm.nueva_password} onChange={(e) => setPwForm({ ...pwForm, nueva_password: e.target.value })} autoComplete="new-password" />
            </label>
            <label className="block">
              <span className={styles.label}>Confirmar nueva contraseña</span>
              <input type="password" value={pwForm.confirmar_password} onChange={(e) => setPwForm({ ...pwForm, confirmar_password: e.target.value })} autoComplete="new-password" />
            </label>
          </div>

          {err && <p className={styles.error}>{err}</p>}
          {msg && <p className={styles.success}>{msg}</p>}

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {loading ? 'Guardando cambios' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
