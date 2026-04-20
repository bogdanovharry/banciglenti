import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0 }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
}
export function IconCart(p: IconProps) {
  return <Icon {...p}><path d="M3 4h2.2l2.1 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.5L21.5 8H6" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17.5" cy="20" r="1.2" /></Icon>;
}
export function IconPhone(p: IconProps) {
  return <Icon {...p}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h2.1a1.5 1.5 0 0 1 1.47 1.17l.78 3.52a1.5 1.5 0 0 1-.4 1.42l-1.5 1.5a12 12 0 0 0 5.44 5.44l1.5-1.5a1.5 1.5 0 0 1 1.42-.4l3.52.78A1.5 1.5 0 0 1 21 15.4v2.1a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 5 4.5Z" /></Icon>;
}
export function IconMail(p: IconProps) {
  return <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3.5 6 8.5 7 8.5-7" /></Icon>;
}
export function IconMenu(p: IconProps) {
  return <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
}
export function IconClose(p: IconProps) {
  return <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}
export function IconArrowRight(p: IconProps) {
  return <Icon {...p}><path d="M5 12h14m-5-5 5 5-5 5" /></Icon>;
}
export function IconArrowUp(p: IconProps) {
  return <Icon {...p}><path d="M12 19V5m-5 5 5-5 5 5" /></Icon>;
}
export function IconChevron(p: IconProps) {
  return <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
}
export function IconCheck(p: IconProps) {
  return <Icon {...p}><path d="m5 12 5 5 9-11" /></Icon>;
}
export function IconPlus(p: IconProps) {
  return <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
}
export function IconMinus(p: IconProps) {
  return <Icon {...p}><path d="M5 12h14" /></Icon>;
}
export function IconFilter(p: IconProps) {
  return <Icon {...p}><path d="M4 5h16M7 12h10M10 19h4" /></Icon>;
}
export function IconHeart(p: IconProps) {
  return <Icon {...p}><path d="M12 20s-7-4.3-7-10.1A4 4 0 0 1 12 6a4 4 0 0 1 7 3.9c0 5.8-7 10.1-7 10.1Z" /></Icon>;
}
export function IconUser(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>;
}

// Category icons
export function IconWood(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="3" /></Icon>;
}
export function IconMetal(p: IconProps) {
  return <Icon {...p}><path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" /><circle cx="12" cy="12" r="3.2" /></Icon>;
}
export function IconHobby(p: IconProps) {
  return <Icon {...p}><path d="M3 14h14l3-3-3-3H3" /><path d="M6 14v4M10 14v4M14 14v4" /></Icon>;
}
export function IconFood(p: IconProps) {
  return <Icon {...p}><path d="M3 8h12l2 4H3z" /><path d="M17 12v8M15 12v4" /></Icon>;
}
export function IconMachine(p: IconProps) {
  return <Icon {...p}><path d="M4 4h16v5H4z" /><path d="M8 9v4h8V9" /><path d="M6 20h12M10 13h4v7h-4z" /></Icon>;
}
export function IconAbrasive(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" /></Icon>;
}
export function IconBand(p: IconProps) {
  return <Icon {...p}><ellipse cx="12" cy="12" rx="9" ry="5" /><path d="M3 12h18" /></Icon>;
}
export function IconShield(p: IconProps) {
  return <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
}
export function IconTruck(p: IconProps) {
  return <Icon {...p}><path d="M3 16V6h11v10M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></Icon>;
}
export function IconTarget(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></Icon>;
}
export function IconFactory(p: IconProps) {
  return <Icon {...p}><path d="M3 21V10l5 3V10l5 3V7l8 4v10H3Z" /><path d="M7 21v-4M12 21v-4M17 21v-4" /></Icon>;
}
export function IconWrench(p: IconProps) {
  return <Icon {...p}><path d="M15 3a5 5 0 0 1 4.5 7L21 11.5 17 15.5 15.5 14a5 5 0 0 1-7-4.5L3 15 9 21l5.5-5.5" /></Icon>;
}
export function IconRuler(p: IconProps) {
  return <Icon {...p}><path d="M3 14 14 3l7 7-11 11z" /><path d="M7 10l2 2M10 7l2 2M13 14l2 2M16 11l2 2" /></Icon>;
}
export function IconDoc(p: IconProps) {
  return <Icon {...p}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></Icon>;
}
