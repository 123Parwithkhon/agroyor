// Авторство демо-фото с Wikimedia Commons (свободные лицензии).
// Лицензии CC BY / CC BY-SA требуют указать автора, лицензию, источник и что снимок изменён
// (размер уменьшен для медленного интернета) — подпись показывается под фото на странице техники.

export type PhotoCredit = {
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
};

export const PHOTO_CREDITS: Record<string, PhotoCredit> = {
  '/demo-photos/mtz82.jpg': {
    author: 'Ben Paarmann',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Belarus_Tractor_in_Tajikistan.jpg',
  },
  '/demo-photos/mtz1221.jpg': {
    author: 'Gintulis',
    license: 'Public domain',
    licenseUrl: null,
    source: 'https://commons.wikimedia.org/wiki/File:Belarus_1221.JPG',
  },
  '/demo-photos/umz6.jpg': {
    author: 'George Chernilevsky',
    license: 'Public domain',
    licenseUrl: null,
    source: 'https://commons.wikimedia.org/wiki/File:YuMZ-6KL_tractor_2011_G1.jpg',
  },
  '/demo-photos/niva.jpg': {
    author: 'Altes',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:SK-5_Niva.jpg',
  },
  '/demo-photos/t40.jpg': {
    author: 'Shreesha Sharma',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Agricultural_drone_spraying_on_paddy_field.jpg',
  },
};

export function photoCredit(url: string | undefined): PhotoCredit | null {
  return url ? (PHOTO_CREDITS[url] ?? null) : null;
}
