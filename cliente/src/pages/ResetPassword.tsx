import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../api/axios';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, result: a + b };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!uid || !token) { setError('Enlace inválido.'); return; }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    if (parseInt(captchaInput) !== captcha.result) { setError('Captcha incorrecto.'); setCaptcha(generateCaptcha()); setCaptchaInput(''); return; }
    setLoading(true);
    try {
      await axios.post('/usuarios/reset-password/', { uid, token, password, password2 });
      setSuccess('Contraseña restablecida correctamente. Ya puedes iniciar sesión.');
    } catch {
      setError('No se pudo restablecer la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary-900 text-center mb-6">Restablecer contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Nueva contraseña</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Confirmar contraseña</span>
            <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required className="input" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-1.5 block">¿Cuánto es {captcha.a} + {captcha.b}?</span>
            <input type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} required className="input" />
          </label>
          {error && <p className="text-sm text-danger-600 text-center">{error}</p>}
          {success && <p className="text-sm text-success-600 text-center">{success}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Procesando...' : 'Restablecer contraseña'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
