import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, Star, X } from 'lucide-react';
import { BusStop } from '../types/bus';
import { isValidStopCode, lookupBusStop, searchBusStops } from '../services/busApi';

interface QuickCodeInputProps {
  activeCode: string;
  onSelectStop: (code: string) => void;
  isFavorite: (code: string) => boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function QuickCodeInput({
  activeCode,
  onSelectStop,
  isFavorite,
  inputRef,
}: QuickCodeInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const isExact5Digit = isValidStopCode(trimmed);

  const suggestions = useMemo<BusStop[]>(() => {
    if (!trimmed) return [];
    const matches = searchBusStops(trimmed, 6);
    if (isExact5Digit && !matches.some((m) => m.code === trimmed)) {
      return [lookupBusStop(trimmed), ...matches.slice(0, 5)];
    }
    return matches;
  }, [trimmed, isExact5Digit]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [trimmed]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function submitStopCode(code: string) {
    onSelectStop(code);
    setQuery('');
    setIsOpen(false);
    setErrorMessage('');
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isExact5Digit) {
      submitStopCode(trimmed);
      return;
    }
    if (suggestions.length > 0) {
      const selected = suggestions[highlightedIdx] ?? suggestions[0];
      submitStopCode(selected.code);
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      setErrorMessage('Singapore bus stop codes are 5 digits (e.g. 09048).');
    } else {
      setErrorMessage('No matching stop found. Try a 5-digit code or road name.');
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    setErrorMessage('');
    setIsOpen(true);

    // Instant quick access: auto-open if the user enters a known 5-digit code cleanly
    const clean = value.trim();
    if (isValidStopCode(clean)) {
      setHighlightedIdx(0);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIdx((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleFormSubmit} className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bus-stop-code-input"
            className="text-sm font-semibold text-slate-900"
          >
            Quick Bus Stop Lookup
          </label>
          <span className="text-xs text-slate-500">
            5-digit code or road
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id="bus-stop-code-input"
              type="text"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 09048 or Orchard"
              aria-label="Enter 5-digit bus stop code or stop name"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 font-mono text-base font-medium text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setErrorMessage('');
                  inputRef?.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#008348] px-4 text-sm font-semibold text-white hover:bg-[#006D3C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008348] focus-visible:ring-offset-2 transition-all whitespace-nowrap"
          >
            <span>Go</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {errorMessage ? (
          <p className="text-xs font-medium text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Viewing <span className="font-mono font-semibold text-slate-700 tabular-nums">{activeCode}</span>
            </span>
            <span className="hidden sm:inline">Press / to focus</span>
          </div>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Matching Singapore bus stops"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {suggestions.map((stop, idx) => {
              const highlighted = idx === highlightedIdx;
              const starred = isFavorite(stop.code);
              return (
                <li key={stop.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={highlighted}
                    onMouseEnter={() => setHighlightedIdx(idx)}
                    onClick={() => submitStopCode(stop.code)}
                    className={`flex min-h-[52px] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${
                      highlighted ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#007A43] tabular-nums">
                          {stop.code}
                        </span>
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {stop.description}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {stop.roadName}
                        {!stop.isCustom && (
                          <>
                            {' · '}
                            {stop.services.length} services
                          </>
                        )}
                      </p>
                    </div>
                    {starred && (
                      <Star
                        className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500"
                        aria-label="Saved in favorites"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
