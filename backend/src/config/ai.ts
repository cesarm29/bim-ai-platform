import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const BIM_SYSTEM_PROMPT = `Eres un experto en BIM (Building Information Modeling) y construcción.
Ayudas a arquitectos, ingenieros y constructores a optimizar sus proyectos.
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
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
  area?: number;
  floors?: number;
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analiza el siguiente proyecto de construcción y proporciona:
1. Estimación de tiempos por fase
2. Recomendaciones de optimización
3. Posibles riesgos
4. Sugerencias de materiales y métodos constructivos

Datos del proyecto:
- Nombre: ${data.projectName}
- Descripción: ${data.description}
- Ubicación: ${data.location || 'No especificada'}
- Área: ${data.area || 'No especificada'} m²
- Pisos: ${data.floors || 'No especificado'}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
