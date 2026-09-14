import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);

  useEffect(() => {
    if (menuAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSubmenuAbierto(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuAbierto]);

  const handleLogout = () => { logout(); navigate('/login'); setMenuAbierto(false); };
  const cerrarMenu = () => { setMenuAbierto(false); setSubmenuAbierto(false); };
  const nombreCompleto = [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') || usuario?.username || '';

  const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
  const IconEmpleados = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const IconEncuestas = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
  const IconReportes = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
  const IconUsuarios = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <IconDashboard />, end: true },
    ...(usuario?.rol !== 'visor' ? [{ to: '/empleados', label: 'Empleados', icon: <IconEmpleados /> }] : []),
    { to: '/encuestas', label: 'Encuestas', icon: <IconEncuestas /> },
    { to: '/reportes', label: 'Reportes', icon: <IconReportes /> },
    ...(usuario?.rol === 'admin' ? [{ to: '/usuarios', label: 'Usuarios', icon: <IconUsuarios /> }] : []),
  ];

  const Links = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map(({ to, label, icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} onClick={onClick}
            className={({ isActive }) => `${styles.nav} ${isActive ? styles.active : ''}`}>
            {icon}
            {label}
          </NavLink>
        </li>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg width="40" height="40" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="36" fill="#fff" fillOpacity="0.15"/>
            <circle cx="36" cy="24" r="8" fill="#fff"/>
            <path d="M20 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="15" cy="30" r="5.5" fill="#2980b9"/>
            <path d="M5 50c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#2980b9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="57" cy="30" r="5.5" fill="#2980b9"/>
            <path d="M47 50c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#2980b9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <span>Sistema RH</span>
        </div>
        <nav className={styles.nav}>
          <ul><Links /></ul>
        </nav>
        <div className={styles.userSection}>
          {submenuAbierto && (
            <div className={styles.submenu}>
              <button onClick={() => { navigate('/perfil'); cerrarMenu(); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Editar perfil
              </button>
              <button onClick={handleLogout} className={styles.submenuLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Salir
              </button>
            </div>
          )}
          <button onClick={() => setSubmenuAbierto(!submenuAbierto)} className={styles.userBtn}>
            <div className={styles.avatar}>{nombreCompleto.charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{nombreCompleto}</span>
              <span className={styles.userRole}>{usuario?.rol}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={submenuAbierto ? styles.rotated : ''}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className={styles.hamburger}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuAbierto ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
        <div className={styles.brand}>
          <svg width="32" height="32" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="36" fill="#fff" fillOpacity="0.15"/>
            <circle cx="36" cy="24" r="8" fill="#fff"/>
            <path d="M20 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
          <span>Sistema RH</span>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuAbierto && (
        <div className={styles.mobileOverlay} onClick={cerrarMenu}>
          <nav className={styles.mobileNav} onClick={(e) => e.stopPropagation()}>
            <ul><Links onClick={cerrarMenu} /></ul>
            <div className={styles.mobileUserSection}>
              <button onClick={() => setSubmenuAbierto(!submenuAbierto)} className={styles.mobileUserInfo}>
                <div className={styles.avatar}>{nombreCompleto.charAt(0).toUpperCase()}</div>
                <div>
                  <div className={styles.mobileUserName}>{nombreCompleto}</div>
                  <div className={styles.mobileUserRole}>{usuario?.rol}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={submenuAbierto ? styles.rotated : ''}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {submenuAbierto && (
                <div className={styles.mobileSubmenu}>
                  <button onClick={() => { navigate('/perfil'); cerrarMenu(); }} className={styles.mobileMenuBtn}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Editar perfil
                  </button>
                  <button onClick={handleLogout} className={styles.mobileMenuBtnLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Salir
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
