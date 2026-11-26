'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@/lib/geo';

export type HeatDistrict = {
  name: string;
  at: LatLng;
  machines: number;
  percent: number;
  level: 'idle' | 'low' | 'normal' | 'high';
  demand: number;
  openRequests: number;
  /** Готовый текст для всплывающей подсказки (виды техники) */
  details: string;
};

type Props = {
  districts: HeatDistrict[];
  labels: { machines: string; load: string; demand: string; requests: string; error: string; shortage: string };
};

/** Цвета уровня загрузки: простой — серо-синий, низкая — бирюза, средняя — золото, высокая — гранат. */
export const LOAD_COLORS: Record<HeatDistrict['level'], string> = {
  idle: '#94a3b8',
  low: '#0b7266',
  normal: '#d99a1e',
  high: '#c2410c',
};

const SUGHD_BOUNDS: [LatLng, LatLng] = [
  [39.25, 67.45],
  [40.8, 70.85],
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * «Тепловая карта» Согда: круг на районе — размер по числу машин, цвет по загруженности.
 * Пунктирное красное кольцо — спрос больше, чем техники (дефицит).
 */
export default function LoadHeatMap({ districts, labels }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    import('leaflet')
      .then((L) => {
        if (cancelled || !box.current) return;
        map = L.map(box.current, { scrollWheelZoom: false }).fitBounds(SUGHD_BOUNDS, { padding: [16, 16] });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        for (const d of districts) {
          if (d.machines === 0 && d.demand === 0) continue;
          const popup = el('div', 'text-sm');
          popup.append(el('b', 'block text-lapis-900', d.name));
          popup.append(el('span', 'block', `${labels.machines}: ${d.machines}`));
          if (d.details) popup.append(el('span', 'block text-stone-600', d.details));
          popup.append(el('span', 'block', `${labels.load}: ${d.percent}%`));
          popup.append(el('span', 'block', `${labels.demand}: ${d.demand}`));
          if (d.openRequests > 0) popup.append(el('span', 'block font-semibold text-anor-700', `${labels.requests}: ${d.openRequests}`));

          const radius = 3000 + Math.sqrt(Math.max(1, d.machines)) * 3500;
          L.circle(d.at, {
            radius,
            color: LOAD_COLORS[d.level],
            weight: 2,
            fillColor: LOAD_COLORS[d.level],
            fillOpacity: d.machines === 0 ? 0.1 : 0.35 + Math.min(0.4, d.percent / 150),
          })
            .bindPopup(popup)
            .addTo(map);
          if (d.demand > d.machines) {
            L.circle(d.at, { radius: radius + 2500, color: '#be123c', weight: 2, dashArray: '6 6', fill: false, interactive: false })
              .bindTooltip(labels.shortage)
              .addTo(map);
          }
          L.marker(d.at, {
            icon: L.divIcon({ html: el('div', 'ay-heat-label', String(d.machines)), className: '', iconSize: [0, 0] }),
            interactive: false,
            keyboard: false,
          }).addTo(map);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [districts, labels]);

  return failed ? (
    <p role="alert" className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{labels.error}</p>
  ) : (
    <div ref={box} className="isolate h-[55vh] min-h-80 w-full overflow-hidden rounded-2xl border border-sand-200" />
  );
}
