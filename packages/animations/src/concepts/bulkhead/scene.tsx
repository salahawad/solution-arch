import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, ServerNode, FlowEdge, StatCard, StatRow} from '../../components';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  // soft navy radial glow behind everything
  view.add(
    <Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — one shared thread pool feeds every dependency
  const pPill = createRef<Layout>();
  const pGw = createRef<Rect>();
  const pPool = createRef<Rect>();
  const pGwEdge = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pFanEdges = [
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
  ];
  const pSearch = createRef<Rect>();
  const pCheckout = createRef<Rect>();
  const pPayments = createRef<Rect>();
  const pStats = createRef<Layout>();

  // SOLUTION — a dedicated pool (bulkhead) per dependency, isolated lanes
  const sPill = createRef<Layout>();
  const sGw = createRef<Rect>();
  const sGwEdges = [
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
  ];
  const sLaneEdges = [
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
  ];
  const sPools = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sServers = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sWalls = [createRef<Rect>(), createRef<Rect>()];
  const sStats = createRef<Layout>();

  // ---- metric / color signals -----------------------------------------
  // problem panel: every server's load — they all starve together
  const pSearchLoad = createSignal(0);
  const pCheckoutLoad = createSignal(0);
  const pPaymentsLoad = createSignal(0);
  const pThreads = createSignal(0);
  // pool accent flips teal -> coral as the shared pool saturates
  const pPoolFill = createSignal(0);
  const pPoolAccent = () => (pPoolFill() > 0.5 ? C.coral : C.teal);

  // solution panel: per-lane loads — only Search burns
  const sSearchLoad = createSignal(0);
  const sCheckoutLoad = createSignal(0);
  const sPaymentsLoad = createSignal(0);

  // lane geometry (solution)
  const laneX = [-300, 0, 300];
  const laneNames = ['Search', 'Checkout', 'Payments'];
  const laneAccents = [C.coral, C.teal, C.teal];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Bulkhead "
        titleB="Isolation"
        subtitle="one slow dependency shouldn't drain every thread"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — one shared thread pool ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="SHARED POOL"
        note="one pool — slow Search starves the rest"
        position={[-10, -650]}
      />

      <GlowNode ref={pGw} label="GATEWAY" accent={C.teal} width={240} height={88} fontSize={26} position={[0, -560]} />

      {/* GATEWAY -> SHARED POOL */}
      <FlowEdge lineRef={pGwEdge.line} dotRef={pGwEdge.dot} from={[0, -516]} to={[0, -505]} color={C.teal} />

      {/* the one pool every dependency draws from — turns coral as it saturates */}
      <GlowNode ref={pPool} label="SHARED POOL" accent={pPoolAccent} labelColor={C.text} width={300} height={84} fontSize={26} position={[0, -470]} />

      {/* SHARED POOL fans out to all three downstream services */}
      {pFanEdges.map((e, i) => (
        <FlowEdge lineRef={e.line} dotRef={e.dot} from={[0, -428]} to={[laneX[i], -396]} color={C.coral} />
      ))}

      {/* the three downstream services — all share the same pool, so all starve */}
      <ServerNode ref={pSearch} name="Search" load={pSearchLoad} position={[-300, -360]} width={270} fontSize={26} />
      <ServerNode ref={pCheckout} name="Checkout" load={pCheckoutLoad} position={[0, -360]} width={270} fontSize={26} />
      <ServerNode ref={pPayments} name="Payments" load={pPaymentsLoad} position={[300, -360]} width={270} fontSize={26} />

      <StatRow ref={pStats} position={[0, -150]} gap={22}>
        <StatCard label="THREADS" value={() => `${Math.round(pThreads())}/100`} accent={C.coral} width={300} />
        <StatCard label="CHECKOUT" value="down" accent={C.coral} width={300} />
        <StatCard label="PAYMENTS" value="down" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — a pool per dependency ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="BULKHEADS"
        note="a pool per dependency — Search burns alone"
        position={[-10, 70]}
      />

      <GlowNode ref={sGw} label="GATEWAY" accent={C.teal} width={240} height={88} fontSize={26} position={[0, 150]} />

      {/* isolation walls between the three lanes */}
      <Rect ref={sWalls[0]} size={[3, 460]} fill={C.panelBorder} position={[-150, 410]} opacity={0.6} />
      <Rect ref={sWalls[1]} size={[3, 460]} fill={C.panelBorder} position={[150, 410]} opacity={0.6} />

      {/* GATEWAY -> each lane's dedicated pool */}
      {sGwEdges.map((e, i) => (
        <FlowEdge lineRef={e.line} dotRef={e.dot} from={[0, 194]} to={[laneX[i], 258]} color={laneAccents[i]} />
      ))}

      {/* per-lane: a dedicated pool feeding its own server */}
      {laneX.map((x, i) => (
        <GlowNode ref={sPools[i]} label="pool" accent={laneAccents[i]} labelColor={C.muted} width={270} height={80} fontSize={24} position={[x, 300]} />
      ))}

      {/* pool -> server within each isolated lane */}
      {sLaneEdges.map((e, i) => (
        <FlowEdge lineRef={e.line} dotRef={e.dot} from={[laneX[i], 342]} to={[laneX[i], 426]} color={laneAccents[i]} />
      ))}

      {laneNames.map((name, i) => (
        <ServerNode ref={sServers[i]} name={name} load={[sSearchLoad, sCheckoutLoad, sPaymentsLoad][i]} position={[laneX[i], 470]} width={270} fontSize={26} />
      ))}

      <StatRow ref={sStats} position={[0, 720]} gap={22}>
        <StatCard label="SEARCH" value="degraded" accent={C.amber} width={300} />
        <StatCard label="CHECKOUT" value="OK" accent={C.teal} width={300} />
        <StatCard label="PAYMENTS" value="OK" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pGw, pPool, pSearch, pCheckout, pPayments, sGw]) r().scale(0);
  for (const r of sPools) r().scale(0);
  for (const r of sServers) r().scale(0);
  for (const r of sWalls) r().opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: gateway + one shared pool fan out to three services -------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pGw().scale(1, 0.45, easeOutBack),
    pPool().scale(1, 0.5, easeOutBack),
  );
  yield* pGwEdge.line().end(1, 0.3);
  yield* all(
    pSearch().scale(1, 0.45, easeOutBack),
    pCheckout().scale(1, 0.45, easeOutBack),
    pPayments().scale(1, 0.45, easeOutBack),
  );
  yield* all(...pFanEdges.map(e => e.line().end(1, 0.3)));
  yield* pStats().opacity(1, 0.4);

  // a request enters; Search hangs — its dot crawls and stalls partway
  pGwEdge.dot().position([0, -516]).opacity(1);
  yield* pGwEdge.dot().position([0, -505], 0.25);
  pGwEdge.dot().opacity(0);
  // a call leaves toward Search but hangs (dot stalls before arriving)
  pFanEdges[0].dot().position([0, -428]).opacity(1);
  yield* pFanEdges[0].dot().position([-150, -412], 0.7);
  pFanEdges[0].dot().opacity(0);

  // Search saturates first, the shared pool fills coral, and because every
  // dependency draws from the SAME pool, ALL three loads climb to 100
  yield* all(pSearchLoad(100, 0.9), pPoolFill(1, 0.9));
  yield* all(
    pCheckoutLoad(100, 1.2),
    pPaymentsLoad(100, 1.2),
    pThreads(100, 1.2),
  );
  yield* waitFor(0.9);

  // SOLUTION: gateway + three isolated lanes, each with its own pool -----
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sGw().scale(1, 0.45, easeOutBack),
    sWalls[0]().opacity(0.6, 0.4),
    sWalls[1]().opacity(0.6, 0.4),
  );
  yield* all(...sPools.map(r => r().scale(1, 0.45, easeOutBack)));
  yield* all(...sGwEdges.map(e => e.line().end(1, 0.3)));
  yield* all(...sServers.map(r => r().scale(1, 0.45, easeOutBack)));
  yield* all(...sLaneEdges.map(e => e.line().end(1, 0.3)));
  yield* sStats().opacity(1, 0.4);

  // ramp loads: Search burns alone (coral, 100), the other lanes stay healthy
  yield* all(
    sSearchLoad(100, 1.0),
    sCheckoutLoad(40, 1.0),
    sPaymentsLoad(42, 1.0),
  );

  // tint the healthy lanes teal so the settled frame reads "two green, one red"
  yield* all(
    sServers[1]().fill(`${C.teal}22`, 0.4),
    sServers[2]().fill(`${C.teal}22`, 0.4),
  );

  // traffic flows: each lane carries its own dots independently. Search's
  // dot stalls (it's saturated) while Checkout & Payments complete normally.
  for (let i = 0; i < 3; i++) {
    sGwEdges[1].dot().position([0, 194]).opacity(1);
    sGwEdges[2].dot().position([0, 194]).opacity(1);
    yield* all(
      sGwEdges[1].dot().position([laneX[1], 258], 0.25),
      sGwEdges[2].dot().position([laneX[2], 258], 0.25),
    );
    sGwEdges[1].dot().opacity(0);
    sGwEdges[2].dot().opacity(0);
    sLaneEdges[1].dot().position([laneX[1], 342]).opacity(1);
    sLaneEdges[2].dot().position([laneX[2], 342]).opacity(1);
    yield* all(
      sLaneEdges[1].dot().position([laneX[1], 426], 0.22),
      sLaneEdges[2].dot().position([laneX[2], 426], 0.22),
    );
    sLaneEdges[1].dot().opacity(0);
    sLaneEdges[2].dot().opacity(0);
    // Search lane: a call leaves the gateway but stalls in its own pool
    if (i === 1) {
      sGwEdges[0].dot().position([0, 194]).opacity(1);
      yield* sGwEdges[0].dot().position([laneX[0], 258], 0.25);
      sGwEdges[0].dot().opacity(0);
      sLaneEdges[0].dot().position([laneX[0], 342]).opacity(1);
      yield* sLaneEdges[0].dot().position([laneX[0], 384], 0.5);
      sLaneEdges[0].dot().opacity(0);
    }
  }

  yield* waitFor(1.8);
});
