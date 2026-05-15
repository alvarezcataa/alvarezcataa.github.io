export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('Falta variable de entorno: MP_ACCESS_TOKEN');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const {
    monto, nombre, apellido, email, servicio,
    // Datos del proyecto para pasar a mp-exitoso via external_reference
    ambiente, superficie, estado, precio,
    descuento_pct, descuento_codigo,
    telefono, calle, numero, depto, barrio, ciudad, provincia
  } = req.body;

  if (!monto || !email) {
    return res.status(400).json({ error: 'Faltan datos requeridos (monto, email)' });
  }

  // Codificamos los datos del cliente en la back_url para recuperarlos en mp-exitoso
  // (sessionStorage no persiste entre dominios al volver de MP)
  const clienteParams = new URLSearchParams({
    nombre:    nombre    || '',
    apellido:  apellido  || '',
    email:     email     || '',
    telefono:  telefono  || '',
    calle:     calle     || '',
    numero:    numero    || '',
    depto:     depto     || '',
    barrio:    barrio    || '',
    ciudad:    ciudad    || '',
    provincia: provincia || '',
    ambiente:  ambiente  || '',
    superficie:superficie|| '',
    estado:    estado    || '',
    precio:    precio    || '',
    descuento_pct:    descuento_pct    || '',
    descuento_codigo: descuento_codigo || '',
    senia:     String(Math.round(Number(monto)))
  }).toString();

  const baseUrl    = `${process.env.SITE_URL}/AsesoríaEspacial`;
  const exitoUrl   = `${baseUrl}/mp-exitoso.html?${clienteParams}`;
  const externalRef = `CAVLA-${Date.now()}`;

  try {
    const preference = {
      items: [
        {
          title:      servicio || 'Asesoría Espacial Residencial — Seña',
          quantity:   1,
          unit_price: Number(monto),
          currency_id: 'ARS'
        }
      ],
      payer: {
        name:    nombre   || '',
        surname: apellido || '',
        email:   email
      },
      payment_methods: {
        installments:         6,
        default_installments: 1
      },
      back_urls: {
        success: exitoUrl,
        failure: exitoUrl,
        pending: exitoUrl
      },
      auto_return:          'approved',
      statement_descriptor: 'ESTUDIO CAVLA',
      external_reference:   externalRef
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MP error completo:', response.status, errorText);
      return res.status(500).json({ error: 'Error al crear preferencia en Mercado Pago', detalle: errorText });
    }

    const data = await response.json();
    console.log('MP preferencia creada:', JSON.stringify({ id: data.id, init_point: data.init_point, status: data.status }));

    // Devolvemos preference_id (para el modal) e init_point (fallback redirección)
    return res.status(200).json({
      preference_id: data.id,
      init_point:    data.init_point
    });

  } catch (error) {
    console.error('Error en crear-preferencia:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}