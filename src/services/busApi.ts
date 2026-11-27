import {
  ApiConfig,
  BusArrivalResponse,
  BusLoad,
  BusOperator,
  BusServiceArrival,
  BusStop,
  BusType,
  IncomingBus,
} from '../types/bus';
import {
  inferOperatorForService,
  SINGAPORE_BUS_STOPS,
} from '../data/singaporeStops';

export const STOP_CODE_REGEX = /^\d{5}$/;

export function isValidStopCode(code: string): boolean {
  return STOP_CODE_REGEX.test(code.trim());
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function inferRegionFromCode(code: string): BusStop['region'] {
  const prefix = parseInt(code.slice(0, 1), 10);
  if (prefix === 0 || prefix === 1) return 'Central & Orchard';
  if (prefix === 2 || prefix === 4) return 'West';
  if (prefix === 3) return 'Marina & CBD';
  if (prefix === 5) return 'North';
  if (prefix === 6) return 'North-East';
  return 'East';
}

function generateDeterministicServicesForCustomStop(code: string): string[] {
  const pool = [
    '7', '14', '30', '51', '61', '65', '70', '80', '97', '106',
    '133', '143', '154', '166', '175', '190', '197', '851', '858', '960',
  ];
  const seed = hashString(code);
  const count = 4 + (seed % 4);
  const chosen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % pool.length;
    chosen.add(pool[idx]);
  }
  return Array.from(chosen).sort(compareServiceNo);
}

export function lookupBusStop(rawCode: string): BusStop {
  const code = rawCode.trim();
  const existing = SINGAPORE_BUS_STOPS.find((stop) => stop.code === code);
  if (existing) return existing;

  return {
    code,
    description: `Bus Stop ${code}`,
    roadName: 'Unlisted Stop Code (Connect API for live details)',
    region: inferRegionFromCode(code),
    services: generateDeterministicServicesForCustomStop(code),
    isCustom: true,
  };
}

export function searchBusStops(query: string, limit = 8): BusStop[] {
  const q = query.trim().toLowerCase();
  if (!q) return SINGAPORE_BUS_STOPS.slice(0, limit);

  const scored = SINGAPORE_BUS_STOPS.map((stop) => {
    let score = 0;
    if (stop.code === q) score += 100;
    else if (stop.code.startsWith(q)) score += 60;
    else if (stop.code.includes(q)) score += 25;

    if (stop.description.toLowerCase().startsWith(q)) score += 45;
    else if (stop.description.toLowerCase().includes(q)) score += 30;

    if (stop.roadName.toLowerCase().includes(q)) score += 20;
    if (stop.region.toLowerCase().includes(q)) score += 10;
    if (stop.services.some((svc) => svc.toLowerCase() === q)) score += 22;

    return { stop, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.stop.code.localeCompare(b.stop.code));

  return scored.slice(0, limit).map((entry) => entry.stop);
}

export function compareServiceNo(a: string, b: string): number {
  const aMatch = a.match(/^(\d+)([A-Za-z]*)$/);
  const bMatch = b.match(/^(\d+)([A-Za-z]*)$/);
  if (!aMatch || !bMatch) return a.localeCompare(b);
  const numDiff = parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
  if (numDiff !== 0) return numDiff;
  return aMatch[2].localeCompare(bMatch[2]);
}

function buildSampleIncomingBus(
  nowMs: number,
  minutesAhead: number,
  seed: number,
  stopCode: string,
): IncomingBus {
  const arrivalMs = nowMs + minutesAhead * 60_000;
  const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SDA', 'LSD'];
  const types: BusType[] = ['DD', 'DD', 'SD', 'SD', 'BD'];

  return {
    originCode: stopCode,
    destinationCode: `${(parseInt(stopCode, 10) + 1200) % 99999}`.padStart(5, '0'),
    estimatedArrival: new Date(arrivalMs).toISOString(),
    latitude: '1.3048',
    longitude: '103.8318',
    visitNumber: '1',
    load: loads[seed % loads.length],
    feature: seed % 6 === 0 ? '' : 'WAB',
    type: types[(seed >> 2) % types.length],
  };
}

/**
 * Generates realistic, time-coherent Singapore bus arrivals that tick smoothly
 * relative to the current wall clock until the user connects their LTA DataMall API.
 */
function generateSampleArrivals(stopCode: string): BusArrivalResponse {
  const stop = lookupBusStop(stopCode);
  const nowMs = Date.now();
  const minuteBucket = Math.floor(nowMs / 60_000);

  const services: BusServiceArrival[] = stop.services.map((serviceNo) => {
    const seed = hashString(`${stopCode}:${serviceNo}`);
    const headway = 7 + (seed % 9); // 7–15 min frequency
    const phase = seed % headway;
    const elapsedInCycle = (minuteBucket + phase) % headway;
    const firstMin = Math.max(0, headway - elapsedInCycle - 1);
    const secondMin = firstMin + headway + (seed % 3);
    const thirdMin = secondMin + headway + ((seed >> 1) % 4);

    return {
      serviceNo,
      operator: inferOperatorForService(serviceNo),
      nextBus: buildSampleIncomingBus(nowMs, firstMin, seed + minuteBucket, stopCode),
      nextBus2: buildSampleIncomingBus(nowMs, secondMin, seed + 3, stopCode),
      nextBus3: buildSampleIncomingBus(nowMs, thirdMin, seed + 7, stopCode),
    };
  });

  return {
    busStopCode: stopCode,
    services: services.sort((a, b) => compareServiceNo(a.serviceNo, b.serviceNo)),
    fetchedAt: nowMs,
    source: 'sample',
  };
}

interface RawLtaBus {
  OriginCode?: string;
  DestinationCode?: string;
  EstimatedArrival?: string;
  Latitude?: string;
  Longitude?: string;
  VisitNumber?: string;
  Load?: string;
  Feature?: string;
  Type?: string;
  originCode?: string;
  destinationCode?: string;
  estimatedArrival?: string;
  latitude?: string;
  longitude?: string;
  visitNumber?: string;
  load?: string;
  feature?: string;
  type?: string;
}

interface RawLtaService {
  ServiceNo?: string;
  Operator?: string;
  NextBus?: RawLtaBus;
  NextBus2?: RawLtaBus;
  NextBus3?: RawLtaBus;
  serviceNo?: string;
  operator?: string;
  nextBus?: RawLtaBus;
  nextBus2?: RawLtaBus;
  nextBus3?: RawLtaBus;
}

interface RawLtaResponse {
  BusStopCode?: string;
  Services?: RawLtaService[];
  busStopCode?: string;
  services?: RawLtaService[];
}

function normalizeIncomingBus(raw?: RawLtaBus): IncomingBus {
  if (!raw) {
    return {
      originCode: '',
      destinationCode: '',
      estimatedArrival: '',
      latitude: '',
      longitude: '',
      visitNumber: '',
      load: '',
      feature: '',
      type: '',
    };
  }
  const load = (raw.Load ?? raw.load ?? '') as BusLoad;
  const type = (raw.Type ?? raw.type ?? '') as BusType;
  const feature = (raw.Feature ?? raw.feature ?? '') === 'WAB' ? 'WAB' : '';

  return {
    originCode: raw.OriginCode ?? raw.originCode ?? '',
    destinationCode: raw.DestinationCode ?? raw.destinationCode ?? '',
    estimatedArrival: raw.EstimatedArrival ?? raw.estimatedArrival ?? '',
    latitude: raw.Latitude ?? raw.latitude ?? '',
    longitude: raw.Longitude ?? raw.longitude ?? '',
    visitNumber: raw.VisitNumber ?? raw.visitNumber ?? '',
    load: ['SEA', 'SDA', 'LSD'].includes(load) ? load : '',
    feature,
    type: ['SD', 'DD', 'BD'].includes(type) ? type : '',
  };
}

export function normalizeLtaPayload(
  payload: RawLtaResponse,
  fallbackStopCode: string,
): BusArrivalResponse {
  const rawServices = payload.Services ?? payload.services ?? [];
  const validOperators: BusOperator[] = ['SBST', 'SMRT', 'TTS', 'GAS'];

  const services: BusServiceArrival[] = rawServices
    .map((svc) => {
      const serviceNo = String(svc.ServiceNo ?? svc.serviceNo ?? '').trim();
      const opRaw = String(svc.Operator ?? svc.operator ?? '').toUpperCase() as BusOperator;
      const operator = validOperators.includes(opRaw)
        ? opRaw
        : inferOperatorForService(serviceNo);

      return {
        serviceNo,
        operator,
        nextBus: normalizeIncomingBus(svc.NextBus ?? svc.nextBus),
        nextBus2: normalizeIncomingBus(svc.NextBus2 ?? svc.nextBus2),
        nextBus3: normalizeIncomingBus(svc.NextBus3 ?? svc.nextBus3),
      };
    })
    .filter((svc) => svc.serviceNo.length > 0)
    .sort((a, b) => compareServiceNo(a.serviceNo, b.serviceNo));

  return {
    busStopCode: String(payload.BusStopCode ?? payload.busStopCode ?? fallbackStopCode),
    services,
    fetchedAt: Date.now(),
    source: 'api',
  };
}

export interface ApiHealthStatus {
  ok: boolean;
  service: string;
  endpoint: string;
  ltaKeyConfigured: boolean;
  refreshIntervalSeconds: number;
  timestamp: string;
}

export async function checkApiHealth(): Promise<ApiHealthStatus> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('/api/health', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Health check returned HTTP ${response.status}`);
    }
    return (await response.json()) as ApiHealthStatus;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Primary arrival data fetcher.
 * Automatically routes to the serverless LTA DataMall v3 endpoint (/api/busarrival)
 * when `config.mode === 'custom'`, or uses the built-in offline sample provider.
 */
export async function fetchBusArrivals(
  stopCode: string,
  config: ApiConfig,
  serviceNo?: string,
): Promise<BusArrivalResponse> {
  const cleanCode = stopCode.trim();
  const cleanService = serviceNo?.trim() ?? '';

  if (!isValidStopCode(cleanCode)) {
    throw new Error('Enter a valid 5-digit Singapore bus stop code (e.g. 04121).');
  }

  if (config.mode === 'custom' && config.endpointTemplate.trim()) {
    let url = config.endpointTemplate
      .trim()
      .replace(/\{code\}/gi, encodeURIComponent(cleanCode));

    if (cleanService) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}ServiceNo=${encodeURIComponent(cleanService)}`;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8500);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const json = (await response.json().catch(() => null)) as
        | (RawLtaResponse & { error?: string })
        | null;

      if (!response.ok) {
        const message =
          json?.error || `Endpoint returned HTTP ${response.status}`;
        throw new Error(message);
      }

      if (!json) {
        throw new Error('Endpoint returned an empty response.');
      }

      return normalizeLtaPayload(json, cleanCode);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Slight realistic delay so refresh interaction feels crisp without flickering
  await new Promise((resolve) => window.setTimeout(resolve, 160));
  const sample = generateSampleArrivals(cleanCode);
  if (cleanService) {
    return {
      ...sample,
      services: sample.services.filter(
        (s) => s.serviceNo.toLowerCase() === cleanService.toLowerCase(),
      ),
    };
  }
  return sample;
}

export interface FormattedArrival {
  label: string;
  minutes: number | null;
  isArriving: boolean;
}

export function formatArrivalMinutes(
  estimatedArrival: string,
  nowMs: number = Date.now(),
): FormattedArrival {
  if (!estimatedArrival) {
    return { label: '—', minutes: null, isArriving: false };
  }
  const targetMs = Date.parse(estimatedArrival);
  if (Number.isNaN(targetMs)) {
    return { label: '—', minutes: null, isArriving: false };
  }
  const diffMin = Math.floor((targetMs - nowMs) / 60_000);
  if (diffMin <= 0) {
    return { label: 'Arr', minutes: 0, isArriving: true };
  }
  return { label: `${diffMin} min`, minutes: diffMin, isArriving: diffMin <= 1 };
}

export function getLoadMeta(load: BusLoad): {
  label: string;
  textClass: string;
  barClass: string;
  bars: number;
} {
  switch (load) {
    case 'SEA':
      return {
        label: 'Seats',
        textClass: 'text-[#007A43]',
        barClass: 'bg-[#008348]',
        bars: 1,
      };
    case 'SDA':
      return {
        label: 'Standing',
        textClass: 'text-amber-700',
        barClass: 'bg-amber-500',
        bars: 2,
      };
    case 'LSD':
      return {
        label: 'Limited',
        textClass: 'text-red-700',
        barClass: 'bg-red-600',
        bars: 3,
      };
    default:
      return {
        label: 'No info',
        textClass: 'text-slate-400',
        barClass: 'bg-slate-300',
        bars: 0,
      };
  }
}

export function getBusTypeLabel(type: BusType): string {
  switch (type) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy';
    case 'SD':
      return 'Single Deck';
    default:
      return '';
  }
}

export function getBusTypeShort(type: BusType): string {
  return type || '—';
}
