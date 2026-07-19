import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

export async function chatWithAI(
  message: string,
  history: { role: string; content: string }[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
}
