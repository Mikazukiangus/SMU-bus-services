import React, { useCallback, useEffect, useState } from 'react';
import { Play, RefreshCw, RotateCcw } from 'lucide-react';
import { ApiConfig } from '../types/bus';
import {
  ApiHealthStatus,
  checkApiHealth,
  fetchBusArrivals,
} from '../services/busApi';

interface ApiSetupPanelProps {
  config: ApiConfig;
  onUpdateConfig: (partial: Partial<ApiConfig>) => void;
  onRefreshCurrentStop: () => void;
}

const DEFAULT_ENDPOINT = '/api/busarrival?BusStopCode={code}';

const REFRESH_OPTIONS = [
  { label: '20s (LTA)', value: 20 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'Manual', value: 0 },
];

export function ApiSetupPanel({
  config,
  onUpdateConfig,
  onRefreshCurrentStop,
}: ApiSetupPanelProps) {
  const [endpointDraft, setEndpointDraft] = useState(
    config.endpointTemplate || DEFAULT_ENDPOINT,
  );
  const [testCode, setTestCode] = useState('04121');
  const [testService, setTestService] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const status = await checkApiHealth();
      setHealth(status);
    } catch (err) {
      setHealth(null);
      setHealthError(
        err instanceof Error ? err.message : 'Unable to reach /api/health.',
      );
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  function handleSaveEndpoint(event: React.FormEvent) {
    event.preventDefault();
    const cleaned = endpointDraft.trim() || DEFAULT_ENDPOINT;
    setEndpointDraft(cleaned);
    onUpdateConfig({
      mode: 'custom',
      endpointTemplate: cleaned,
    });
    setTestResult({
      ok: true,
      message: 'Live serverless endpoint enabled. Arrival board will now fetch from this route.',
    });
    onRefreshCurrentStop();
  }

  async function handleTestEndpoint() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await fetchBusArrivals(
        testCode,
        {
          ...config,
          mode: 'custom',
          endpointTemplate: endpointDraft.trim() || DEFAULT_ENDPOINT,
        },
        testService.trim() || undefined,
      );
      const filterSuffix = testService.trim()
        ? ` (Service ${testService.trim()})`
        : '';
      setTestResult({
        ok: true,
        message: `Connected cleanly — received ${result.services.length} bus service(s) for stop ${result.busStopCode}${filterSuffix}.`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Connection failed. Verify LTA_ACCOUNT_KEY and endpoint configuration.',
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          LTA DataMall v3 API Connection
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Root-level serverless routes at <code className="font-mono text-slate-700">/api/health</code> and{' '}
          <code className="font-mono text-slate-700">/api/busarrival</code> proxy LTA DataMall v3 using your server-side{' '}
          <code className="font-mono text-slate-700">LTA_ACCOUNT_KEY</code> environment variable.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {/* Serverless Health Check */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Serverless Endpoint Check
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Verifies <code className="font-mono text-xs text-slate-700">GET /api/health</code> and checks whether{' '}
                <code className="font-mono text-xs text-slate-700">LTA_ACCOUNT_KEY</code> is set on the server.
              </p>
            </div>
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={healthLoading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin text-[#008348]' : 'text-slate-600'}`}
                aria-hidden="true"
              />
              Check Health
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
            {healthLoading && !health ? (
              <p className="text-slate-500">Checking /api/health…</p>
            ) : healthError ? (
              <p className="font-medium text-red-700">{healthError}</p>
            ) : health ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <dt className="text-slate-500">API Route</dt>
                  <dd className="mt-0.5 font-semibold text-[#007A43]">
                    Reachable ({health.endpoint})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">LTA_ACCOUNT_KEY</dt>
                  <dd
                    className={`mt-0.5 font-semibold ${
                      health.ltaKeyConfigured ? 'text-[#007A43]' : 'text-amber-700'
                    }`}
                  >
                    {health.ltaKeyConfigured
                      ? 'Configured on server'
                      : 'Not set yet (add to server env)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Upstream Cadence</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-800 tabular-nums">
                    Every {health.refreshIntervalSeconds}s
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>

        {/* Data Source Mode */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active Data Source
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Use offline sample timings until your key is added, then switch to Live LTA v3 API.
              </p>
            </div>

            <div
              role="group"
              aria-label="Select arrival data source"
              className="inline-flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto"
            >
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ mode: 'sample' });
                  setTestResult(null);
                  onRefreshCurrentStop();
                }}
                className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  config.mode === 'sample'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sample Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({
                    mode: 'custom',
                    endpointTemplate: endpointDraft.trim() || DEFAULT_ENDPOINT,
                  });
                  onRefreshCurrentStop();
                }}
                className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  config.mode === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live LTA v3 API
              </button>
            </div>
          </div>

          {/* Auto-refresh interval */}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Auto-Refresh Interval
              </h3>
              <p className="text-xs text-slate-500">
                LTA DataMall v3 updates arrival timings every 20 seconds.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto">
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateConfig({ autoRefreshSeconds: opt.value })}
                  className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                    config.autoRefreshSeconds === opt.value
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Serverless Endpoint & Live Test */}
        <form onSubmit={handleSaveEndpoint} className="space-y-4 p-5 sm:p-6">
          <div>
            <label
              htmlFor="endpoint-template-input"
              className="block text-sm font-semibold text-slate-900"
            >
              Serverless Bus Arrival Endpoint
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Defaults to <code className="font-mono text-slate-700">{DEFAULT_ENDPOINT}</code>. Supports optional{' '}
              <code className="font-mono text-slate-700">&amp;ServiceNo=7</code> filtering.
            </p>
            <input
              id="endpoint-template-input"
              type="text"
              value={endpointDraft}
              onChange={(e) => setEndpointDraft(e.target.value)}
              placeholder={DEFAULT_ENDPOINT}
              className="mt-2.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#008348] px-4 text-sm font-semibold text-white hover:bg-[#006D3C] transition-colors whitespace-nowrap"
            >
              Use Live Endpoint
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={testCode}
                onChange={(e) =>
                  setTestCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                placeholder="04121"
                aria-label="Test 5-digit BusStopCode"
                className="h-11 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center font-mono text-sm font-semibold text-slate-900 tabular-nums focus:border-[#008348] focus:outline-none"
              />
              <input
                type="text"
                value={testService}
                onChange={(e) =>
                  setTestService(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))
                }
                placeholder="Svc (opt)"
                aria-label="Optional ServiceNo filter"
                className="h-11 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center font-mono text-sm text-slate-900 focus:border-[#008348] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestEndpoint}
                disabled={testing || !endpointDraft.trim()}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{testing ? 'Testing…' : 'Test BusArrival'}</span>
              </button>
            </div>

            {config.mode === 'custom' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({ mode: 'sample' });
                  setTestResult(null);
                  onRefreshCurrentStop();
                }}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Revert to Sample
              </button>
            )}
          </div>

          {testResult && (
            <p
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                testResult.ok
                  ? 'border-[#008348]/25 bg-[#008348]/5 text-[#006637]'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {testResult.message}
            </p>
          )}
        </form>

        {/* Endpoint Reference */}
        <div className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Deployed Serverless Routes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Set <code className="font-mono text-slate-700">LTA_ACCOUNT_KEY</code> in your hosting environment secrets or local <code className="font-mono text-slate-700">.env</code> file. Keys are read strictly on the server and never sent to the browser.
          </p>
          <div className="mt-3 space-y-2 font-mono text-xs text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span>GET /api/health</span>
              <span className="font-sans text-slate-500">
                Service health &amp; LTA_ACCOUNT_KEY check
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span>GET /api/busarrival?BusStopCode=04121</span>
              <span className="font-sans text-slate-500">
                All services at a stop (LTA DataMall v3)
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span>GET /api/busarrival?BusStopCode=04121&amp;ServiceNo=7</span>
              <span className="font-sans text-slate-500">
                Single bus service at a stop
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
