import {makeScene2D, Rect, Txt, Line, Circle, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutBack,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, StatCard, StatRow} from '../../components';

const C = theme.colors;
const F = theme.fonts;

/* A simple device frame: an outline, a header bar, and 1–3 content columns.
   Used to show the same content reflowing from phone → tablet → desktop. */
interface DeviceProps {
  ref?: any;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  accent: string;
  label: string;
}
function Device(o: DeviceProps) {
  const pad = 12;
  const innerW = o.w - pad * 2;
  const gap = 8;
  const colW = (innerW - gap * (o.cols - 1)) / o.cols;
  const colH = o.h - pad * 2 - 28;
  const cy = 14;
  const xOf = (i: number) => -innerW / 2 + colW / 2 + i * (colW + gap);
  const col = (i: number) => (
    <Rect width={colW} height={colH} radius={5} fill={`${o.accent}22`} stroke={o.accent} lineWidth={1.5} position={[xOf(i), cy]} />
  );
  return (
    <Node ref={o.ref} position={[o.x, o.y]}>
      <Rect width={o.w} height={o.h} radius={16} fill={C.panel} stroke={o.accent} lineWidth={2.5} shadowColor={o.accent} shadowBlur={theme.glow} />
      <Rect width={innerW} height={16} radius={4} fill={`${o.accent}44`} position={[0, -o.h / 2 + pad + 8]} />
      {col(0)}
      {o.cols >= 2 ? col(1) : null}
      {o.cols >= 3 ? col(2) : null}
      <Txt text={o.label} fill={o.accent} fontFamily={F.mono} fontSize={17} letterSpacing={1} y={o.h / 2 + 24} />
    </Node>
  );
}

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  view.add(
    <Circle
      width={1700}
      height={1700}
      position={[0, -120]}
      fill={C.bgGlow}
      opacity={0.5}
      shadowColor={C.bgGlow}
      shadowBlur={400}
      zIndex={-10}
    />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — a desktop-first layout crammed onto a phone
  const pPill = createRef<Layout>();
  const pPhone = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — design for the phone first, then enhance up
  const sPill = createRef<Layout>();
  const sPhone = createRef<Node>();
  const sTablet = createRef<Node>();
  const sDesktop = createRef<Node>();
  const a1 = createRef<Line>();
  const a2 = createRef<Line>();
  const sStats = createRef<Layout>();

  const pLCP = createSignal(0);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Mobile "
        titleB="First"
        subtitle="design for the smallest screen, then enhance up"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — DESKTOP FIRST (problem) ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="DESKTOP FIRST"
        note="a desktop layout shoved onto a phone"
        position={[-20, -660]}
      />

      {/* a phone whose content was designed for a wide viewport — it overflows */}
      <Node ref={pPhone} position={[0, -430]}>
        <Rect width={210} height={320} radius={18} fill={C.panel} stroke={C.coral} lineWidth={2.5} shadowColor={C.coral} shadowBlur={theme.glow} />
        <Rect width={320} height={30} radius={6} fill={`${C.coral}33`} stroke={C.coral} lineWidth={1.5} position={[20, -120]} />
        <Rect width={300} height={150} radius={6} fill={`${C.coral}1f`} stroke={C.coral} lineWidth={1.5} position={[30, 0]} />
        <Rect width={280} height={22} radius={4} fill={`${C.coral}33`} position={[40, 96]} />
        {/* the phone's right edge — everything past it needs horizontal scroll */}
        <Line points={[[105, -150], [105, 150]]} stroke={C.coral} lineWidth={2} lineDash={[6, 8]} opacity={0.85} />
        <Txt text="overflow →" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={1} position={[150, 150]} />
      </Node>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="PAYLOAD" value="4.2 MB" accent={C.coral} width={300} />
        <StatCard label="LCP on 3G" value={() => `${pLCP().toFixed(1)}s`} accent={C.coral} width={300} />
        <StatCard label="FITS" value="no" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — MOBILE FIRST (solution) ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="MOBILE FIRST"
        note="one fluid layout reflows up at breakpoints"
        position={[0, 70]}
      />

      <Device ref={sPhone} x={-340} y={380} w={120} h={230} cols={1} accent={C.teal} label="sm · phone" />
      <Line ref={a1} points={[[-262, 380], [-182, 380]]} stroke={C.teal} lineWidth={3} opacity={0.6} lineDash={[2, 12]} endArrow arrowSize={13} end={0} />
      <Device ref={sTablet} x={-70} y={380} w={200} h={230} cols={2} accent={C.teal} label="md · tablet" />
      <Line ref={a2} points={[[38, 380], [104, 380]]} stroke={C.teal} lineWidth={3} opacity={0.6} lineDash={[2, 12]} endArrow arrowSize={13} end={0} />
      <Device ref={sDesktop} x={272} y={380} w={324} h={196} cols={3} accent={C.teal} label="lg · desktop" />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="PAYLOAD" value="0.4 MB" accent={C.teal} width={300} />
        <StatCard label="LCP on 3G" value="1.2s" accent={C.teal} width={300} />
        <StatCard label="BREAKPOINTS" value="sm md lg" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pPhone, sPhone, sTablet, sDesktop]) r().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem ----------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* pPhone().scale(1, 0.55, easeOutBack);
  yield* pStats().opacity(1, 0.4);
  yield* pLCP(8.1, 1.4);
  // a small nudge that reads as forced horizontal scrolling
  yield* pPhone().position([-14, -430], 0.3);
  yield* pPhone().position([0, -430], 0.3);
  yield* waitFor(0.7);

  // STATE 2: solution — build the smallest first, then enhance up -------
  yield* sPill().opacity(1, 0.4);
  yield* sPhone().scale(1, 0.5, easeOutBack);
  yield* a1().end(1, 0.3);
  yield* sTablet().scale(1, 0.5, easeOutBack);
  yield* a2().end(1, 0.3);
  yield* sDesktop().scale(1, 0.5, easeOutBack);
  yield* sStats().opacity(1, 0.4);

  yield* waitFor(1.8);
});
