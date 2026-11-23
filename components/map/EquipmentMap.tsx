'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@/lib/geo';

export type MapPoint = {
  id: number;
  at: LatLng;
  title: string;
  typeLabel: string;
  priceText: string;
  radiusKm: number;
  href: string;
};

export type MapMarket = { name: string; at: LatLng };

type Props = {
  points: MapPoint[];
  markets: MapMarket[];
  products: { id: number; name: string }[];
  /** Цена дня (готовый текст) по продукту и индексу рынка: prices[productId][i] */
  prices: Record<number, (string | null)[]>;
  labels: { priceOf: string; open: string; error: string; approx: string };
};

// Границы Согдийской области — на широком экране карта открывается на всей области
const SUGHD_BOUNDS: [LatLng, LatLng] = [
  [39.25, 67.45],
  [40.8, 70.85],
];
// На телефоне — Ферганская часть с тремя рынками (иначе масштаб слишком мелкий; Пенджикент — прокруткой)
const FERGANA_BOUNDS: [LatLng, LatLng] = [
  [39.8, 68.85],
  [40.5, 70.75],
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  // textContent, а не innerHTML: названия приходят из базы (защита от XSS)
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Карта Согда (Leaflet + OpenStreetMap): точки техники с радиусом выезда и
 * пульсирующие маркеры рынков с ценой дня выбранного продукта.
 * Leaflet загружается только здесь (динамический импорт) — обычный каталог не тяжелеет.
 */
export default function EquipmentMap({ points, markets, products, prices, labels }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const priceNodes = useRef<HTMLSpanElement[]>([]);
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    import('leaflet')
      .then((L) => {
        if (cancelled || !box.current) return;
        const narrow = box.current.clientWidth < 640;
        map = L.map(box.current, { scrollWheelZoom: false }).fitBounds(narrow ? FERGANA_BOUNDS : SUGHD_BOUNDS, {
          padding: [24, 24],
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        for (const p of points) {
          // Радиус выезда — полупрозрачный круг, точка — сама техника
          L.circle(p.at, { radius: p.radiusKm * 1000, color: '#0b7266', weight: 1, opacity: 0.4, fillOpacity: 0.06 }).addTo(map);
          const popup = el('div', 'text-sm');
          popup.append(el('b', 'block text-lapis-900', p.title), el('span', 'block text-stone-600', p.typeLabel));
          popup.append(el('span', 'block font-semibold text-firuza-800', p.priceText));
          const link = el('a', 'mt-1 inline-block font-semibold underline', labels.open);
          link.href = p.href;
          popup.append(link);
          L.circleMarker(p.at, { radius: 8, color: '#fff', weight: 2, fillColor: '#0b7266', fillOpacity: 1 })
            .bindPopup(popup)
            .addTo(map);
        }

        priceNodes.current = [];
        markets.forEach((m, i) => {
          const root = el('div', 'ay-market');
          const label = el('div', 'ay-market-label', m.name);
          const price = el('span', 'ay-market-price', prices[products[0]?.id ?? 0]?.[i] ?? '');
          label.append(price);
          root.append(label, el('div', 'ay-market-dot'));
          priceNodes.current[i] = price;
          L.marker(m.at, {
            icon: L.divIcon({ html: root, className: '', iconSize: [0, 0] }),
            keyboard: false,
            interactive: false,
          }).addTo(map!);
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
    // Карта строится один раз на набор точек; цена на маркерах обновляется отдельно ниже
  }, [points, markets, prices, products, labels.open]);

  // Смена продукта — меняем только текст цены на маркерах рынков, карту не пересоздаём
  useEffect(() => {
    priceNodes.current.forEach((node, i) => {
      node.textContent = prices[productId]?.[i] ?? '—';
    });
  }, [productId, prices]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="map-product" className="text-sm font-medium">{labels.priceOf}</label>
        <select
          id="map-product"
          value={productId}
          onChange={(e) => setProductId(Number(e.target.value))}
          className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {failed ? (
        <p role="alert" className="rounded-xl border border-sand-200 bg-white p-5 text-center text-stone-600">{labels.error}</p>
      ) : (
        <div ref={box} className="isolate h-[60vh] min-h-80 w-full overflow-hidden rounded-xl border border-sand-200 sm:h-[65vh]" />
      )}
      <p className="text-xs text-stone-600">{labels.approx}</p>
    </div>
  );
}
