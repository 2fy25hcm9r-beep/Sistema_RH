import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import Encuestas from './pages/Encuestas';
import EncuestaDetalle from './pages/EncuestaDetalle';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import ResponderEncuesta from './pages/ResponderEncuesta';
import ResponderEncuesta1 from './pages/ResponderEncuesta1';
import './index.css';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-container">
      <Navbar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} aria-label="Notificaciones" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/olvide-password" element={<ForgotPassword />} />
          <Route path="/encuesta1/responder" element={<ResponderEncuesta1 />} />
          <Route path="/encuesta2/responder" element={<ResponderEncuesta />} />
          <Route path="/encuesta3/responder" element={<ResponderEncuesta />} />
          <Route path="/encuesta/:id/responder" element={<ResponderEncuesta />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/empleados" element={<PrivateRoute><Layout><Empleados /></Layout></PrivateRoute>} />
          <Route path="/encuestas" element={<PrivateRoute><Layout><Encuestas /></Layout></PrivateRoute>} />
          <Route path="/encuestas/:id" element={<PrivateRoute><Layout><EncuestaDetalle /></Layout></PrivateRoute>} />
          <Route path="/reportes" element={<PrivateRoute><Layout><Reportes /></Layout></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute allowedRoles={['admin']}><Layout><Usuarios /></Layout></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><Layout><Perfil /></Layout></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
