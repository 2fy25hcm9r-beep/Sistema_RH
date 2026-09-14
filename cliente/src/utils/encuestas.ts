export const PREGUNTAS_BLOQUEO = ['brindar servicio', 'servicio a clientes', 'jefe de otros', 'jefe de trabajadores'];
export const PREGUNTAS_CONDICIONALES_SERVICIO = ['atiendo clientes', 'personas necesitadas', 'mostrar sentimientos distintos', 'situaciones de violencia'];
export const PREGUNTAS_CONDICIONALES_JEFE = ['subordinados comunican', 'dificultan el logro', 'cooperan poco', 'ignoran sugerencias'];
export const REPORTE_PRIORIDAD_CUESTIONARIOS = ['Cuestionario 3', 'Cuestionario 2'];

export const PREGUNTAS_BLOQUEO_CUESTIONARIO1 = [
  'accidente', 'asalto', 'actos violentos', 'secuestro', 'amenazas', 'riesgo su vida'
];

export function normalizarTexto(valor: unknown): string {
  return String(valor ?? '').trim().toLowerCase();
}

export function esSi(valor: unknown): boolean {
  const texto = normalizarTexto(valor);
  return texto === 'si' || texto === 'sí';
}

export function esPreguntaBloqueo(texto: string): boolean {
  const textoLower = texto.toLowerCase();
  return PREGUNTAS_BLOQUEO.some((fragmento) => textoLower.includes(fragmento));
}

export function esPreguntaBloqueoCuestionario1(texto: string): boolean {
  const textoLower = texto.toLowerCase();
  return PREGUNTAS_BLOQUEO_CUESTIONARIO1.some((fragmento) => textoLower.includes(fragmento));
}

export function esPreguntaServicioCondicional(texto: string): boolean {
  const textoLower = texto.toLowerCase();
  return PREGUNTAS_CONDICIONALES_SERVICIO.some((fragmento) => textoLower.includes(fragmento));
}

export function esPreguntaJefeCondicional(texto: string): boolean {
   const textoLower = texto.toLowerCase();
   return PREGUNTAS_CONDICIONALES_JEFE.some((fragmento) => textoLower.includes(fragmento));
 }

 export function obtenerNumeroPreguntaVisible(texto: string, orden: number): number | null {
  if (esPreguntaBloqueo(texto)) {
    return null;
  }
  if (esPreguntaServicioCondicional(texto)) {
    return orden - 1;
  }
  if (esPreguntaJefeCondicional(texto)) {
    return orden - 2;
  }
  return orden;
}

export function debeOcultarsePregunta(texto: string, mostrarServicio: boolean, mostrarJefe: boolean): boolean {
  const isServicioBlock = esPreguntaServicioCondicional(texto);
  const isJefeBlock = esPreguntaJefeCondicional(texto);
  return (isServicioBlock && !mostrarServicio) || (isJefeBlock && !mostrarJefe);
}

export function debeOcultarsePreguntaCuestionario1(orden: number, eventoTraumatico: boolean): boolean {
  const ORDENES_CONDICIONALES = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
  return ORDENES_CONDICIONALES.includes(orden) && !eventoTraumatico;
}

export function esPreguntaRequeridaCondicional(texto: string): boolean {
  return esPreguntaServicioCondicional(texto) || esPreguntaJefeCondicional(texto);
}

export function seleccionarEncuestaReporte<T extends { titulo: string }>(encuestas: T[]): T | null {
  for (const titulo of REPORTE_PRIORIDAD_CUESTIONARIOS) {
    const encontrada = encuestas.find((encuesta) => encuesta.titulo === titulo);
    if (encontrada) {
      return encontrada;
    }
  }
  return null;
}