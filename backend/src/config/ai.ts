import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];

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

async function withRetry<T>(fn: (model: string) => Promise<T>, retries = 2): Promise<T> {
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        const msg = err?.message || '';
        const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('Quota');
        if (isQuota && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (isQuota && model === MODELS[MODELS.length - 1]) throw err;
        if (!isQuota) throw err;
        break;
      }
    }
  }
  throw new Error('Todos los modelos sin cuota disponible');
}

export async function chatWithAI(
  message: string,
  history: { role: string; content: string }[]
) {
  return withRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      systemInstruction: BIM_SYSTEM_PROMPT,
    });
    const result = await chat.sendMessage(message);
    return result.response.text();
  });
}

export async function analyzeProjectData(data: {
  projectName: string;
  description: string;
  location?: string;
  dimensions?: string[];
  area?: number;
  floors?: number;
}) {
  return withRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
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

    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

const DIMENSION_PROMPTS: Record<string, string> = {
  '3D': `Eres un Agente BIM especializado en la Dimensión 3D - Modelo Geométrico.
Tu función es analizar modelos arquitectónicos, estructurales y de instalaciones.
Debes detectar posibles conflictos espaciales, problemas de coordinación entre disciplinas,
y recomendar mejoras en el modelo geométrico.

Basado en los datos del proyecto, proporciona:
1. Análisis de posibles conflictos entre instalaciones (choques)
2. Recomendaciones de coordinación espacial
3. Mejores prácticas de modelado para la disciplina
4. Puntos críticos de revisión del modelo`,

  '4D': `Eres un Agente BIM especializado en la Dimensión 4D - Tiempo.
Tu función es analizar y optimizar cronogramas de construcción,
planificar secuencias constructivas y simular el avance de obra.

Basado en los datos del proyecto, proporciona:
1. Estrategia de planificación de fases constructivas
2. Estimación de duración por fase
3. Identificación de la ruta crítica del proyecto
4. Recomendaciones para optimizar el cronograma
5. Sugerencias para la simulación constructiva 4D`,

  '5D': `Eres un Agente BIM especializado en la Dimensión 5D - Costos.
Tu función es realizar estimaciones presupuestarias, análisis de costos,
mediciones de cantidades de obra y optimización financiera de proyectos.

Basado en los datos del proyecto, proporciona:
1. Estimación de costos por partida (estructura, acabados, instalaciones)
2. Análisis de costo por metro cuadrado
3. Recomendaciones de optimización presupuestaria
4. Identificación de partidas de mayor impacto económico
5. Sugerencias para control de costos durante la obra`,

  '6D': `Eres un Agente BIM especializado en la Dimensión 6D - Sostenibilidad.
Tu función es analizar la eficiencia energética, evaluar el impacto ambiental
de materiales y recomendar estrategias de construcción sostenible.

Basado en los datos del proyecto, proporciona:
1. Evaluación de eficiencia energética del diseño
2. Recomendaciones de materiales sostenibles
3. Estrategias pasivas de climatización
4. Análisis de huella de carbono estimada
5. Sugerencias para certificaciones de sostenibilidad (LEED, BREEAM, etc.)`,

  '7D': `Eres un Agente BIM especializado en la Dimensión 7D - Ciclo de Vida.
Tu función es analizar la gestión de mantenimiento, planificar el ciclo de vida
de las instalaciones y optimizar los costos de operación a largo plazo.

Basado en los datos del proyecto, proporciona:
1. Estrategia de mantenimiento preventivo recomendada
2. Estimación de costos de operación anual
3. Plan de sustitución de sistemas y equipos
4. Recomendaciones para la gestión de instalaciones (FM)
5. Sugerencias para la digitalización del mantenimiento`,
};

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

  return withRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
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

    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}
