import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import styles from './Registro.module.css';

const Logo = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#1e3a5f"/>
    <circle cx="36" cy="24" r="8" fill="#fff"/>
    <path d="M20 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <circle cx="15" cy="30" r="5.5" fill="#2980b9"/>
    <path d="M5 50c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#2980b9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="57" cy="30" r="5.5" fill="#2980b9"/>
    <path d="M47 50c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#2980b9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const validatePassword = (password: string) => {
    let score = 0;
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (hasLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score <= 1) return { score, label: 'Muy débil', color: '#e74c3c' };
    if (score === 2) return { score, label: 'Débil', color: '#e67e22' };
    if (score === 3) return { score, label: 'Aceptable', color: '#f39c12' };
    if (score === 4) return { score, label: 'Fuerte', color: '#27ae60' };
    return { score, label: 'Muy fuerte', color: '#2ecc71' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    if (e.target.name === 'password') {
      setPasswordStrength(validatePassword(e.target.value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const pw = form.password;
    const missingChecks: string[] = [];

    if (pw.length < 8) missingChecks.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(pw)) missingChecks.push('una mayúscula');
    if (!/[a-z]/.test(pw)) missingChecks.push('una minúscula');
    if (!/[0-9]/.test(pw)) missingChecks.push('un número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) missingChecks.push('un carácter especial');

    if (missingChecks.length > 0) {
      setError('La contraseña debe contener: ' + missingChecks.join(', ') + '.');
      return;
    }

    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/usuarios/cuentas/', form);
      navigate('/login', { state: { registrado: true } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      setError(data && typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Logo />
          <h1 className={styles.title}>Sistema RH</h1>
        </div>
        <p className={styles.subtitle}>Información de registro</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <label>
              Nombre
              <input name="first_name" value={form.first_name} onChange={handleChange} required />
            </label>
            <label>
              Apellido
              <input name="last_name" value={form.last_name} onChange={handleChange} required />
            </label>
          </div>
          <div className={styles.row}>
            <label>
              Usuario
              <input name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
            </label>
          </div>
          <label>
            Contraseña
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" required />
            {form.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={styles.strengthSegment}
                      style={{
                        backgroundColor: passwordStrength.score >= level ? passwordStrength.color : '#e0e0e0',
                      }}
                    />
                  ))}
                </div>
                <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
              </div>
            )}
          </label>
          <label>
            Confirmar contraseña
            <input name="password2" type="password" value={form.password2} onChange={handleChange} autoComplete="new-password" required />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.btn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className={styles.register}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
