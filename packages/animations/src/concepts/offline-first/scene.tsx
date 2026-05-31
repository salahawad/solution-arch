import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutBack,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {
  TitleBlock,
  SectionPill,
  GlowNode,
  DbNode,
  FlowEdge,
  StatCard,
  StatRow,
} from '../../components';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  // soft navy radial glow behind everything
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

  // PROBLEM — an online-only app loses the write when the network drops
  const pPill = createRef<Layout>();
  const pApp = createRef<Rect>();
  const pEdge = createRef<Line>();
  const pDot = createRef<Circle>();
  const pServer = createRef<Rect>();
  const pX = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — write to a local store first, queue, then sync on reconnect
  const sPill = createRef<Layout>();
  const sApp = createRef<Rect>();
  const sLocal = createRef<Node>();
  const sOutbox = createRef<Rect>();
  const sServer = createRef<Rect>();
  const e1 = createRef<Line>();
  const d1 = createRef<Circle>();
  const e2 = createRef<Line>();
  const d2 = createRef<Circle>();
  const e3 = createRef<Line>();
  const d3 = createRef<Circle>();
  const sStats = createRef<Layout>();

  // ---- metric / state signals -----------------------------------------
  const pLost = createSignal(0);
  const queued = createSignal(0);
  const synced = createSignal(0);
  const connLabel = createSignal('OFFLINE');
  const connColor = createSignal(C.amber);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Offline "
        titleB="First"
        subtitle="the network is an enhancement, not a requirement"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — ONLINE ONLY (problem) ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="ONLINE ONLY"
        note="a dropped network loses the write"
        position={[-30, -660]}
      />

      <GlowNode ref={pApp} label="APP" accent={C.teal} width={180} height={110} position={[-330, -420]} />

      {/* APP -> SERVER, but the link is dead */}
      <FlowEdge lineRef={pEdge} dotRef={pDot} from={[-235, -420]} to={[250, -420]} color={C.coral} />

      <GlowNode ref={pServer} label="SERVER" accent={C.coral} width={200} height={110} position={[360, -420]} />

      {/* the "no network" break in the middle of the link */}
      <Node ref={pX} position={[60, -420]}>
        <Circle size={116} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-26, -26], [26, 26]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[26, -26], [-26, 26]]} stroke={C.coral} lineWidth={6} />
        <Txt text="NO NETWORK" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={1} y={90} />
      </Node>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="WRITES LOST" value={() => `${Math.round(pLost())}`} accent={C.coral} width={300} />
        <StatCard label="READS" value="spinner" accent={C.coral} width={300} />
        <StatCard label="STATE" value="offline = dead" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — LOCAL-FIRST (solution) ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="LOCAL-FIRST"
        note="write local · queue · sync on reconnect"
        position={[-10, 70]}
      />

      <GlowNode ref={sApp} label="APP" accent={C.teal} width={150} height={104} position={[-430, 360]} />

      {/* APP -> LOCAL store (instant, always available) */}
      <FlowEdge lineRef={e1} dotRef={d1} from={[-355, 360]} to={[-265, 360]} color={C.teal} />
      <DbNode ref={sLocal} label="LOCAL" sub="IndexedDB" accent={C.teal} width={150} height={170} position={[-185, 360]} />

      {/* LOCAL -> OUTBOX (durable queue of pending mutations) */}
      <FlowEdge lineRef={e2} dotRef={d2} from={[-105, 360]} to={[-5, 360]} color={C.teal} />
      <GlowNode ref={sOutbox} label="OUTBOX" accent={C.amber} width={150} height={104} fontSize={26} position={[70, 360]} />

      {/* OUTBOX -> SERVER (flushes when connectivity returns) */}
      <FlowEdge lineRef={e3} dotRef={d3} from={[145, 360]} to={[300, 360]} color={C.amber} />
      <GlowNode ref={sServer} label="SERVER" accent={C.muted} width={170} height={104} position={[395, 360]} />

      {/* connectivity status sitting over the sync link */}
      <Node position={[210, 290]}>
        <Circle size={14} fill={connColor} shadowColor={connColor} shadowBlur={12} x={-66} />
        <Txt text={connLabel} fill={connColor} fontFamily={F.mono} fontSize={22} letterSpacing={2} x={12} />
      </Node>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="QUEUED" value={() => `${Math.round(queued())}`} accent={C.amber} width={300} />
        <StatCard label="SYNCED" value={() => `${Math.round(synced())}`} accent={C.teal} width={300} />
        <StatCard label="WRITES LOST" value="0" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pApp, pServer, sApp, sOutbox, sServer]) r().scale(0);
  sLocal().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem ----------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(pApp().scale(1, 0.5, easeOutBack), pServer().scale(1, 0.5, easeOutBack));
  yield* pStats().opacity(1, 0.4);

  yield* pEdge().end(1, 0.35);
  yield* all(pX().scale(1, 0.5, easeOutBack), pX().opacity(1, 0.4));

  // writes leave the app, stall at the dead link, and are lost
  yield* all(
    pLost(6, 1.6),
    (function* () {
      for (let i = 0; i < 3; i++) {
        pDot().position([-235, -420]).opacity(1);
        yield* pDot().position([-20, -420], 0.45);
        pDot().opacity(0);
      }
    })(),
  );
  yield* waitFor(0.8);

  // STATE 2: solution ---------------------------------------------------
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sApp().scale(1, 0.5, easeOutBack),
    sLocal().scale(1, 0.55, easeOutBack),
    sOutbox().scale(1, 0.5, easeOutBack),
    sServer().scale(1, 0.5, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);
  yield* all(e1().end(1, 0.3), e2().end(1, 0.3), e3().end(1, 0.3));

  // --- OFFLINE: every write lands in local instantly and queues in the outbox ---
  connLabel('OFFLINE');
  connColor(C.amber);
  for (let i = 0; i < 3; i++) {
    d1().position([-355, 360]).opacity(1);
    yield* d1().position([-265, 360], 0.18);
    d1().opacity(0);
    d2().position([-105, 360]).opacity(1);
    yield* d2().position([-5, 360], 0.2);
    d2().opacity(0);
    queued(i + 1);
  }
  yield* waitFor(0.5);

  // --- RECONNECT: flip ONLINE and flush the outbox to the server ---
  connLabel('ONLINE');
  connColor(C.teal);
  yield* all(
    sServer().stroke(C.teal, 0.4),
    sServer().shadowColor(C.teal, 0.4),
    e3().stroke(C.teal, 0.4),
  );
  for (let i = 3; i > 0; i--) {
    d3().position([145, 360]).opacity(1);
    yield* d3().position([300, 360], 0.3);
    d3().opacity(0);
    queued(i - 1);
    synced(4 - i);
  }

  yield* waitFor(1.6);
});
