export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { monto, descripcion, codigo_proyecto, tipo_pago } = req.body;

  if (!monto || !descripcion || !codigo_proyecto) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [
          {
            title: descripcion,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS'
          }
        ],
        external_reference: codigo_proyecto,
        back_urls: {
          success: `${req.headers.origin}/AsesoríaEspacial/relevamiento.html?codigo=${codigo_proyecto}&pago=ok&tipo=${tipo_pago}`,
          failure: `${req.headers.origin}/AsesoríaEspacial/pago.html?error=true`,
          pending: `${req.headers.origin}/AsesoríaEspacial/pago.html?pendiente=true`
        },
        auto_return: 'approved',
        statement_descriptor: 'ESTUDIO CAVLA',
        metadata: {
          codigo_proyecto,
          tipo_pago
        }
      })
    });

    const data = await response.json();

    if (!data.init_point) {
      return res.status(500).json({ error: 'No se pudo crear la preferencia de pago', detalle: data });
    }

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}