// Картинка-плитка вида техники (пока у объявления нет фото): цветной фон с узором гирих
// и крупная иконка. Только SVG — ничего не скачивается.
import type { EquipmentType } from '@/lib/equipment';

const BACKGROUNDS: Record<EquipmentType, string> = {
  tractor: 'from-lapis-800 to-lapis-700',
  cultivator: 'from-firuza-800 to-firuza-600',
  seeder: 'from-zar-700 to-zar-500',
  sprayer: 'from-firuza-700 to-lapis-700',
  harvester: 'from-zar-700 to-anor-700',
  motoblock: 'from-anor-700 to-anor-600',
  drone: 'from-lapis-900 to-firuza-700',
  trailer: 'from-lapis-700 to-firuza-800',
  other: 'from-stone-700 to-stone-500',
};

function TypeShape({ type }: { type: EquipmentType }) {
  switch (type) {
    case 'tractor':
      return (
        <>
          <circle cx="16" cy="44" r="10" />
          <circle cx="16" cy="44" r="3" />
          <circle cx="50" cy="47" r="7" />
          <path d="M8 34V16h18l6 14h18a6 6 0 0 1 6 6v7" />
          <path d="M26 44h17M38 30V18M12 16v-4h10" />
        </>
      );
    case 'cultivator':
      return (
        <>
          <path d="M6 22h52M14 22v6M50 22v6" />
          <path d="M18 22l-4 26M28 22l-4 26M38 22l-4 26M48 22l-4 26" />
          <path d="M10 48h6M20 48h6M30 48h6M40 48h6" />
          <path d="M32 22V12h14" />
        </>
      );
    case 'seeder':
      return (
        <>
          <path d="M12 14h40l-6 18H18z" />
          <path d="M8 32h48v6H8z" />
          <circle cx="16" cy="46" r="6" />
          <circle cx="48" cy="46" r="6" />
          <path d="M26 44v4M32 44v6M38 44v4" />
        </>
      );
    case 'sprayer':
      return (
        <>
          <rect x="16" y="12" width="28" height="22" rx="8" />
          <path d="M6 40h52M12 40v6M24 40v8M36 40v8M48 40v6" />
          <path d="M12 52l-2 4M24 54l-1 4M36 54l1 4M48 52l2 4" />
          <path d="M30 34v6" />
        </>
      );
    case 'harvester':
      return (
        <>
          <path d="M24 20h24l6 12v12H24z" />
          <path d="M30 20v-8h10v8" />
          <circle cx="32" cy="46" r="7" />
          <circle cx="50" cy="48" r="5" />
          <path d="M24 34H8M8 26v16M8 30h4M8 38h4" />
        </>
      );
    case 'motoblock':
      return (
        <>
          <circle cx="24" cy="44" r="11" />
          <circle cx="24" cy="44" r="4" />
          <path d="M24 33l8-11h10M42 22l10-10M52 12h6" />
          <path d="M30 26h10v8H30z" />
        </>
      );
    case 'drone':
      return (
        <>
          <rect x="24" y="26" width="16" height="12" rx="4" />
          <path d="M24 28L14 18M40 28l10-10M24 36L14 46M40 36l10 10" />
          <path d="M6 18h16M42 18h16M6 46h16M42 46h16" />
          <path d="M28 44l-2 8M32 44v10M36 44l2 8" />
        </>
      );
    case 'trailer':
      return (
        <>
          <path d="M10 20h40v20H10z" />
          <path d="M50 36h10" />
          <circle cx="22" cy="46" r="7" />
          <circle cx="38" cy="46" r="7" />
          <path d="M18 20l4-8h16l4 8" />
        </>
      );
    default:
      return (
        <>
          <circle cx="32" cy="32" r="10" />
          <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6" />
        </>
      );
  }
}

/** Только контур вида техники (без фона) — для светлых карточек; цвет — currentColor. */
export function EquipmentGlyph({ type, className }: { type: EquipmentType; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <TypeShape type={type} />
    </svg>
  );
}

export function EquipmentArt({ type, className }: { type: EquipmentType; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${BACKGROUNDS[type]} ${className ?? ''}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="relative size-1/2 max-h-28 text-white drop-shadow"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <TypeShape type={type} />
      </svg>
    </div>
  );
}
