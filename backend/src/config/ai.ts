import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const BIM_SYSTEM_PROMPT = `Eres un experto en BIM (Building Information Modeling) y construcción.
Ayudas a arquitectos, ingenieros y constructores a optimizar sus proyectos.
Dominas las dimensiones BIM:
- 3D (Modelo Geométrico): Representación visual, detección de choques y conflictos entre instalaciones.
- 4D (Tiempo): Vinculación del modelo con cronogramas de obra, simulación constructiva.
- 5D (Costos): Presupuestos, mediciones automáticas, control de impacto económico.
- 6D (Sostenibilidad): Eficiencia energética, análisis ambiental de materiales.
- 7D (Ciclo de vida): Mantenimiento, garantías, gestión de instalaciones a largo plazo.

Puedes responder sobre:
- Planificación y programación de obras
- Estimación de costos y materiales
- Optimización de tiempos de construcción
- Análisis de modelos BIM
- Mejores prácticas constructivas
- Normativas y estándares BIM
- Coordinación entre disciplinas
- Detección de conflictos en modelos
- Sostenibilidad y eficiencia energética
- Gestión de calidad en obra

Responde de forma clara y técnica, usando español.
Si te preguntan algo fuera del ámbito BIM, redirige amablemente al tema.`;

const DIMENSION_PROMPTS: Record<string, string> = {
  '3D': `Eres un Coordinador BIM 3D. No expliques qué es BIM 3D.
Usa SOLO los datos del proyecto para generar entregables concretos.

Entregables obligatorios:
1. LISTA de conflictos detectados entre tareas registradas
2. PRIORIDAD de cada conflicto (Alta/Media/Baja)
3. ACCIONES correctivas específicas por cada tarea
4. CALENDARIO de revisiones del modelo sugerido
5. MÉTRICAS: % de avance del modelo vs planificado`,

  '4D': `Eres un Planificador BIM 4D. No expliques qué es BIM 4D.
Usa SOLO los datos del proyecto (tareas, fechas, horas) para generar entregables.

Entregables obligatorios:
1. CRONOGRAMA: distribuye las tareas en el tiempo del proyecto
2. RUTA CRÍTICA: qué tareas definen la duración total
3. HITOS: fechas clave del proyecto
4. CARGA DE TRABAJO: horas estimadas por semana/mes
5. RIESGOS DE PLAZO: tareas que pueden retrasar el proyecto
6. PROYECCIÓN: fecha estimada de finalización vs planificada`,

  '5D': `Eres un Analista de Costos BIM 5D. No expliques qué es BIM 5D.
Usa SOLO los datos del proyecto para generar proyecciones financieras.

Entregables obligatorios:
1. PRESUPUESTO ESTIMADO: costo por tarea según horas estimadas
2. FLUJO DE CAJA PROYECTADO: egresos mes a mes
3. CURVA S: avance financiero vs tiempo
4. PARTIDAS CRÍTICAS: tareas con mayor impacto en presupuesto
5. AHORROS POTENCIALES: dónde optimizar según datos del proyecto
6. INDICADORES: costo estimado total, costo por hora, ROI proyectado`,

  '6D': `Eres un Consultor de Sostenibilidad BIM 6D. No expliques qué es BIM 6D.
Usa SOLO los datos del proyecto para generar análisis ambiental.

Entregables obligatorios:
1. HUELLA DE CARBONO estimada del proyecto según sus tareas
2. CONSUMO ENERGÉTICO proyectado por fase
3. MATERIALES SOSTENIBLES sugeridos para las partidas del proyecto
4. ESTRATEGIAS PASIVAS aplicables al tipo de proyecto
5. CERTIFICACIONES alcanzables (LEED, EDGE) con requisitos
6. AHORRO estimado en costos operativos con medidas sostenibles`,

  '7D': `Eres un Gestor de Ciclo de Vida BIM 7D. No expliques qué es BIM 7D.
Usa SOLO los datos del proyecto para generar plan de operación.

Entregables obligatorios:
1. PLAN DE MANTENIMIENTO: frecuencia y tareas preventivas por sistema
2. COSTOS OPERATIVOS ANUALES proyectados
3. VIDA ÚTIL estimada de cada sistema del proyecto
4. CRONOGRAMA DE REEMPLAZOS: año y costo estimado
5. DIGITALIZACIÓN: qué información del modelo se necesita para FM
6. INDICADORES: costo anual de operación, costo por m², ROI del ciclo de vida`,
};

async function callGroq(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGeminiWithRetry(
  modelName: string,
  prompt: string,
  systemInstruction?: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  if (history) {
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      systemInstruction,
    });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  const result = await model.generateContent(
    systemInstruction
      ? { contents: [{ role: 'user', parts: [{ text: prompt }] }], systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] } }
      : prompt
  );
  return result.response.text();
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (err: any) {
    console.error('Primary AI provider failed:', err?.message);
    return await fallback();
  }
}

export async function chatWithAI(
  message: string,
  history: { role: string; content: string }[]
) {
  const useGroq = !!GROQ_API_KEY;

  if (useGroq) {
    return withFallback(
      () => callGroq(
        [...history, { role: 'user', content: message }],
        BIM_SYSTEM_PROMPT
      ),
      async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const chat = model.startChat({
          history: history.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          systemInstruction: BIM_SYSTEM_PROMPT,
        });
        const result = await chat.sendMessage(message);
        return result.response.text();
      }
    );
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    systemInstruction: BIM_SYSTEM_PROMPT,
  });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

export async function analyzeProjectData(data: {
  projectName: string;
  description: string;
  location?: string;
  dimensions?: string[];
  area?: number;
  floors?: number;
}) {
  const dims = data.dimensions?.join(', ') || '3D, 4D, 5D';
  const prompt = `Analiza el siguiente proyecto de construcción y proporciona:
1. Estimación de tiempos por fase (Dimensión 4D)
2. Recomendaciones de optimización de costos (Dimensión 5D)
3. Posibles riesgos y detección de conflictos (Dimensión 3D)
4. Sugerencias de sostenibilidad y eficiencia energética (Dimensión 6D)
5. Recomendaciones para mantenimiento y ciclo de vida (Dimensión 7D)

Datos del proyecto:
- Nombre: ${data.projectName}
- Descripción: ${data.description}
- Ubicación: ${data.location || 'No especificada'}
- Dimensiones BIM activas: ${dims}
- Área: ${data.area || 'No especificada'} m²
- Pisos: ${data.floors || 'No especificado'}

Enfócate en las dimensiones activas del proyecto: ${dims}. Si alguna dimensión no está activa, menciónala brevemente como oportunidad de mejora.`;

  const useGroq = !!GROQ_API_KEY;

  if (useGroq) {
    return withFallback(
      () => callGroq([{ role: 'user', content: prompt }], BIM_SYSTEM_PROMPT),
      () => callGeminiWithRetry('gemini-3-flash-preview', prompt, BIM_SYSTEM_PROMPT)
    );
  }

  return callGeminiWithRetry('gemini-3-flash-preview', prompt, BIM_SYSTEM_PROMPT);
}

export async function analyzeDimension(
  dimension: string,
  projectData: {
    projectName: string;
    description: string;
    location?: string;
    dimensions?: string[];
    tasks?: any[];
    area?: number;
    floors?: number;
  }
) {
  const systemPrompt = DIMENSION_PROMPTS[dimension];
  if (!systemPrompt) throw new Error(`Dimensión ${dimension} no soportada`);

  const dims = projectData.dimensions?.join(', ') || '3D, 4D, 5D';
  const tasksInfo = projectData.tasks?.length
    ? projectData.tasks.map((t: any) =>
        `- Tarea: ${t.name} | Estado: ${t.status} | Prioridad: ${t.priority} | Dimensión: ${t.dimension} | Horas est.: ${t.estimated_hours || 'N/A'}`
      ).join('\n')
    : 'Sin tareas registradas';

  const prompt = `Datos del proyecto:
- Nombre: ${projectData.projectName}
- Descripción: ${projectData.description}
- Ubicación: ${projectData.location || 'No especificada'}
- Dimensiones BIM activas: ${dims}
- Área: ${projectData.area || 'No especificada'} m²
- Pisos: ${projectData.floors || 'No especificado'}

Tareas del proyecto:
${tasksInfo}

${systemPrompt}

Proporciona un análisis detallado y recomendaciones ACCIONABLES específicas para este proyecto.`;

  const useGroq = !!GROQ_API_KEY;

  if (useGroq) {
    return withFallback(
      () => callGroq([{ role: 'user', content: prompt }], systemPrompt),
      () => callGeminiWithRetry('gemini-3-flash-preview', prompt, systemPrompt)
    );
  }

  return callGeminiWithRetry('gemini-3-flash-preview', prompt, systemPrompt);
}
