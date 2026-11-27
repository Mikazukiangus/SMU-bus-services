export interface ServerlessRequest {
  method?: string;
  query?: Record<string, unknown>;
}

export interface ServerlessResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): ServerlessResponse;
  json(body: unknown): unknown;
}

export default function handler(
  req: ServerlessRequest,
  res: ServerlessResponse,
): void {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use GET.',
    });
    return;
  }

  const ltaKeyConfigured = Boolean(process.env.LTA_ACCOUNT_KEY?.trim());

  res.status(200).json({
    ok: true,
    service: 'sg-busstop-api',
    endpoint: 'LTA DataMall v3 BusArrival',
    ltaKeyConfigured,
    refreshIntervalSeconds: 20,
    timestamp: new Date().toISOString(),
  });
}
