import type { ServerlessRequest, ServerlessResponse } from './health';

const LTA_BUS_ARRIVAL_V3_URL =
  'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';
const BUS_STOP_CODE_REGEX = /^\d{5}$/;
const SERVICE_NO_REGEX = /^[A-Za-z0-9]{1,6}$/;
const UPSTREAM_TIMEOUT_MS = 8000;

function readQueryParam(
  query: ServerlessRequest['query'],
  keys: string[],
): string {
  if (!query) return '';
  for (const key of keys) {
    const raw = query[key];
    if (typeof raw === 'string') {
      return raw.trim();
    }
    if (Array.isArray(raw) && typeof raw[0] === 'string') {
      return raw[0].trim();
    }
  }
  return '';
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse,
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    res.status(405).json({
      error: 'Method not allowed. Use GET.',
    });
    return;
  }

  const busStopCode = readQueryParam(req.query, [
    'BusStopCode',
    'busStopCode',
    'code',
  ]);
  const serviceNo = readQueryParam(req.query, ['ServiceNo', 'serviceNo']);

  if (!BUS_STOP_CODE_REGEX.test(busStopCode)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({
      error:
        'Invalid or missing BusStopCode. Provide a 5-digit Singapore bus stop code (e.g. 04121).',
    });
    return;
  }

  if (serviceNo && !SERVICE_NO_REGEX.test(serviceNo)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({
      error:
        'Invalid ServiceNo. Provide an alphanumeric Singapore bus service number (e.g. 7 or 225G).',
    });
    return;
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY?.trim();
  if (!accountKey) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({
      error:
        'LTA_ACCOUNT_KEY is not configured on the server. Add your LTA DataMall AccountKey to environment secrets.',
      code: 'LTA_KEY_MISSING',
    });
    return;
  }

  const upstreamUrl = new URL(LTA_BUS_ARRIVAL_V3_URL);
  upstreamUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    upstreamUrl.searchParams.set('ServiceNo', serviceNo);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!upstreamRes.ok) {
      res.setHeader('Cache-Control', 'no-store');
      const status =
        upstreamRes.status === 401 || upstreamRes.status === 403 ? 502 : upstreamRes.status;
      res.status(status).json({
        error:
          upstreamRes.status === 401 || upstreamRes.status === 403
            ? 'LTA DataMall rejected the configured AccountKey. Verify LTA_ACCOUNT_KEY.'
            : `LTA DataMall returned HTTP ${upstreamRes.status}.`,
        upstreamStatus: upstreamRes.status,
      });
      return;
    }

    const payload = await upstreamRes.json();

    // LTA DataMall v3 refreshes every 20 seconds
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=15, stale-while-revalidate=5',
    );
    res.status(200).json(payload);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'Timed out while contacting LTA DataMall.'
        : 'Unable to reach LTA DataMall BusArrival v3 service.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
