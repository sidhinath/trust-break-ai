export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  res.status(200).json({
    ok: true,
    service: 'ghostnet-api',
    timestamp: new Date().toISOString(),
  })
}
