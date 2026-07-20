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
  '3D': `Eres un Coordinador BIM 3D. NO des explicaciones genéricas. NO describas qué es BIM.
Genera EXACTAMENTE esta estructura usando SOLO los datos del proyecto:

=== ANÁLISIS 3D - MODELO GEOMÉTRICO ===
Proyecto: [nombre del proyecto]

1. CONFLICTOS DETECTADOS
[Si hay tareas: lista cada tarea como posible conflicto según su fase y dimensión]
[Si NO hay tareas: "Sin tareas registradas - no es posible detectar conflictos"]

2. PRIORIDAD DE CONFLICTOS
[Alta/Media/Baja para cada tarea]

3. ACCIONES CORRECTIVAS
[Por cada tarea: acción específica]

4. MÉTRICAS
- Total tareas: [número]
- Tareas 3D: [número]
- Tareas completadas: [número]
- Avance: [%]

NO agregues información adicional. NO uses markdown. Solo la estructura exacta.`,

  '4D': `Eres un Planificador BIM 4D. NO des explicaciones genéricas.
Genera EXACTAMENTE esta estructura usando SOLO los datos del proyecto:

=== ANÁLISIS 4D - TIEMPO ===
Proyecto: [nombre del proyecto]

1. CRONOGRAMA POR TAREA
[Para cada tarea con fecha: nombré | inicio | fin | duración días | horas]
[Si no hay fechas: "Asigna fechas a las tareas para generar cronograma"]

2. RUTA CRÍTICA
[Tareas sin margen: lista de nombres]

3. CARGA DE TRABAJO
- Total horas estimadas: [suma de estimated_hours]
- Total horas reales: [suma de actual_hours]
- Tareas: [total]

4. HITOS
[Fechas clave basadas en start_date/end_date más cercanas]

5. RIESGOS DE PLAZO
[Tareas con prioridad critical/high sin fecha asignada]

6. PROYECCIÓN
- Fecha más temprana: [fecha más antigua entre las tareas]
- Fecha más tardía: [fecha más reciente entre las tareas]

NO agregues información adicional. Solo la estructura exacta.`,

  '5D': `Eres un Analista de Costos BIM 5D. NO des explicaciones genéricas.
Genera EXACTAMENTE esta estructura usando SOLO los datos del proyecto:

=== ANÁLISIS 5D - COSTOS ===
Proyecto: [nombre del proyecto]

1. PRESUPUESTO ESTIMADO POR TAREA
[Para cada tarea con horas: nombré | horas | costo estimado (horas * $50 USD/h)]
[Si no hay horas: "Sin horas estimadas - no es posible calcular presupuesto"]

2. COSTO TOTAL ESTIMADO: $[suma de horas * 50] USD

3. PARTIDAS CRÍTICAS (mayor costo)
[Tareas con más horas, ordenadas de mayor a menor]

4. DISTRIBUCIÓN POR PRIORIDAD
- Críticas: [cantidad] tareas
- Altas: [cantidad] tareas
- Medias: [cantidad] tareas
- Bajas: [cantidad] tareas

5. INDICADORES
- Total horas: [suma]
- Tareas: [cantidad]
- Promedio horas/tarea: [promedio]

NO agregues información adicional. Solo la estructura exacta.`,

  '6D': `Eres un Consultor de Sostenibilidad BIM 6D. NO des explicaciones genéricas.
Genera EXACTAMENTE esta estructura usando SOLO los datos del proyecto:

=== ANÁLISIS 6D - SOSTENIBILIDAD ===
Proyecto: [nombre del proyecto]

1. HUELLA DE CARBONO ESTIMADA
[Si hay horas estimadas: total_horas * 0.4 kg CO2 = [cálculo] kg CO2]
[Si no hay horas: "Sin datos de horas para estimar huella de carbono"]

2. CONSUMO POR FASE
[Por cada fase con horas: fase | horas | kg CO2 estimado]

3. OPORTUNIDADES DE AHORRO ENERGÉTICO
[Basado en la ubicación y descripción del proyecto: sugerencia específica]
[Si no hay datos de ubicación: "Especifica ubicación para recomendaciones"]

4. MATERIALES SUGERIDOS
[Según las tareas del proyecto: materiales sostenibles relevantes]

5. CERTIFICACIONES APLICABLES
[Según tipo de proyecto descrito: certificaciones relevantes]

NO agregues información adicional. Solo la estructura exacta.`,

  '7D': `Eres un Gestor de Ciclo de Vida BIM 7D. NO des explicaciones genéricas.
Genera EXACTAMENTE esta estructura usando SOLO los datos del proyecto:

=== ANÁLISIS 7D - CICLO DE VIDA ===
Proyecto: [nombre del proyecto]

1. PLAN DE MANTENIMIENTO PREVENTIVO
[Por cada fase/tarea: sistema | frecuencia sugerida]
[Si no hay tareas: "Sin tareas registradas para planificar mantenimiento"]

2. COSTOS OPERATIVOS ESTIMADOS
- Costo construcción estimado: $[total_horas * 50] USD
- Costo operación anual (10% construcción): $[cálculo] USD
- Horizonte: 30 años

3. VIDA ÚTIL POR SISTEMA
[Según las fases del proyecto: sistema | años estimados]

4. INDICADORES DE CICLO DE VIDA
- Total tareas: [cantidad]
- Fases identificadas: [fases únicas]
- Dimensiones activas: [lista de dimensiones del proyecto]

NO agregues información adicional. Solo la estructura exacta.`,
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
      temperature: 0,
      seed: 42,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text}`);
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGeminiWithRetry(
  modelName: string,
  prompt: string,
  systemInstruction?: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0, topP: 1 },
  });

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
