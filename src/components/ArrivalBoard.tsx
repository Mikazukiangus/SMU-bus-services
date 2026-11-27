import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  AlertCircle,
  Check,
  Edit3,
  Pin,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  BusArrivalResponse,
  BusServiceArrival,
  BusStop,
  FavoriteStop,
  IncomingBus,
} from '../types/bus';
import { OPERATOR_LABELS } from '../data/singaporeStops';
import {
  compareServiceNo,
  formatArrivalMinutes,
  getBusTypeLabel,
  getBusTypeShort,
  getLoadMeta,
} from '../services/busApi';

type SortOption = 'pinned' | 'service' | 'soonest';

interface ArrivalBoardProps {
  stop: BusStop;
  arrivalData: BusArrivalResponse | null;
  loading: boolean;
  error: string | null;
  nowMs: number;
  favorite?: FavoriteStop;
  onToggleFavorite: (stop: BusStop) => void;
  onUpdateLabel: (code: string, label: string) => void;
  onTogglePinService: (stop: BusStop, serviceNo: string) => void;
  onRefresh: () => void;
  onOpenApiSetup: () => void;
}

function IncomingBusCell({
  bus,
  nowMs,
  primary = false,
}: {
  bus: IncomingBus;
  nowMs: number;
  primary?: boolean;
}) {
  const formatted = formatArrivalMinutes(bus.estimatedArrival, nowMs);
  const loadMeta = getLoadMeta(bus.load);
  const typeShort = getBusTypeShort(bus.type);
  const typeFull = getBusTypeLabel(bus.type);

  if (formatted.minutes === null) {
    return (
      <div className="flex flex-col justify-center">
        <span className="font-mono text-sm text-slate-400 tabular-nums">—</span>
        <span className="mt-0.5 text-xs text-slate-400">No est.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono tabular-nums tracking-tight ${
            primary
              ? formatted.isArriving
                ? 'text-lg font-bold text-[#007A43]'
                : 'text-lg font-bold text-slate-900'
              : formatted.isArriving
                ? 'text-sm font-semibold text-[#007A43]'
                : 'text-sm font-semibold text-slate-700'
          }`}
        >
          {formatted.label}
        </span>
        {bus.feature === 'WAB' && (
          <span title="Wheelchair accessible bus" className="inline-flex items-center">
            <Accessibility
              className="h-3.5 w-3.5 shrink-0 text-slate-500"
              aria-label="Wheelchair accessible"
            />
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-xs">
        <span
          className="inline-flex items-center gap-0.5"
          aria-hidden="true"
          title={`Passenger load: ${loadMeta.label}`}
        >
          {[1, 2, 3].map((level) => (
            <span
              key={level}
              className={`h-1.5 w-2 rounded-[1px] ${
                level <= loadMeta.bars ? loadMeta.barClass : 'bg-slate-200'
              }`}
            />
          ))}
        </span>
        <span className={`font-medium ${loadMeta.textClass}`}>
          {loadMeta.label}
        </span>
        {typeShort !== '—' && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-[11px] text-slate-500" title={typeFull}>
              {typeShort}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function ArrivalBoard({
  stop,
  arrivalData,
  loading,
  error,
  nowMs,
  favorite,
  onToggleFavorite,
  onUpdateLabel,
  onTogglePinService,
  onRefresh,
  onOpenApiSetup,
}: ArrivalBoardProps) {
  const [serviceQuery, setServiceQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('pinned');
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');

  const isStarred = Boolean(favorite);
  const pinnedServices = favorite?.pinnedServices ?? [];

  const filteredServices = useMemo<BusServiceArrival[]>(() => {
    const raw = arrivalData?.services ?? [];
    const q = serviceQuery.trim().toLowerCase();
    const filtered = q
      ? raw.filter((svc) => svc.serviceNo.toLowerCase().includes(q))
      : raw;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'pinned') {
        const aPinned = pinnedServices.includes(a.serviceNo) ? 0 : 1;
        const bPinned = pinnedServices.includes(b.serviceNo) ? 0 : 1;
        if (aPinned !== bPinned) return aPinned - bPinned;
        return compareServiceNo(a.serviceNo, b.serviceNo);
      }

      if (sortBy === 'soonest') {
        const aMin = formatArrivalMinutes(a.nextBus.estimatedArrival, nowMs).minutes ?? 999;
        const bMin = formatArrivalMinutes(b.nextBus.estimatedArrival, nowMs).minutes ?? 999;
        if (aMin !== bMin) return aMin - bMin;
        return compareServiceNo(a.serviceNo, b.serviceNo);
      }

      return compareServiceNo(a.serviceNo, b.serviceNo);
    });
  }, [arrivalData, serviceQuery, sortBy, pinnedServices, nowMs]);

  function startEditingLabel() {
    setLabelDraft(favorite?.customLabel ?? '');
    setEditingLabel(true);
  }

  function saveLabel(event: React.FormEvent) {
    event.preventDefault();
    onUpdateLabel(stop.code, labelDraft);
    setEditingLabel(false);
  }

  const lastUpdatedText = arrivalData
    ? new Date(arrivalData.fetchedAt).toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '—';

  return (
    <section
      aria-label={`Bus arrivals for ${stop.description}`}
      className="rounded-2xl border border-slate-200 bg-white"
    >
      {/* Stop Header */}
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
              <span className="font-mono text-sm font-bold tracking-wide text-[#007A43] tabular-nums">
                {stop.code}
              </span>
              <span aria-hidden="true">·</span>
              <span>{stop.roadName}</span>
              <span aria-hidden="true">·</span>
              <span>{stop.region}</span>
            </div>

            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance]">
              {stop.description}
            </h1>

            {/* Commuter custom label inline row */}
            {isStarred && (
              <div className="mt-2">
                {editingLabel ? (
                  <form onSubmit={saveLabel} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      placeholder="Add nickname (e.g. Home, Office)"
                      maxLength={32}
                      autoFocus
                      className="h-9 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#008348] px-3 text-xs font-semibold text-white hover:bg-[#006D3C] transition-colors whitespace-nowrap"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLabel(false)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>
                      Saved label:{' '}
                      <strong className="font-semibold text-slate-900">
                        {favorite?.customLabel || 'None'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={startEditingLabel}
                      className="inline-flex items-center gap-1 font-medium text-[#007A43] hover:underline whitespace-nowrap"
                    >
                      <Edit3 className="h-3 w-3" aria-hidden="true" />
                      {favorite?.customLabel ? 'Edit' : 'Add nickname'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary Stop Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(stop)}
              aria-pressed={isStarred}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isStarred
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Star
                className={`h-4 w-4 ${
                  isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{isStarred ? 'Favorited' : 'Save Favorite'}</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh bus arrival timings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin text-[#008348]' : 'text-slate-600'}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Metadata line (unboxed, clean separators) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Updated <span className="font-mono text-slate-700 tabular-nums">{lastUpdatedText}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {arrivalData?.source === 'api' ? 'Live API Endpoint' : 'Offline Sample Schedule'}
            </span>
            {arrivalData?.source !== 'api' && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenApiSetup}
                  className="font-medium text-[#007A43] hover:underline"
                >
                  Connect LTA API
                </button>
              </>
            )}
          </div>
          <div className="font-mono text-xs text-slate-500 tabular-nums">
            {arrivalData ? `${arrivalData.services.length} services` : ''}
          </div>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="relative w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="Filter bus no. (e.g. 175)"
            aria-label="Filter bus services at this stop"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
          />
          {serviceQuery && (
            <button
              type="button"
              onClick={() => setServiceQuery('')}
              aria-label="Clear service filter"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Sort bus services"
          className="inline-flex items-center gap-1 self-start rounded-lg bg-slate-200/70 p-1 sm:self-auto"
        >
          {(
            [
              { id: 'pinned', label: 'Pinned First' },
              { id: 'service', label: 'Bus No.' },
              { id: 'soonest', label: 'Soonest' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSortBy(tab.id)}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                sortBy === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50/70 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-red-900">
                  Could not load arrivals for stop {stop.code}
                </h2>
                <p className="mt-1 text-sm text-red-800">{error}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="h-10 rounded-lg bg-red-700 px-4 text-xs font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={onOpenApiSetup}
                    className="h-10 rounded-lg border border-red-300 bg-white px-4 text-xs font-semibold text-red-900 hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    Check API Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {!error && loading && !arrivalData && (
        <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading arrivals">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid grid-cols-12 items-center gap-4 px-5 py-4 sm:px-6 animate-pulse"
            >
              <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-5 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-100" />
                </div>
              </div>
              <div className="col-span-8 sm:col-span-9 grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <div className="h-5 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Populated Arrival Table */}
      {!error && arrivalData && (
        <>
          {filteredServices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                {serviceQuery
                  ? `No service matching "${serviceQuery}" at stop ${stop.code}`
                  : `No active bus arrivals reported for stop ${stop.code}`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {serviceQuery
                  ? 'Clear the filter to see all bus services calling at this stop.'
                  : 'Refresh to check again or verify your bus stop code.'}
              </p>
              {serviceQuery && (
                <button
                  type="button"
                  onClick={() => setServiceQuery('')}
                  className="mt-4 h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Show All Services
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Table Column Headers (Desktop / Tablet) */}
              <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 border-b border-slate-200 bg-slate-50/40 px-6 py-2.5 text-xs font-semibold text-slate-500">
                <div className="col-span-4">Service</div>
                <div className="col-span-3">Next Bus</div>
                <div className="col-span-3">2nd Bus</div>
                <div className="col-span-2">3rd Bus</div>
              </div>

              <ul className="divide-y divide-slate-100">
                {filteredServices.map((svc) => {
                  const isPinned = pinnedServices.includes(svc.serviceNo);
                  return (
                    <li
                      key={svc.serviceNo}
                      className={`px-5 py-4 sm:px-6 transition-colors hover:bg-slate-50/70 ${
                        isPinned ? 'bg-[#008348]/[0.03]' : 'bg-white'
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 sm:items-center sm:gap-4">
                        {/* Service No + Pin + Operator */}
                        <div className="flex items-center justify-between sm:col-span-4 sm:justify-start sm:gap-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => onTogglePinService(stop, svc.serviceNo)}
                              aria-pressed={isPinned}
                              aria-label={
                                isPinned
                                  ? `Unpin bus ${svc.serviceNo}`
                                  : `Pin bus ${svc.serviceNo} to top`
                              }
                              title={
                                isPinned
                                  ? 'Unpin bus service'
                                  : 'Pin service to top (auto-saves stop to Favorites)'
                              }
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                isPinned
                                  ? 'border-[#008348]/30 bg-[#008348]/10 text-[#007A43]'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
                              }`}
                            >
                              <Pin
                                className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`}
                              />
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                                  {svc.serviceNo}
                                </span>
                                {isPinned && (
                                  <span className="text-xs font-semibold text-[#007A43]">
                                    Pinned
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {OPERATOR_LABELS[svc.operator]}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Three Arrival Columns */}
                        <div className="grid grid-cols-3 gap-3 sm:col-span-8 sm:grid-cols-8 sm:gap-4">
                          <div className="sm:col-span-3">
                            <span className="mb-0.5 block text-[11px] font-medium text-slate-400 sm:hidden">
                              Next
                            </span>
                            <IncomingBusCell bus={svc.nextBus} nowMs={nowMs} primary />
                          </div>
                          <div className="sm:col-span-3">
                            <span className="mb-0.5 block text-[11px] font-medium text-slate-400 sm:hidden">
                              2nd
                            </span>
                            <IncomingBusCell bus={svc.nextBus2} nowMs={nowMs} />
                          </div>
                          <div className="sm:col-span-2">
                            <span className="mb-0.5 block text-[11px] font-medium text-slate-400 sm:hidden">
                              3rd
                            </span>
                            <IncomingBusCell bus={svc.nextBus3} nowMs={nowMs} />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Legend Footer */}
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="font-medium text-slate-700">DD</strong> Double Deck
          </span>
          <span>
            <strong className="font-medium text-slate-700">SD</strong> Single Deck
          </span>
          <span>
            <strong className="font-medium text-slate-700">BD</strong> Bendy
          </span>
          <span className="inline-flex items-center gap-1">
            <Accessibility className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Wheelchair Accessible
          </span>
          <span className="ml-auto hidden sm:inline">
            Pin a service to keep it at the top of this stop
          </span>
        </div>
      </div>
    </section>
  );
}
