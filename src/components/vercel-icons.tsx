import type {SVGProps} from 'react';

export type VercelIconProps = SVGProps<SVGSVGElement>;

function Icon({children, className, ...props}: VercelIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowClockwise(props: VercelIconProps) {
  return <Icon {...props}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 5v5h-5" /></Icon>;
}

export function ArrowsDownUp(props: VercelIconProps) {
  return <Icon {...props}><path d="M7 4v16" /><path d="m4 7 3-3 3 3" /><path d="m4 17 3 3 3-3" /><path d="M17 4v16" /><path d="m14 7 3-3 3 3" /><path d="m14 17 3 3 3-3" /></Icon>;
}

export function Bell(props: VercelIconProps) {
  return <Icon {...props}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20h4" /></Icon>;
}

export function Buildings(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 20V6h7v14" /><path d="M13 20V10h7v10" /><path d="M7 9h1" /><path d="M7 13h1" /><path d="M16 13h1" /><path d="M16 16h1" /></Icon>;
}

export function CalendarBlank(props: VercelIconProps) {
  return <Icon {...props}><rect width="16" height="15" x="4" y="5" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /></Icon>;
}

export function CaretDown(props: VercelIconProps) {
  return <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>;
}

export function CaretLeft(props: VercelIconProps) {
  return <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>;
}

export function CaretRight(props: VercelIconProps) {
  return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>;
}

export function ChartBar(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 20h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-4" /></Icon>;
}

export function ChartLine(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 19h16" /><path d="M5 15 10 9l4 4 5-7" /></Icon>;
}

export function Clock(props: VercelIconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></Icon>;
}

export function DownloadSimple(props: VercelIconProps) {
  return <Icon {...props}><path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 20h14" /></Icon>;
}

export function DotsThreeHorizontal(props: VercelIconProps) {
  return <Icon {...props}><circle cx="6.5" cy="12" r=".75" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r=".75" fill="currentColor" stroke="none" /><circle cx="17.5" cy="12" r=".75" fill="currentColor" stroke="none" /></Icon>;
}

export function EnvelopeSimple(props: VercelIconProps) {
  return <Icon {...props}><rect width="16" height="12" x="4" y="6" rx="2" /><path d="m5 8 7 5 7-5" /></Icon>;
}

export function GearSix(props: VercelIconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3" /><path d="M12 18.5v3" /><path d="m4.5 4.5 2.1 2.1" /><path d="m17.4 17.4 2.1 2.1" /><path d="M2.5 12h3" /><path d="M18.5 12h3" /><path d="m4.5 19.5 2.1-2.1" /><path d="m17.4 6.6 2.1-2.1" /></Icon>;
}

export function IdentificationCard(props: VercelIconProps) {
  return <Icon {...props}><rect width="18" height="13" x="3" y="6" rx="2" /><path d="M7 10h5" /><path d="M7 14h3" /><circle cx="16" cy="13" r="2" /></Icon>;
}

export function MagnifyingGlass(props: VercelIconProps) {
  return <Icon {...props}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></Icon>;
}

export function Moon(props: VercelIconProps) {
  return <Icon {...props}><path d="M18.5 15.5A7.2 7.2 0 0 1 8.5 5.5a7.5 7.5 0 1 0 10 10Z" /><path d="M16.5 4.5h.01" /></Icon>;
}

export function PencilSimpleLine(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 20h16" /><path d="m14 5 5 5-9 9H5v-5l9-9Z" /><path d="m12 7 5 5" /></Icon>;
}

export function Phone(props: VercelIconProps) {
  return <Icon {...props}><path d="M8 4 5 7c1 6 6 11 12 12l3-3-4-3-2 2c-2.5-1-4.5-3-5.5-5.5l2-2L8 4Z" /></Icon>;
}

export function Plus(props: VercelIconProps) {
  return <Icon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>;
}

export function ShieldCheck(props: VercelIconProps) {
  return <Icon {...props}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
}

export function SidebarSimple(props: VercelIconProps) {
  return <Icon {...props}><rect width="16" height="14" x="4" y="5" rx="2" /><path d="M10 5v14" /></Icon>;
}

export function SignIn(props: VercelIconProps) {
  return <Icon {...props}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M4 12h11" /><path d="m11 8 4 4-4 4" /></Icon>;
}

export function SignOut(props: VercelIconProps) {
  return <Icon {...props}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M9 12h11" /><path d="m16 8 4 4-4 4" /></Icon>;
}

export function SlidersHorizontal(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 7h10" /><path d="M18 7h2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Icon>;
}

export function SquaresFour(props: VercelIconProps) {
  return <Icon {...props}><rect width="6" height="6" x="4" y="4" rx="1" /><rect width="6" height="6" x="14" y="4" rx="1" /><rect width="6" height="6" x="4" y="14" rx="1" /><rect width="6" height="6" x="14" y="14" rx="1" /></Icon>;
}

export function Sun(props: VercelIconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3.75" /><path d="M12 3v2" /><path d="M12 19v2" /><path d="M5 12H3" /><path d="M21 12h-2" /><path d="m6.35 6.35 1.4 1.4" /><path d="m16.25 16.25 1.4 1.4" /><path d="m17.65 6.35-1.4 1.4" /><path d="m7.75 16.25-1.4 1.4" /></Icon>;
}

export function Translate(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 5h8" /><path d="M8 3v2" /><path d="M5 9c1.5 3 4 5 7 6" /><path d="M11 9c-.8 2-2.5 4-5 6" /><path d="M14 20 18 9l4 11" /><path d="M15.5 16h5" /></Icon>;
}

export function Trash(props: VercelIconProps) {
  return <Icon {...props}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v5" /><path d="M14 11v5" /></Icon>;
}

export function TreeStructure(props: VercelIconProps) {
  return <Icon {...props}><rect width="6" height="4" x="9" y="3" rx="1" /><rect width="6" height="4" x="4" y="17" rx="1" /><rect width="6" height="4" x="14" y="17" rx="1" /><path d="M12 7v5" /><path d="M7 17v-3h10v3" /></Icon>;
}

export function UserCircle(props: VercelIconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18a6 6 0 0 1 11 0" /></Icon>;
}

export function UserGear(props: VercelIconProps) {
  return <Icon {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 18a6 6 0 0 1 9.5-4.8" /><circle cx="17" cy="17" r="2" /><path d="M17 12.5v1.2" /><path d="M17 20.3v1.2" /><path d="m13.1 14.8 1 .6" /><path d="m19.9 18.6 1 .6" /><path d="m13.1 19.2 1-.6" /><path d="m19.9 15.4 1-.6" /></Icon>;
}

export function Users(props: VercelIconProps) {
  return <Icon {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 18a6 6 0 0 1 11 0" /><path d="M16 11a3 3 0 1 0-.8-5.9" /><path d="M16.5 14a5 5 0 0 1 4 4" /></Icon>;
}

export function X(props: VercelIconProps) {
  return <Icon {...props}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></Icon>;
}
