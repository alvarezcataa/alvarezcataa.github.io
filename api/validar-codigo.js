export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ valido: false, mensaje: 'Código vacío' });
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

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ valido: false, mensaje: 'Error del servidor' });
  }
}