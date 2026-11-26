import { NextResponse } from 'next/server';

// Выгрузка цен теперь в Excel: старые ссылки на CSV ведут на /api/prices.xlsx с теми же параметрами
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = '/api/prices.xlsx';
  return NextResponse.redirect(url, 308);
}
