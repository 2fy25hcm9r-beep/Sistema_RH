import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('Debes ingresar tu usuario.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/usuarios/recuperar-password/', { username });
      setSuccess('Si el usuario existe, recibirás una notificación para restablecer tu contraseña.');
// Optionally redirect after a few seconds
       setTimeout(() => {
         navigate('/login');
       }, 3000);
    } catch (err: any) {
      // If the server returns an error, we still show a generic message for security
      setError('No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Restablecer contraseña</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            <span>Ingresa tu usuario</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
        <p className={styles.register}>
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}