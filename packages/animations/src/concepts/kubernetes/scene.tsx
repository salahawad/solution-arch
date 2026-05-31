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

  // PROBLEM panel — a fragile workload: one replica, no limits, no probes
  const pPill = createRef<Layout>();
  const pTraf = createRef<Rect>();
  const pEdge = createRef<Line>();
  const pDot = createRef<Circle>();
  const pPod = createRef<Rect>();
  const pX = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION panel — replicas, limits, probes, a Service that routes to Ready pods only
  const sPill = createRef<Layout>();
  const sTraf = createRef<Rect>();
  const sEdge = createRef<Line>();
  const sDot = createRef<Circle>();
  const svc = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const pod = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const sStats = createRef<Layout>();

  // ---- metric / color signals -----------------------------------------
  // problem pod: accent shifts teal -> coral as it OOMs and crash-loops
  const pPodFill = createSignal(0); // 0 = teal, 1 = coral
  const pRestarts = createSignal(0);
  const pPodAccent = () => (pPodFill() > 0.5 ? C.coral : C.teal);

  // solution: pod-b starts NotReady (amber) then passes its readiness probe (teal)
  const podBAccent = createSignal(C.amber);

  // pod fan-out anchor points on the right
  const podY = [230, 360, 490];
  const podX = [330, 430, 330];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Kubernetes"
        subtitle="the design mistakes that take clusters down"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — FRAGILE WORKLOAD (problem) ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="FRAGILE"
        note="1 replica · no limits · no probes"
        position={[0, -660]}
      />

      <GlowNode ref={pTraf} label="TRAFFIC" accent={C.teal} width={210} height={92} position={[-380, -420]} />

      {/* TRAFFIC -> single pod */}
      <FlowEdge lineRef={pEdge} dotRef={pDot} from={[-275, -420]} to={[-95, -420]} color={C.coral} />

      {/* the one and only pod — turns coral as it OOMs */}
      <GlowNode ref={pPod} label="POD ×1" accent={pPodAccent} width={170} height={120} fontSize={34} position={[0, -420]} />

      {/* OOMKilled / CrashLoopBackOff — with one replica this is an outage */}
      <Node ref={pX} position={[235, -420]}>
        <Circle size={108} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-24, -24], [24, 24]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[24, -24], [-24, 24]]} stroke={C.coral} lineWidth={6} />
        <Txt text="OOMKilled" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={1} y={84} />
      </Node>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="REPLICAS" value="1 / 1" accent={C.coral} width={300} />
        <StatCard label="RESTARTS" value={() => `${Math.round(pRestarts())}`} accent={C.coral} width={300} />
        <StatCard label="STATUS" value="CrashLoop" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — RESILIENT WORKLOAD (solution) ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="RESILIENT"
        note="replicas · limits · probes · PDB"
        position={[-10, 70]}
      />

      <GlowNode ref={sTraf} label="TRAFFIC" accent={C.teal} width={210} height={88} position={[-410, 360]} />

      {/* TRAFFIC -> Service */}
      <FlowEdge lineRef={sEdge} dotRef={sDot} from={[-305, 360]} to={[-160, 360]} color={C.teal} />

      {/* the Service load-balances, but only across Ready pods */}
      <BalancerNode ref={svc} ringRef={ring} ring2Ref={ring2} position={[-30, 360]} label="SERVICE" sub="ready pods only" />

      {/* Service -> 3 pods, spread across nodes (anti-affinity) */}
      <FlowEdge lineRef={sEdgeLine[0]} dotRef={sEdgeDot[0]} from={[95, 320]} to={[245, podY[0]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[1]} dotRef={sEdgeDot[1]} from={[95, 360]} to={[345, podY[1]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[2]} dotRef={sEdgeDot[2]} from={[95, 400]} to={[245, podY[2]]} color={C.teal} />

      <GlowNode ref={pod[0]} label="pod-a" accent={C.teal} width={150} height={104} fontSize={30} position={[podX[0], podY[0]]} />
      <GlowNode ref={pod[1]} label="pod-b" accent={podBAccent} width={150} height={104} fontSize={30} position={[podX[1], podY[1]]} />
      <GlowNode ref={pod[2]} label="pod-c" accent={C.teal} width={150} height={104} fontSize={30} position={[podX[2], podY[2]]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="REPLICAS" value="3 / 3" accent={C.teal} width={300} />
        <StatCard label="PROBES" value="ready" accent={C.teal} width={300} />
        <StatCard label="UPTIME" value="99.9%" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pTraf, pPod, sTraf, svc, ...pod]) r().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem ----------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pTraf().scale(1, 0.5, easeOutBack),
    pPod().scale(1, 0.5, easeOutBack),
  );
  yield* pStats().opacity(1, 0.4);

  // draw TRAFFIC -> pod, send a couple of requests through
  yield* pEdge().end(1, 0.35);
  for (let i = 0; i < 2; i++) {
    pDot().position([-275, -420]).opacity(1);
    yield* pDot().position([-95, -420], 0.4);
    pDot().opacity(0);
  }

  // no memory limit: the pod balloons, gets OOMKilled and crash-loops; with one replica
  // every restart is downtime
  yield* all(
    pPodFill(1, 1.0),
    pRestarts(7, 1.4),
    pX().scale(1, 0.5, easeOutBack),
    pX().opacity(1, 0.4),
  );
  yield* waitFor(0.9);

  // STATE 2: solution ---------------------------------------------------
  spawn(pulseSonar(ring()));
  yield* waitFor(0.3);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(
    sTraf().scale(1, 0.5, easeOutBack),
    svc().scale(1, 0.6, easeOutBack),
    pod[0]().scale(1, 0.45, easeOutBack),
    pod[1]().scale(1, 0.45, easeOutBack),
    pod[2]().scale(1, 0.45, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  // draw TRAFFIC -> SERVICE -> pods
  yield* sEdge().end(1, 0.3);
  yield* all(sEdgeLine[0]().end(1, 0.35), sEdgeLine[1]().end(1, 0.35), sEdgeLine[2]().end(1, 0.35));

  // pod-b is still NotReady (amber): the Service must NOT send it traffic yet
  for (let pass = 0; pass < 2; pass++) {
    sDot().position([-305, 360]).opacity(1);
    yield* sDot().position([-160, 360], 0.24);
    sDot().opacity(0);
    // fan out to the two Ready pods only (a and c)
    for (const i of [0, 2]) {
      sEdgeDot[i]().position([95, 320 + i * 40]).opacity(1);
      yield* sEdgeDot[i]().position(new Vector2([i === 1 ? 345 : 245, podY[i]]), 0.3);
      sEdgeDot[i]().opacity(0);
    }
    // a request aimed at pod-b stalls — readiness gate holds it back
    sEdgeDot[1]().position([95, 360]).opacity(1);
    yield* sEdgeDot[1]().position([210, 360], 0.18);
    yield* sEdgeDot[1]().position([95, 360], 0.18);
    sEdgeDot[1]().opacity(0);
  }

  yield* waitFor(0.4);

  // pod-b passes its readiness probe and joins the rotation. accent drives the pod's
  // stroke, glow and label together, so flipping the signal turns it teal in one move.
  podBAccent(C.teal);
  yield* waitFor(0.3);

  // now traffic spreads evenly across all three replicas
  for (let pass = 0; pass < 2; pass++) {
    sDot().position([-305, 360]).opacity(1);
    yield* sDot().position([-160, 360], 0.2);
    sDot().opacity(0);
    for (let i = 0; i < 3; i++) {
      sEdgeDot[i]().position([95, 320 + i * 40]).opacity(1);
      yield* sEdgeDot[i]().position(new Vector2([i === 1 ? 345 : 245, podY[i]]), 0.22);
      sEdgeDot[i]().opacity(0);
    }
  }

  yield* waitFor(1.6);
});
