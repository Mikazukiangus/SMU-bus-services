import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Clock,
  Edit3,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { FavoriteStop, RecentStop } from '../types/bus';

interface FavoritesPanelProps {
  variant: 'sidebar' | 'full';
  favorites: FavoriteStop[];
  recents?: RecentStop[];
  activeCode: string;
  onSelectStop: (code: string) => void;
  onRemoveFavorite: (code: string) => void;
  onUpdateLabel: (code: string, label: string) => void;
  onMoveFavorite: (code: string, direction: 'up' | 'down') => void;
  onClearRecents?: () => void;
  onBrowseDirectory?: () => void;
}

export function FavoritesPanel({
  variant,
  favorites,
  recents = [],
  activeCode,
  onSelectStop,
  onRemoveFavorite,
  onUpdateLabel,
  onMoveFavorite,
  onClearRecents,
  onBrowseDirectory,
}: FavoritesPanelProps) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  function beginEdit(fav: FavoriteStop) {
    setEditingCode(fav.code);
    setLabelDraft(fav.customLabel);
  }

  function submitEdit(event: React.FormEvent, code: string) {
    event.preventDefault();
    onUpdateLabel(code, labelDraft);
    setEditingCode(null);
  }

  if (variant === 'sidebar') {
    return (
      <div className="space-y-6">
        {/* Saved Favorites */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Saved Favorites
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {favorites.length}
            </span>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center">
              <p className="text-sm font-medium text-slate-700">No favorites yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Save any bus stop for one-tap access during your commute.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {favorites.map((fav) => {
                const isActive = fav.code === activeCode;
                return (
                  <li key={fav.code}>
                    <button
                      type="button"
                      onClick={() => onSelectStop(fav.code)}
                      className={`group flex min-h-[60px] w-full items-center justify-between gap-2.5 px-3.5 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-[#008348]/[0.06]'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              isActive ? 'text-[#007A43]' : 'text-slate-600'
                            }`}
                          >
                            {fav.code}
                          </span>
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {fav.customLabel || fav.description}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {fav.customLabel ? `${fav.description} · ` : ''}
                          {fav.roadName}
                        </p>
                        {fav.pinnedServices.length > 0 && (
                          <p className="mt-1 truncate text-xs text-[#007A43]">
                            Pinned:{' '}
                            <span className="font-mono font-medium">
                              {fav.pinnedServices.join(', ')}
                            </span>
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-[#007A43] translate-x-0.5'
                            : 'text-slate-300 group-hover:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Stops */}
        {recents.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Stops</h2>
              {onClearRecents && (
                <button
                  type="button"
                  onClick={onClearRecents}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {recents.slice(0, 5).map((item) => {
                const isActive = item.code === activeCode;
                return (
                  <li key={item.code}>
                    <button
                      type="button"
                      onClick={() => onSelectStop(item.code)}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                            {item.code}
                          </span>
                          <span className="truncate text-sm font-medium text-slate-800">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
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

  // Full Management View (Favorites Tab)
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Saved Favorite Stops
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Organize your daily Singapore bus stops, assign commute nicknames, and reorder priority.
            </p>
          </div>
          {onBrowseDirectory && (
            <button
              type="button"
              onClick={onBrowseDirectory}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              Browse Stop Directory
            </button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Star className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            No favorite bus stops saved yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Enter a 5-digit bus stop code or explore the Singapore stop directory, then tap Save Favorite to keep it pinned here.
          </p>
          {onBrowseDirectory && (
            <button
              type="button"
              onClick={onBrowseDirectory}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#008348] px-5 text-sm font-semibold text-white hover:bg-[#006D3C] transition-colors"
            >
              Explore Stops
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {favorites.map((fav, index) => {
            const isEditing = editingCode === fav.code;
            return (
              <li
                key={fav.code}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => submitEdit(e, fav.code)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        placeholder="Nickname (e.g. Home, Office, MRT)"
                        maxLength={32}
                        autoFocus
                        className="h-10 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#008348] focus:outline-none focus:ring-2 focus:ring-[#008348]/20"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#008348] px-3.5 text-xs font-semibold text-white hover:bg-[#006D3C]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCode(null)}
                        className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectStop(fav.code)}
                      className="group block w-full text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#007A43] tabular-nums">
                          {fav.code}
                        </span>
                        <span className="text-base font-bold text-slate-900 group-hover:text-[#007A43] transition-colors">
                          {fav.customLabel || fav.description}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {fav.customLabel ? `${fav.description} · ` : ''}
                        {fav.roadName}
                      </p>
                      {fav.pinnedServices.length > 0 && (
                        <p className="mt-1.5 text-xs text-slate-600">
                          Pinned services:{' '}
                          <span className="font-mono font-semibold text-slate-900">
                            {fav.pinnedServices.join(', ')}
                          </span>
                        </p>
                      )}
                    </button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectStop(fav.code)}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#008348] px-3.5 text-xs font-semibold text-white hover:bg-[#006D3C] transition-colors whitespace-nowrap"
                  >
                    View Board
                  </button>
                  <button
                    type="button"
                    onClick={() => beginEdit(fav)}
                    aria-label={`Edit nickname for stop ${fav.code}`}
                    title="Edit nickname"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveFavorite(fav.code, 'up')}
                    disabled={index === 0}
                    aria-label={`Move ${fav.code} up`}
                    title="Move up"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 transition-colors"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveFavorite(fav.code, 'down')}
                    disabled={index === favorites.length - 1}
                    aria-label={`Move ${fav.code} down`}
                    title="Move down"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 transition-colors"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(fav.code)}
                    aria-label={`Remove ${fav.code} from favorites`}
                    title="Remove favorite"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
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
