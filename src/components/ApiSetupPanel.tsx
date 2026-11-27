import React, { useState } from 'react';
import { Check, Copy, Play, RotateCcw } from 'lucide-react';
import { ApiConfig } from '../types/bus';
import { fetchBusArrivals } from '../services/busApi';

interface ApiSetupPanelProps {
  config: ApiConfig;
  onUpdateConfig: (partial: Partial<ApiConfig>) => void;
  onRefreshCurrentStop: () => void;
}

const EXPRESS_PROXY_SNIPPET = `// Example server-side proxy route for LTA DataMall BusArrival v3/v2
// Store LTA_ACCOUNT_KEY in your server environment (.env) — never in client code.
app.get('/api/bus-arrival', async (req, res) => {
  const stopCode = String(req.query.BusStopCode || '').trim();
  if (!/^\\d{5}$/.test(stopCode)) {
    return res.status(400).json({ error: 'Invalid 5-digit BusStopCode' });
  }

  const upstream = await fetch(
    \`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${stopCode}\`,
    {
      headers: {
        AccountKey: process.env.LTA_ACCOUNT_KEY,
        accept: 'application/json',
      },
    }
  );

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});`;

const REFRESH_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'Manual', value: 0 },
];

export function ApiSetupPanel({
  config,
  onUpdateConfig,
  onRefreshCurrentStop,
}: ApiSetupPanelProps) {
  const [endpointDraft, setEndpointDraft] = useState(config.endpointTemplate);
  const [testCode, setTestCode] = useState('09048');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSaveEndpoint(event: React.FormEvent) {
    event.preventDefault();
    onUpdateConfig({
      mode: 'custom',
      endpointTemplate: endpointDraft.trim() || '/api/bus-arrival?BusStopCode={code}',
    });
    setTestResult({
      ok: true,
      message: 'Custom proxy endpoint saved. Arrival board will now fetch from this URL.',
    });
    onRefreshCurrentStop();
  }

  async function handleTestEndpoint() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await fetchBusArrivals(testCode, {
        ...config,
        mode: 'custom',
        endpointTemplate: endpointDraft.trim(),
      });
      setTestResult({
        ok: true,
        message: `Connected cleanly — received ${result.services.length} bus services for stop ${result.busStopCode}.`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error
            ? `Connection failed: ${err.message}`
            : 'Connection failed. Verify the endpoint URL and CORS headers.',
      });
    } finally {
      setTesting(false);
    }
  }

  function handleCopySnippet() {
    navigator.clipboard?.writeText(EXPRESS_PROXY_SNIPPET).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          LTA DataMall API Connection
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          This app is pre-wired for the Singapore LTA DataMall BusArrival JSON contract. Keep using the built-in sample schedule now, or point it to your backend proxy when ready.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {/* Data Source Mode */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active Data Source
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Switch seamlessly between offline sample schedules and your live backend proxy.
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
                    endpointTemplate: endpointDraft.trim() || config.endpointTemplate,
                  });
                  onRefreshCurrentStop();
                }}
                className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  config.mode === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Proxy URL
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
                Automatically poll updated arrival timings while viewing a stop.
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

        {/* Custom Proxy Endpoint Form */}
        <form onSubmit={handleSaveEndpoint} className="space-y-4 p-5 sm:p-6">
          <div>
            <label
              htmlFor="endpoint-template-input"
              className="block text-sm font-semibold text-slate-900"
            >
              Backend Proxy Endpoint Template
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Include <code className="font-mono text-slate-700">{'{code}'}</code> where the 5-digit bus stop code should be substituted. Keep your LTA DataMall AccountKey strictly on your backend server.
            </p>
            <input
              id="endpoint-template-input"
              type="text"
              value={endpointDraft}
              onChange={(e) => setEndpointDraft(e.target.value)}
              placeholder="/api/bus-arrival?BusStopCode={code}"
              className="mt-2.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#008348] px-4 text-sm font-semibold text-white hover:bg-[#006D3C] transition-colors whitespace-nowrap"
            >
              Save &amp; Use Custom Endpoint
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                aria-label="Test 5-digit stop code"
                className="h-11 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center font-mono text-sm font-semibold text-slate-900 tabular-nums focus:border-[#008348] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestEndpoint}
                disabled={testing || !endpointDraft.trim()}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{testing ? 'Testing…' : 'Test Connection'}</span>
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

        {/* Reference Backend Proxy Snippet */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Reference Backend Proxy Route (LTA DataMall)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Drop this route into your Node/Express server or serverless function when you connect your LTA DataMall key.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#008348]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{EXPRESS_PROXY_SNIPPET}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
