import { useCallback, useEffect, useState } from 'react';
import { ApiConfig, BusStop, FavoriteStop, RecentStop } from '../types/bus';

const STORAGE_KEYS = {
  favorites: 'sg_busstop_favorites_v1',
  recents: 'sg_busstop_recents_v1',
  apiConfig: 'sg_busstop_api_config_v1',
  lastStop: 'sg_busstop_last_stop_v1',
};

const DEFAULT_FAVORITES: FavoriteStop[] = [
  {
    code: '09048',
    customLabel: 'Orchard Commute',
    description: 'Lucky Plaza',
    roadName: 'Orchard Rd',
    pinnedServices: ['7', '14', '175'],
    addedAt: 1,
  },
  {
    code: '01012',
    customLabel: 'Bugis / Victoria',
    description: 'Hotel Grand Pacific',
    roadName: 'Victoria St',
    pinnedServices: ['7', '130'],
    addedAt: 2,
  },
  {
    code: '14141',
    customLabel: 'HarbourFront',
    description: 'VivoCity',
    roadName: 'Telok Blangah Rd',
    pinnedServices: ['10', '97'],
    addedAt: 3,
  },
];

const DEFAULT_API_CONFIG: ApiConfig = {
  mode: 'sample',
  endpointTemplate: '/api/bus-arrival?BusStopCode={code}',
  autoRefreshSeconds: 30,
};

function safeReadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted iframe modes
  }
}

export function useBusStorage() {
  const [favorites, setFavorites] = useState<FavoriteStop[]>(() =>
    safeReadStorage<FavoriteStop[]>(STORAGE_KEYS.favorites, DEFAULT_FAVORITES),
  );

  const [recents, setRecents] = useState<RecentStop[]>(() =>
    safeReadStorage<RecentStop[]>(STORAGE_KEYS.recents, []),
  );

  const [apiConfig, setApiConfig] = useState<ApiConfig>(() =>
    safeReadStorage<ApiConfig>(STORAGE_KEYS.apiConfig, DEFAULT_API_CONFIG),
  );

  const [lastStopCode, setLastStopCode] = useState<string>(() =>
    safeReadStorage<string>(STORAGE_KEYS.lastStop, '09048'),
  );

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.recents, recents);
  }, [recents]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.apiConfig, apiConfig);
  }, [apiConfig]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.lastStop, lastStopCode);
  }, [lastStopCode]);

  const isFavorite = useCallback(
    (code: string) => favorites.some((fav) => fav.code === code),
    [favorites],
  );

  const getFavorite = useCallback(
    (code: string) => favorites.find((fav) => fav.code === code),
    [favorites],
  );

  const toggleFavorite = useCallback((stop: BusStop, customLabel = '') => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.code === stop.code);
      if (exists) {
        return prev.filter((item) => item.code !== stop.code);
      }
      const next: FavoriteStop = {
        code: stop.code,
        customLabel: customLabel.trim(),
        description: stop.description,
        roadName: stop.roadName,
        pinnedServices: [],
        addedAt: Date.now(),
      };
      return [next, ...prev];
    });
  }, []);

  const updateFavoriteLabel = useCallback((code: string, customLabel: string) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.code === code ? { ...item, customLabel: customLabel.trim() } : item,
      ),
    );
  }, []);

  const removeFavorite = useCallback((code: string) => {
    setFavorites((prev) => prev.filter((item) => item.code !== code));
  }, []);

  const moveFavorite = useCallback((code: string, direction: 'up' | 'down') => {
    setFavorites((prev) => {
      const idx = prev.findIndex((item) => item.code === code);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  }, []);

  const togglePinnedService = useCallback((stop: BusStop, serviceNo: string) => {
    setFavorites((prev) => {
      const exists = prev.find((item) => item.code === stop.code);
      if (!exists) {
        return [
          {
            code: stop.code,
            customLabel: '',
            description: stop.description,
            roadName: stop.roadName,
            pinnedServices: [serviceNo],
            addedAt: Date.now(),
          },
          ...prev,
        ];
      }
      return prev.map((item) => {
        if (item.code !== stop.code) return item;
        const alreadyPinned = item.pinnedServices.includes(serviceNo);
        return {
          ...item,
          pinnedServices: alreadyPinned
            ? item.pinnedServices.filter((s) => s !== serviceNo)
            : [...item.pinnedServices, serviceNo],
        };
      });
    });
  }, []);

  const recordRecentStop = useCallback((stop: BusStop) => {
    setLastStopCode(stop.code);
    setRecents((prev) => {
      const filtered = prev.filter((item) => item.code !== stop.code);
      const next: RecentStop = {
        code: stop.code,
        description: stop.description,
        roadName: stop.roadName,
        viewedAt: Date.now(),
      };
      return [next, ...filtered].slice(0, 8);
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
  }, []);

  const updateApiConfig = useCallback((partial: Partial<ApiConfig>) => {
    setApiConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  return {
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
  };
}
