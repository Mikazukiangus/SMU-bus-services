import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bus, Compass, Plug, Star } from 'lucide-react';
import { BusArrivalResponse } from './types/bus';
import { fetchBusArrivals, lookupBusStop } from './services/busApi';
import { useBusStorage } from './hooks/useBusStorage';
import { QuickCodeInput } from './components/QuickCodeInput';
import { ArrivalBoard } from './components/ArrivalBoard';
import { FavoritesPanel } from './components/FavoritesPanel';
import { StopDirectory } from './components/StopDirectory';
import { ApiSetupPanel } from './components/ApiSetupPanel';

type ActiveTab = 'arrivals' | 'favorites' | 'directory' | 'api';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'arrivals', label: 'Arrivals', icon: Bus },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'directory', label: 'Directory', icon: Compass },
  { id: 'api', label: 'API Setup', icon: Plug },
];

export default function App() {
  const {
    favorites,
    recents,
    apiConfig,
    lastStopCode,
    isFavorite,
    getFavorite,
    toggleFavorite,
    updateFavoriteLabel,
    removeFavorite,
    moveFavorite,
    togglePinnedService,
    recordRecentStop,
    clearRecents,
    updateApiConfig,
  } = useBusStorage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('arrivals');
  const [selectedCode, setSelectedCode] = useState<string>(lastStopCode || '09048');
  const [arrivalData, setArrivalData] = useState<BusArrivalResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  const quickInputRef = useRef<HTMLInputElement | null>(null);

  const activeStop = useMemo(() => lookupBusStop(selectedCode), [selectedCode]);
  const activeFavorite = getFavorite(activeStop.code);

  // Record stop in recent history whenever selected stop changes
  useEffect(() => {
    recordRecentStop(activeStop);
  }, [activeStop, recordRecentStop]);

  // Fetch arrivals when stop, API config, or manual refresh changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBusArrivals(selectedCode, apiConfig)
      .then((data) => {
        if (!cancelled) {
          setArrivalData(data);
          setNowMs(Date.now());
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setArrivalData(null);
          setError(
            err instanceof Error ? err.message : 'Unable to fetch bus arrivals.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCode, apiConfig, refreshNonce]);

  // Keep relative minute countdowns accurate every 15 seconds
  useEffect(() => {
    const ticker = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);
    return () => window.clearInterval(ticker);
  }, []);

  // Auto-refresh interval when configured
  useEffect(() => {
    if (!apiConfig.autoRefreshSeconds || apiConfig.autoRefreshSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRefreshNonce((n) => n + 1);
    }, apiConfig.autoRefreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [apiConfig.autoRefreshSeconds]);

  // Press "/" anywhere to jump straight to 5-digit bus stop code input
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      quickInputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectStop = useCallback((code: string) => {
    setSelectedCode(code);
    setActiveTab('arrivals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const handleQuickCodeCta = useCallback(() => {
    setActiveTab('arrivals');
    window.setTimeout(() => {
      quickInputRef.current?.focus();
      quickInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md md:sticky md:top-0 md:z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('arrivals')}
            className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-[#007A43] transition-colors"
          >
            SG BusStop
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-5 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-[#008348]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleQuickCodeCta}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              Quick Stop Code
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Left Quick-Access Column (Always accessible on Desktop; shown on Arrivals on Mobile) */}
          <aside
            aria-label="Quick stop lookup and saved favorites"
            className={`w-full space-y-6 lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0 ${
              activeTab === 'arrivals' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <QuickCodeInput
                activeCode={activeStop.code}
                onSelectStop={handleSelectStop}
                isFavorite={isFavorite}
                inputRef={quickInputRef}
              />
            </div>

            {/* Quick-switch favorites & recents sidebar */}
            <div className="hidden lg:block">
              <FavoritesPanel
                variant="sidebar"
                favorites={favorites}
                recents={recents}
                activeCode={activeStop.code}
                onSelectStop={handleSelectStop}
                onRemoveFavorite={removeFavorite}
                onUpdateLabel={updateFavoriteLabel}
                onMoveFavorite={moveFavorite}
                onClearRecents={clearRecents}
              />
            </div>

            {/* Mobile horizontal quick-jump favorites strip on Arrivals tab */}
            {favorites.length > 0 && (
              <div className="lg:hidden">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Favorite Stops
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('favorites')}
                    className="text-xs font-semibold text-[#007A43]"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {favorites.map((fav) => {
                    const isActive = fav.code === activeStop.code;
                    return (
                      <button
                        key={fav.code}
                        type="button"
                        onClick={() => handleSelectStop(fav.code)}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-left transition-colors ${
                          isActive
                            ? 'border-[#008348] bg-[#008348] text-white'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            isActive ? 'text-white/90' : 'text-[#007A43]'
                          }`}
                        >
                          {fav.code}
                        </span>
                        <span className="max-w-[140px] truncate text-xs font-semibold">
                          {fav.customLabel || fav.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Main Active Viewport */}
          <div className="min-w-0 flex-1">
            {activeTab === 'arrivals' && (
              <ArrivalBoard
                stop={activeStop}
                arrivalData={arrivalData}
                loading={loading}
                error={error}
                nowMs={nowMs}
                favorite={activeFavorite}
                onToggleFavorite={(stop) => toggleFavorite(stop)}
                onUpdateLabel={updateFavoriteLabel}
                onTogglePinService={togglePinnedService}
                onRefresh={handleRefresh}
                onOpenApiSetup={() => setActiveTab('api')}
              />
            )}

            {activeTab === 'favorites' && (
              <FavoritesPanel
                variant="full"
                favorites={favorites}
                activeCode={activeStop.code}
                onSelectStop={handleSelectStop}
                onRemoveFavorite={removeFavorite}
                onUpdateLabel={updateFavoriteLabel}
                onMoveFavorite={moveFavorite}
                onBrowseDirectory={() => setActiveTab('directory')}
              />
            )}

            {activeTab === 'directory' && (
              <StopDirectory
                activeCode={activeStop.code}
                isFavorite={isFavorite}
                onSelectStop={handleSelectStop}
                onToggleFavorite={(stop) => toggleFavorite(stop)}
              />
            )}

            {activeTab === 'api' && (
              <ApiSetupPanel
                config={apiConfig}
                onUpdateConfig={updateApiConfig}
                onRefreshCurrentStop={handleRefresh}
              />
            )}
          </div>
        </div>
      </main>

      {/* Quiet Desktop Footer */}
      <footer className="hidden border-t border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-xs text-slate-500 lg:px-8">
          <span>SG BusStop · Built for Singapore 5-digit LTA bus stop codes</span>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            LTA DataMall API Setup
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Fixed, compact <= 64px to respect 15% sticky cap) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="grid h-[60px] grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#007A43]' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
