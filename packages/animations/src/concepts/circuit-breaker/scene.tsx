import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
  spawn,
  Vector2,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {
  TitleBlock,
  SectionPill,
  GlowNode,
  BalancerNode,
  FlowEdge,
  StatCard,
  StatRow,
  pulseSonar,
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

  // PROBLEM panel
  const pPill = createRef<Layout>();
  const pReq = createRef<Rect>();
  const pA = createRef<Rect>();
  const pB = createRef<Rect>();
  const pReqEdge = createRef<Line>();
  const pReqDot = createRef<Circle>();
  const pAbEdge = createRef<Line>();
  const pAbDot = createRef<Circle>();
  const pX = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION panel
  const sPill = createRef<Layout>();
  const sReq = createRef<Rect>();
  const sA = createRef<Rect>();
  const sB = createRef<Rect>();
  const brk = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sReqEdge = createRef<Line>();
  const sReqDot = createRef<Circle>();
  const sAbEdge = createRef<Line>();
  const sAbDot = createRef<Circle>();
  const sBkEdge = createRef<Line>();
  const sBkDot = createRef<Circle>();
  const sStats = createRef<Layout>();

  // ---- metric / color signals -----------------------------------------
  // problem panel: A's accent shifts teal -> coral as its threads fill
  const pAfill = createSignal(0); // 0 = teal, 1 = coral
  const pErr = createSignal(0);
  const pThreads = createSignal(0);

  const pAaccent = () => (pAfill() > 0.5 ? C.coral : C.teal);

  // solution panel: breaker state label color
  const brkAccent = createSignal(C.coral); // OPEN = coral, then teal on recover
  const brkLabel = createSignal('OPEN');

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Circuit "
        titleB="Breaker"
        subtitle="stop a failing call from taking everyone down"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — CASCADING FAILURE (problem) ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="NO BREAKER"
        note="B is down, so A blocks and dies too"
        position={[-40, -660]}
      />

      <GlowNode ref={pReq} label="REQUESTS" accent={C.teal} width={210} height={92} position={[-380, -420]} />

      {/* REQUESTS -> A */}
      <FlowEdge lineRef={pReqEdge} dotRef={pReqDot} from={[-275, -420]} to={[-95, -420]} color={C.teal} />

      {/* Service A — turns coral as its thread pool fills */}
      <GlowNode ref={pA} label="A" accent={pAaccent} width={150} height={120} fontSize={48} position={[10, -420]} />

      {/* A -> B (blocked) */}
      <FlowEdge lineRef={pAbEdge} dotRef={pAbDot} from={[85, -420]} to={[280, -420]} color={C.coral} />

      {/* Dependency B — down (coral) */}
      <GlowNode ref={pB} label="B" accent={C.coral} width={150} height={120} fontSize={48} position={[365, -420]} />

      {/* the "down" X over the A->B link */}
      <Node ref={pX} position={[185, -420]}>
        <Circle size={108} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-24, -24], [24, 24]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[24, -24], [-24, 24]]} stroke={C.coral} lineWidth={6} />
        <Txt text="B DOWN" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} y={84} />
      </Node>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="ERRORS" value={() => `${Math.round(pErr())}%`} accent={C.coral} width={300} />
        <StatCard label="P99" value="30s" accent={C.coral} width={300} />
        <StatCard label="THREADS" value={() => `${Math.round(pThreads())}/100`} accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — CIRCUIT BREAKER (solution) ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="BREAKER"
        note="trip OPEN, fail fast, probe, then CLOSE on recovery"
        position={[-10, 70]}
      />

      <GlowNode ref={sReq} label="REQUESTS" accent={C.teal} width={210} height={88} position={[-410, 360]} />

      {/* REQUESTS -> A */}
      <FlowEdge lineRef={sReqEdge} dotRef={sReqDot} from={[-305, 360]} to={[-270, 360]} color={C.teal} />

      {/* Service A — stays healthy */}
      <GlowNode ref={sA} label="A" accent={C.teal} width={130} height={120} fontSize={48} position={[-200, 360]} />

      {/* A -> BREAKER */}
      <FlowEdge lineRef={sAbEdge} dotRef={sAbDot} from={[-135, 360]} to={[-40, 360]} color={C.teal} />

      {/* the breaker, central with sonar rings (HALF-OPEN probe) */}
      <BalancerNode ref={brk} ringRef={ring} ring2Ref={ring2} position={[80, 360]} label={brkLabel} sub="circuit breaker" />

      {/* BREAKER -> B */}
      <FlowEdge lineRef={sBkEdge} dotRef={sBkDot} from={[200, 360]} to={[330, 360]} color={C.amber} />

      {/* Dependency B */}
      <GlowNode ref={sB} label="B" accent={C.coral} width={130} height={120} fontSize={48} position={[400, 360]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="STATE" value={brkLabel} accent={brkAccent} width={300} />
        <StatCard label="FAIL-FAST" value="2ms" accent={C.teal} width={300} />
        <StatCard label="RECOVERED" value="yes" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pReq, pA, pB, sReq, sA, sB, brk]) r().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem ----------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pReq().scale(1, 0.5, easeOutBack),
    pA().scale(1, 0.5, easeOutBack),
    pB().scale(1, 0.5, easeOutBack),
  );
  yield* pStats().opacity(1, 0.4);

  // draw REQUESTS -> A, send a couple of dots through
  yield* pReqEdge().end(1, 0.35);
  for (let i = 0; i < 2; i++) {
    pReqDot().position([-275, -420]).opacity(1);
    yield* pReqDot().position([-95, -420], 0.4);
    pReqDot().opacity(0);
  }

  // draw A -> B; calls leave but hang against a dead B (dot stalls), and the X appears
  yield* pAbEdge().end(1, 0.35);
  yield* all(pX().scale(1, 0.5, easeOutBack), pX().opacity(1, 0.4));

  // calls block: dots crawl toward B and stall at the failure point
  for (let i = 0; i < 2; i++) {
    pAbDot().position([85, -420]).opacity(1);
    yield* pAbDot().position([175, -420], 0.7);
    pAbDot().opacity(0);
  }

  // A's threads fill and it turns coral; errors climb to 100%
  yield* all(
    pErr(100, 1.4),
    pThreads(100, 1.4),
    pAfill(1, 1.0),
  );
  yield* waitFor(0.9);

  // STATE 2: solution ---------------------------------------------------
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sReq().scale(1, 0.5, easeOutBack),
    sA().scale(1, 0.5, easeOutBack),
    brk().scale(1, 0.6, easeOutBack),
    sB().scale(1, 0.5, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  // draw the chain REQUESTS -> A -> BREAKER -> B
  yield* all(sReqEdge().end(1, 0.3), sAbEdge().end(1, 0.3), sBkEdge().end(1, 0.3));

  // --- OPEN: breaker trips, calls fail fast (never reach B) ---
  brkLabel('OPEN');
  brkAccent(C.coral);
  for (let i = 0; i < 3; i++) {
    sReqDot().position([-305, 360]).opacity(1);
    yield* sReqDot().position([-270, 360], 0.22);
    sReqDot().opacity(0);
    // dot bounces back off the breaker instead of crossing to B (fail fast)
    sAbDot().position([-135, 360]).opacity(1);
    yield* sAbDot().position([-80, 360], 0.16);
    yield* sAbDot().position([-135, 360], 0.16);
    sAbDot().opacity(0);
  }

  yield* waitFor(0.5);

  // --- HALF-OPEN: a single probe is allowed through to B ---
  brkLabel('HALF-OPEN');
  brkAccent(C.amber);
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  // probe dot travels all the way to B and B recovers (turns teal)
  sBkDot().position([200, 360]).opacity(1);
  yield* sBkDot().position([330, 360], 0.5);
  sBkDot().opacity(0);
  yield* all(sB().stroke(C.teal, 0.5), sB().shadowColor(C.teal, 0.5), sBkEdge().stroke(C.teal, 0.5));

  yield* waitFor(0.4);

  // --- CLOSED: traffic flows normally end to end ---
  brkLabel('CLOSED');
  brkAccent(C.teal);
  for (let i = 0; i < 2; i++) {
    sReqDot().position([-305, 360]).opacity(1);
    yield* sReqDot().position([-270, 360], 0.2);
    sReqDot().opacity(0);
    sAbDot().position([-135, 360]).opacity(1);
    yield* sAbDot().position([-40, 360], 0.18);
    sAbDot().opacity(0);
    sBkDot().position([200, 360]).opacity(1);
    yield* sBkDot().position([330, 360], 0.22);
    sBkDot().opacity(0);
  }

  yield* waitFor(1.6);
});
