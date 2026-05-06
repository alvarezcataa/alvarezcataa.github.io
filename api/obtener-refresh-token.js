export default async function handler(req, res) {
  const { code } = req.query;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  'https://www.estudiocavla.com',
      grant_type:    'authorization_code'
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}