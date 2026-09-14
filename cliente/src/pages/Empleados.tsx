import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Empleado, Paginated } from '../types';
import styles from './Empleados.module.css';

interface Encuesta {
  id: number;
  titulo: string;
  descripcion?: string;
  activa?: boolean;
}

const Empleados = () => {
  const navigate = useNavigate();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [search, setSearch] = useState('');
  const [filtroAcceso, setFiltroAcceso] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEncuestas, setLoadingEncuestas] = useState(false);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] =
    useState<Empleado | null>(null);

  const [modalEncuestas, setModalEncuestas] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    numero_empleado: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_alta: '',
  });

  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append('search', search.trim());
      }

      if (filtroAcceso !== '') {
        params.append('puede_contestar', filtroAcceso);
      }

      const { data } = await api.get<Paginated<Empleado>>(
        `/usuarios/empleados/?${params.toString()}`
      );

      setEmpleados(data.results || []);
    } catch {
      setError('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, [search, filtroAcceso]);

  const abrirEmpleado = async (empleado: Empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalEncuestas(true);
    setMensaje('');
    setLoadingEncuestas(true);

    try {
      const { data } = await api.get('/encuestas/');

      const lista = data.results || data || [];

      setEncuestas(lista);
    } catch {
      setMensaje('No se pudieron cargar las encuestas.');
      setEncuestas([]);
    } finally {
      setLoadingEncuestas(false);
    }
  };

  const obtenerRutaEncuesta = (id: number) => {
    if (id === 1) {
      return '/encuesta1/responder';
    }

    if (id === 2) {
      return '/encuesta2/responder';
    }

    if (id === 3) {
      return '/encuesta3/responder';
    }

    return `/encuesta/${id}/responder`;
  };

  const asignarYResponder = async (encuesta: Encuesta) => {
    if (!empleadoSeleccionado) return;

    try {
      setMensaje('Asignando encuesta...');

      await api.post(`/encuestas/${encuesta.id}/asignar-empleados/`, {
        numeros_empleado: [empleadoSeleccionado.numero_empleado],
      });

      setMensaje('Encuesta asignada correctamente.');

      const ruta = obtenerRutaEncuesta(encuesta.id);

      setTimeout(() => {
        navigate(
          `${ruta}?empleado=${encodeURIComponent(
            empleadoSeleccionado.numero_empleado
          )}`
        );
      }, 500);
    } catch {
      setMensaje(
        'No se pudo asignar la encuesta. Es posible que ya esté asignada.'
      );
    }
  };

  const responderEncuesta = (encuesta: Encuesta) => {
    if (!empleadoSeleccionado) return;

    const ruta = obtenerRutaEncuesta(encuesta.id);

    navigate(
      `${ruta}?empleado=${encodeURIComponent(
        empleadoSeleccionado.numero_empleado
      )}`
    );
  };

  const abrirNuevo = () => {
    setEditId(null);

    setForm({
      numero_empleado: '',
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_alta: '',
    });

    setError('');
    setModal(true);
  };

  const guardarEmpleado = async () => {
    try {
      setError('');

      if (!form.numero_empleado.trim() || !form.nombre.trim()) {
        setError(
          'El número de empleado y el nombre son obligatorios.'
        );
        return;
      }

      if (editId) {
        await api.patch(
          `/usuarios/empleados/${editId}/`,
          form
        );
      } else {
        await api.post('/usuarios/empleados/', form);
      }

      setModal(false);
      fetchEmpleados();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'No se pudo guardar el empleado.'
      );
    }
  };

  const eliminarEmpleado = async (id: number) => {
    try {
      await api.delete(`/usuarios/empleados/${id}/`);

      setConfirmDelete(null);
      fetchEmpleados();
    } catch {
      setError('No se pudo eliminar el empleado.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Empleados</h1>

          <p>
            Selecciona un empleado para asignar o responder
            una encuesta.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          onClick={abrirNuevo}
        >
          + Nuevo empleado
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filtroAcceso}
          onChange={(e) => setFiltroAcceso(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="true">Con acceso</option>
          <option value="false">Sin acceso</option>
        </select>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          Cargando empleados...
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. empleado</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Seleccionar</th>
              </tr>
            </thead>

            <tbody>
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    No hay empleados registrados.
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => (
                  <tr key={empleado.id}>
                    <td>
                      {empleado.numero_empleado}
                    </td>

                    <td>
                      {empleado.nombre_completo}
                    </td>

                    <td>
                      <span
                        className={
                          empleado.activo
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {empleado.activo
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <button
                        className={styles.primaryButton}
                        onClick={() =>
                          abrirEmpleado(empleado)
                        }
                        disabled={!empleado.activo}
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalEncuestas &&
        empleadoSeleccionado && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <h2>
                    Seleccionar encuesta
                  </h2>

                  <p>
                    Empleado:{' '}
                    <strong>
                      {
                        empleadoSeleccionado.numero_empleado
                      }
                    </strong>{' '}
                    —{' '}
                    {
                      empleadoSeleccionado.nombre_completo
                    }
                  </p>
                </div>

                <button
                  className={styles.closeButton}
                  onClick={() =>
                    setModalEncuestas(false)
                  }
                >
                  ×
                </button>
              </div>

              {mensaje && (
                <div className={styles.info}>
                  {mensaje}
                </div>
              )}

              {loadingEncuestas ? (
                <div className={styles.loading}>
                  Cargando encuestas...
                </div>
              ) : (
                <div className={styles.surveyList}>
                  {encuestas.length === 0 ? (
                    <p>
                      No hay encuestas disponibles.
                    </p>
                  ) : (
                    encuestas.map((encuesta) => (
                      <div
                        className={styles.surveyCard}
                        key={encuesta.id}
                      >
                        <div>
                          <h3>
                            {encuesta.titulo}
                          </h3>

                          {encuesta.descripcion && (
                            <p>
                              {
                                encuesta.descripcion
                              }
                            </p>
                          )}
                        </div>

                        <div
                          className={
                            styles.surveyActions
                          }
                        >
                          <button
                            className={
                              styles.primaryButton
                            }
                            onClick={() =>
                              asignarYResponder(
                                encuesta
                              )
                            }
                          >
                            Asignar y responder
                          </button>

                          <button
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              responderEncuesta(
                                encuesta
                              )
                            }
                          >
                            Responder encuesta
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div
                className={styles.modalFooter}
              >
                <button
                  className={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    setModalEncuestas(false)
                  }
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {modal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>
                {editId
                  ? 'Editar empleado'
                  : 'Nuevo empleado'}
              </h2>

              <button
                className={styles.closeButton}
                onClick={() =>
                  setModal(false)
                }
              >
                ×
              </button>
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.form}>
              <label>
                No. empleado

                <input
                  value={
                    form.numero_empleado
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      numero_empleado:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Nombre

                <input
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nombre:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Apellido paterno

                <input
                  value={
                    form.apellido_paterno
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      apellido_paterno:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Apellido materno

                <input
                  value={
                    form.apellido_materno
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      apellido_materno:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Fecha de alta

                <input
                  type="date"
                  value={form.fecha_alta}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fecha_alta:
                        e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div
              className={styles.modalFooter}
            >
              <button
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setModal(false)
                }
              >
                Cancelar
              </button>

              <button
                className={
                  styles.primaryButton
                }
                onClick={
                  guardarEmpleado
                }
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>
              Eliminar empleado
            </h2>

            <p>
              ¿Seguro que deseas eliminar
              este empleado?
            </p>

            <div
              className={
                styles.modalFooter
              }
            >
              <button
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setConfirmDelete(null)
                }
              >
                Cancelar
              </button>

              <button
                className={
                  styles.dangerButton
                }
                onClick={() =>
                  eliminarEmpleado(
                    confirmDelete
                  )
                }
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empleados;