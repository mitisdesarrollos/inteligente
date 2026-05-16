// api/chat.js
// Estructura compatible con Netlify Functions

exports.handler = async (event, context) => {
  // Solo aceptar peticiones POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Obtener el mensaje del usuario
  let mensaje;
  try {
    const body = JSON.parse(event.body);
    mensaje = body.mensaje;
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Cuerpo de la petición inválido' })
    };
  }

  if (!mensaje) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Falta el mensaje del usuario' })
    };
  }

  try {
    // La personalidad de Mitis (instrucción secreta)
    const systemInstruction = `Sos Mitis, un asistente inmobiliario experto. El usuario está probando una demo.
      Si te piden una propiedad específica, responde de forma profesional y utilizá preguntas para saber qué tipo de propiedad quiere, en qué zona, si es para venta o alquiler, etc.
      Usá tus conocimientos geográficos para ser más útil.
      Es importante que le recuerdes al usuario que "en el sistema real verías las fotos aquí".
      Sé breve (máximo 3 líneas), amable y terminá con una pregunta para seguir la conversación.`;

    // Preparar la llamada a Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        parts: [{ text: mensaje }]
      }]
    };

    // Llamar a la API de Google
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Gemini:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error al comunicarse con la IA' })
      };
    }

    // Devolver la respuesta al frontend
    const respuestaIA = data.candidates[0].content.parts[0].text;
    return {
      statusCode: 200,
      body: JSON.stringify({ respuesta: respuestaIA })
    };

  } catch (error) {
    console.error('Error en la función:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
