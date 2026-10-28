export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ valido: false, mensaje: 'Código vacío' });
  }

  // Verificar que las variables de entorno existen
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_ANON_KEY');
    return res.status(500).json({ valido: false, mensaje: 'Error de configuración del servidor' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/usar_codigo_descuento`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ p_codigo: codigo.toUpperCase() })
      }
    );

    // Si Supabase devuelve un error HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error:', response.status, errorText);
      return res.status(500).json({ valido: false, mensaje: 'Error al consultar la base de datos' });
    }

    let data = await response.json();

    // Supabase a veces devuelve el resultado de RPC dentro de un array
    if (Array.isArray(data)) {
      data = data[0];
    }

    // Validar que la respuesta tiene la forma esperada
    if (typeof data?.valido === 'undefined') {
      console.error('Respuesta inesperada de Supabase:', data);
      return res.status(500).json({ valido: false, mensaje: 'Respuesta inesperada del servidor' });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error en validar-codigo:', error);
    return res.status(500).json({ valido: false, mensaje: 'Error del servidor. Intentá de nuevo.' });
  }
}