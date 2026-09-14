import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { DashboardData } from '../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './Dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface DistribucionRiesgo { nivel: string; cantidad: number; }

export default function Dashboard() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [riesgoC2, setRiesgoC2] = useState<DistribucionRiesgo[]>([]);
  const [riesgoC3, setRiesgoC3] = useState<DistribucionRiesgo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/reportes/dashboard/'),
      api.get<DistribucionRiesgo[]>('/reportes/distribucion-riesgo/?titulo=Cuestionario 2'),
      api.get<DistribucionRiesgo[]>('/reportes/distribucion-riesgo/?titulo=Cuestionario 3'),
    ]).then(([dashRes, c2Res, c3Res]) => {
      setDatos(dashRes.data);
      setRiesgoC2(c2Res.data || []);
      setRiesgoC3(c3Res.data || []);
    }).catch(() => {
      // Fallback
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando dashboard...</div>;

  const kpis = [
    { value: datos?.total_respuestas ?? 0, label: 'Evaluaciones Completadas' },
    { value: datos?.atencion_clinica ?? 0, label: 'Requieren Atención Clínica' },
    { value: datos?.alto ?? 0, label: 'Riesgo Alto' },
    { value: datos?.muy_alto ?? 0, label: 'Riesgo Muy Alto' },
  ];

  const renderDoughnut = (titulo: string, datosDistribucion: DistribucionRiesgo[]) => {
    const riesgoLabels = ['Nulo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];
    const riesgoColores = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
    const riesgoData = riesgoLabels.map((_, index) => {
      const niveles = ['nulo', 'bajo', 'medio', 'alto', 'muy_alto'];
      const item = datosDistribucion.find(d => d.nivel === niveles[index]);
      return item?.cantidad || 0;
    });
    const totalRiesgo = riesgoData.reduce((a, b) => a + b, 0);

    const doughnutRiesgoData = {
      labels: riesgoLabels,
      datasets: [{
        data: riesgoData,
        backgroundColor: riesgoColores,
        borderWidth: 0,
      }],
    };

    return (
      <div className={styles.card}>
        <h3>{titulo}</h3>
        {totalRiesgo > 0 ? (
          <div className={styles.distribucionGeneral}>
            <div className={styles.doughnutWrap}>
              <Doughnut 
                data={doughnutRiesgoData} 
                options={{ 
                  responsive: true, 
                  cutout: '60%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const valor = ctx.parsed;
                          const porcentaje = totalRiesgo > 0 ? ((valor / totalRiesgo) * 100).toFixed(1) : 0;
                          return `${ctx.label}: ${valor} (${porcentaje}%)`;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
            <div className={styles.leyendaEmojis}>
              {riesgoLabels.map((label, index) => {
                const cantidad = riesgoData[index];
                const porcentaje = totalRiesgo > 0 ? ((cantidad / totalRiesgo) * 100).toFixed(0) : 0;
                return (
                  <div key={index} className={styles.emojiItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span 
                        style={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          backgroundColor: riesgoColores[index],
                          display: 'inline-block',
                          flexShrink: 0
                        }} 
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                      {cantidad} ({porcentaje}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
            No hay datos disponibles
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Dashboard general</h2>

      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className={styles.kpi}>
            <span>{kpi.value}</span>
            <label>{kpi.label}</label>
          </div>
        ))}
      </div>

      <div className={styles.graficasRow}>
        {renderDoughnut('Distribución por nivel de riesgo - Cuestionario 2', riesgoC2)}
        {renderDoughnut('Distribución por nivel de riesgo - Cuestionario 3', riesgoC3)}
      </div>
    </div>
  );
}
