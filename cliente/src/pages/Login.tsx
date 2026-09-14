import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos.');
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
        <p className={styles.subtitle}>Evaluación de rendimiento</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            <span className={styles.labelText}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Usuario
            </span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>

          <label>
            <span className={styles.labelText}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Contraseña
            </span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Ingresando...' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Ingresar
              </>
            )}
          </button>
        </form>

        <p className={styles.register}>
          <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className={styles.register}>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
