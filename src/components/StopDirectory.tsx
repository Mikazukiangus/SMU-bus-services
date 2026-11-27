import React, { useMemo, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { BusStop, SingaporeRegion } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeStops';

const REGIONS: ('All' | SingaporeRegion)[] = [
  'All',
  'Central & Orchard',
  'Marina & CBD',
  'East',
  'West',
  'North',
  'North-East',
];

interface StopDirectoryProps {
  activeCode: string;
  isFavorite: (code: string) => boolean;
  onSelectStop: (code: string) => void;
  onToggleFavorite: (stop: BusStop) => void;
}

export function StopDirectory({
  activeCode,
  isFavorite,
  onSelectStop,
  onToggleFavorite,
}: StopDirectoryProps) {
  const [region, setRegion] = useState<'All' | SingaporeRegion>('All');
  const [query, setQuery] = useState('');

  const filteredStops = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SINGAPORE_BUS_STOPS.filter((stop) => {
      if (region !== 'All' && stop.region !== region) return false;
      if (!q) return true;
      return (
        stop.code.includes(q) ||
        stop.description.toLowerCase().includes(q) ||
        stop.roadName.toLowerCase().includes(q) ||
        stop.services.some((svc) => svc.toLowerCase() === q)
      );
    });
  }, [region, query]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Singapore Bus Stop Directory
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Browse major MRT interchanges and roadside stops by region, or search by 5-digit code, road, or bus number.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, road, or bus"
              aria-label="Filter Singapore bus stop directory"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear directory filter"
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div
          role="group"
          aria-label="Filter stops by Singapore region"
          className="mt-4 flex flex-wrap items-center gap-1.5"
        >
          {REGIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                region === item
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filteredStops.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No stops match your search
          </p>
          <p className="mt-1 text-sm text-slate-500">
            You can still enter any unlisted 5-digit Singapore bus stop code in the Quick Lookup bar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredStops.map((stop) => {
            const starred = isFavorite(stop.code);
            const active = stop.code === activeCode;
            return (
              <li
                key={stop.code}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition-colors ${
                  active ? 'bg-[#008348]/[0.04]' : 'hover:bg-slate-50/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectStop(stop.code)}
                  className="group min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#007A43] tabular-nums">
                      {stop.code}
                    </span>
                    <span className="text-base font-semibold text-slate-900 group-hover:text-[#007A43] transition-colors">
                      {stop.description}
                    </span>
                    <span className="text-xs text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs text-slate-500">{stop.roadName}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="text-slate-400">Services: </span>
                    <span className="font-mono text-slate-700">
                      {stop.services.join(', ')}
                    </span>
                  </p>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(stop)}
                    aria-pressed={starred}
                    aria-label={
                      starred
                        ? `Remove ${stop.description} from favorites`
                        : `Add ${stop.description} to favorites`
                    }
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                      starred
                        ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${starred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectStop(stop.code)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    View Arrivals
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
