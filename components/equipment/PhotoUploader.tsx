'use client';

import { useState } from 'react';

type Props = {
  initial: string[];
  labels: { add: string; remove: string; uploading: string; error: string };
};

const MAX_PHOTOS = 5;
const MAX_SIDE = 1280;

// Сжатие на клиенте до ~1280px, JPEG
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.8),
  );
}

export default function PhotoUploader({ initial, labels }: Props) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - urls.length);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    setFailed(false);
    const added: string[] = [];
    for (const file of files) {
      try {
        const blob = await compress(file);
        const fd = new FormData();
        fd.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('upload');
        const data = (await res.json()) as { url: string };
        added.push(data.url);
      } catch {
        setFailed(true);
      }
    }
    setUrls((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {urls.map((u) => (
        <input key={u} type="hidden" name="photos" value={u} />
      ))}
      <ul className="grid grid-cols-3 gap-2">
        {urls.map((u) => (
          <li key={u} className="space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((x) => x !== u))}
              className="min-h-11 w-full text-sm underline"
            >
              {labels.remove}
            </button>
          </li>
        ))}
      </ul>
      {urls.length < MAX_PHOTOS && (
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-firuza-700 px-4 font-medium text-firuza-700">
          {busy ? labels.uploading : labels.add}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={onPick}
            className="sr-only"
          />
        </label>
      )}
      {failed && (
        <p role="alert" className="text-sm text-anor-700">
          {labels.error}
        </p>
      )}
    </div>
  );
}