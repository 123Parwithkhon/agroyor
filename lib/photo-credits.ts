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
  '/demo-photos/kps4.jpg': {
    author: 'Dwight Sipler',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Perfecta_II_field_cultivator_1.jpg',
  },
  '/demo-photos/neva.jpg': {
    author: 'Raphael Schmid (user Raphael S.)',
    license: 'Public domain',
    licenseUrl: null,
    source: 'https://commons.wikimedia.org/wiki/File:Two-wheel_tractor_2007.jpg',
  },
  '/demo-photos/zubr.jpg': {
    author: 'Steven Belcher',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Kubota_two-wheel_tractor_in_Thailand.jpg',
  },
  '/demo-photos/sz36.jpg': {
    author: 'Tracy Keller',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:John_Deere_6420_tractor,_John_Deere_450_grain_drill.jpg',
  },
  '/demo-photos/op2000.jpg': {
    author: 'FaceMePLS',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Steyr_tractor_with_John_Deere_field_sprayer.jpg',
  },
  '/demo-photos/backpack.jpg': {
    author: 'Michael Hermann',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Spraying_pesticides_in_quinoa_field.JPG',
  },
  '/demo-photos/pts4.jpg': {
    author: 'Homoatrox',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Belarus_82.3_tractor_with_a_grain_truck_trailer.jpg',
  },
  '/demo-photos/pts2.jpg': {
    author: 'Shuhrataxmedov',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Cotton_to_weigh_near_at_tractor_trailer_(Uzbekistan)-01.jpg',
  },
  '/demo-photos/pump.jpg': {
    author: 'Gannu03',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Agricultural_irrigation_pump_set_with_borewell,_Vrindavan,_Uttar_Pradesh,_India.jpg',
  },
};

export function photoCredit(url: string | undefined): PhotoCredit | null {
  return url ? (PHOTO_CREDITS[url] ?? null) : null;
}
