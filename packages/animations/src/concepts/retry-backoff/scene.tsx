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
  ServerNode,
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

  // PROBLEM — retry storm
  const pPill = createRef<Layout>();
  const pStats = createRef<Layout>();
  const pClient = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const pEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const pBLoad = createSignal(0);
  const pB = createRef<Rect>();

  // SOLUTION — exponential backoff + jitter
  const sPill = createRef<Layout>();
  const sStats = createRef<Layout>();
  const sClient = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const sBLoad = createSignal(0);
  const sB = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();

  // ---- metric signals --------------------------------------------------
  const pRetry = createSignal(0);
  const sJitter = createSignal(0);

  // client vertical positions in each panel
  const pCliY = [-660, -540, -420, -300];
  const sCliY = [120, 250, 380, 510];
  const pBY = -480; // recovering server in problem panel
  const sBY = 315; // recovering server in solution panel

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Retry "
        titleB="Backoff"
        subtitle="smooth retries so they don’t become a stampede"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — RETRY STORM (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="RETRY STORM" note="all clients retry at once — in lockstep" position={[-30, -680]} />

      <GlowNode ref={pClient[0]} label="client-1" accent={C.coral} width={210} height={84} fontSize={26} position={[-360, pCliY[0]]} />
      <GlowNode ref={pClient[1]} label="client-2" accent={C.coral} width={210} height={84} fontSize={26} position={[-360, pCliY[1]]} />
      <GlowNode ref={pClient[2]} label="client-3" accent={C.coral} width={210} height={84} fontSize={26} position={[-360, pCliY[2]]} />
      <GlowNode ref={pClient[3]} label="client-4" accent={C.coral} width={210} height={84} fontSize={26} position={[-360, pCliY[3]]} />

      <ServerNode ref={pB} name="B" load={pBLoad} position={[360, pBY]} width={290} />

      <FlowEdge lineRef={pEdgeLine[0]} dotRef={pEdgeDot[0]} from={[-255, pCliY[0]]} to={[225, pBY]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[1]} dotRef={pEdgeDot[1]} from={[-255, pCliY[1]]} to={[225, pBY]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[2]} dotRef={pEdgeDot[2]} from={[-255, pCliY[2]]} to={[225, pBY]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[3]} dotRef={pEdgeDot[3]} from={[-255, pCliY[3]]} to={[225, pBY]} color={C.coral} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="RETRIES" value="5× sync" accent={C.coral} width={300} />
        <StatCard label="LOAD" value="10×" accent={C.coral} width={300} />
        <StatCard label="B" value="down" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — BACKOFF + JITTER (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="BACKOFF + JITTER" note="retries spread over 1·2·4s ± random" position={[-30, 70]} />

      <GlowNode ref={sClient[0]} label="client-1" accent={C.teal} width={210} height={84} fontSize={26} position={[-360, sCliY[0]]} />
      <GlowNode ref={sClient[1]} label="client-2" accent={C.teal} width={210} height={84} fontSize={26} position={[-360, sCliY[1]]} />
      <GlowNode ref={sClient[2]} label="client-3" accent={C.teal} width={210} height={84} fontSize={26} position={[-360, sCliY[2]]} />
      <GlowNode ref={sClient[3]} label="client-4" accent={C.teal} width={210} height={84} fontSize={26} position={[-360, sCliY[3]]} />

      <Node position={[360, sBY]}>
        <Circle ref={ring} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
        <Circle ref={ring2} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
      </Node>
      <ServerNode ref={sB} name="B" load={sBLoad} position={[360, sBY]} width={290} />

      <FlowEdge lineRef={sEdgeLine[0]} dotRef={sEdgeDot[0]} from={[-255, sCliY[0]]} to={[225, sBY]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[1]} dotRef={sEdgeDot[1]} from={[-255, sCliY[1]]} to={[225, sBY]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[2]} dotRef={sEdgeDot[2]} from={[-255, sCliY[2]]} to={[225, sBY]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[3]} dotRef={sEdgeDot[3]} from={[-255, sCliY[3]]} to={[225, sBY]} color={C.teal} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="BACKOFF" value="1·2·4s" accent={C.teal} width={300} />
        <StatCard label="JITTER" value={() => `± ${Math.round(sJitter())}%`} accent={C.amber} width={300} />
        <StatCard label="LOAD" value="1.2×" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pB, sB]) r().scale(0);
  for (const r of [...pClient, ...sClient]) r().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: retry storm -------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pClient[0]().scale(1, 0.4, easeOutBack),
    pClient[1]().scale(1, 0.4, easeOutBack),
    pClient[2]().scale(1, 0.4, easeOutBack),
    pClient[3]().scale(1, 0.4, easeOutBack),
  );
  yield* pB().scale(1, 0.5, easeOutBack);
  yield* all(
    pEdgeLine[0]().end(1, 0.35),
    pEdgeLine[1]().end(1, 0.35),
    pEdgeLine[2]().end(1, 0.35),
    pEdgeLine[3]().end(1, 0.35),
  );
  yield* pStats().opacity(1, 0.4);

  // synchronized retry waves — every client fires in lockstep, B spikes
  for (let wave = 0; wave < 3; wave++) {
    for (let i = 0; i < 4; i++) {
      pEdgeDot[i]().position([-255, pCliY[i]]).opacity(1);
    }
    yield* all(
      pBLoad(100, 0.45, easeOutCubic),
      pRetry(wave + 1, 0.45),
      pEdgeDot[0]().position([225, pBY], 0.45),
      pEdgeDot[1]().position([225, pBY], 0.45),
      pEdgeDot[2]().position([225, pBY], 0.45),
      pEdgeDot[3]().position([225, pBY], 0.45),
    );
    for (let i = 0; i < 4; i++) pEdgeDot[i]().opacity(0);
    // B is hammered back down — never recovers between synchronized waves
    yield* pBLoad(88, 0.35);
  }
  yield* waitFor(0.7);

  // STATE 2: backoff + jitter -------------------------------------------
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(
    sClient[0]().scale(1, 0.4, easeOutBack),
    sClient[1]().scale(1, 0.4, easeOutBack),
    sClient[2]().scale(1, 0.4, easeOutBack),
    sClient[3]().scale(1, 0.4, easeOutBack),
  );
  yield* sB().scale(1, 0.5, easeOutBack);
  yield* all(
    sEdgeLine[0]().end(1, 0.35),
    sEdgeLine[1]().end(1, 0.35),
    sEdgeLine[2]().end(1, 0.35),
    sEdgeLine[3]().end(1, 0.35),
  );
  yield* sStats().opacity(1, 0.4);
  yield* all(sJitter(25, 1.0), sBLoad(20, 1.0));

  // staggered retries: exponential backoff (1·2·4s) with random jitter,
  // so each client arrives at a different time and B stays healthy.
  const delays = [0.0, 0.32, 0.18, 0.5]; // jittered offsets per client
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 4; i++) {
      yield* waitFor(delays[i]);
      const from = new Vector2([-255, sCliY[i]]);
      const to = new Vector2([225, sBY]);
      sEdgeDot[i]().position(from).opacity(1);
      // a single request lands; B takes a gentle, brief bump then settles
      yield* all(
        sEdgeDot[i]().position(to, 0.34),
        sBLoad(28, 0.34).to(20, 0.2),
      );
      sEdgeDot[i]().opacity(0);
    }
  }

  // both panels settled — this final frame is the poster
  yield* sBLoad(20, 0.4);
  yield* waitFor(1.6);
});
