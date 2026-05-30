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

  const pPill = createRef<Layout>();
  const pReq = createRef<Rect>();
  const pX = createRef<Node>();
  const pEdgeLine = createRef<Line>();
  const pEdgeDot = createRef<Circle>();
  const pStats = createRef<Layout>();
  const pWeb = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pLoad = [createSignal(0), createSignal(0), createSignal(0)];

  const sPill = createRef<Layout>();
  const sReq = createRef<Rect>();
  const bal = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sStats = createRef<Layout>();
  const sWeb = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sLoad = [createSignal(0), createSignal(0), createSignal(0)];
  const sReqEdge = createRef<Line>();
  const sReqDot = createRef<Circle>();
  const sEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];

  // ---- metric signals --------------------------------------------------
  const pReqN = createSignal(0);
  const pServed = createSignal(0);
  const pDropped = createSignal(0);
  const sReqN = createSignal(0);

  const pWebY = [-560, -440, -320];
  const sWebY = [230, 360, 490];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Load "
        titleB="Balancing"
        subtitle="why one server melts while the others sit idle"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — NO BALANCER (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="NO BALANCER" note="every request slams one box" position={[-70, -660]} />

      <GlowNode ref={pReq} label="REQUESTS" accent={C.teal} width={230} height={92} position={[-370, -440]} />

      {/* the "no balancer" X */}
      <Node ref={pX} position={[0, -440]}>
        <Circle size={120} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-26, -26], [26, 26]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[26, -26], [-26, 26]]} stroke={C.coral} lineWidth={6} />
        <Txt text="NO BALANCER" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} y={92} />
      </Node>

      <FlowEdge lineRef={pEdgeLine} dotRef={pEdgeDot} from={[-250, -440]} to={[245, -440]} color={C.coral} />

      <ServerNode ref={pWeb[0]} name="web-1" load={pLoad[0]} position={[375, pWebY[0]]} />
      <ServerNode ref={pWeb[1]} name="web-2" load={pLoad[1]} position={[375, pWebY[1]]} />
      <ServerNode ref={pWeb[2]} name="web-3" load={pLoad[2]} position={[375, pWebY[2]]} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="REQUESTS" value={() => `${Math.round(pReqN())} of 9`} width={300} />
        <StatCard label="SERVED" value={() => `${Math.round(pServed())} (cap 3)`} accent={C.teal} width={300} />
        <StatCard label="DROPPED" value={() => `${Math.round(pDropped())}`} accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — ROUND ROBIN (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="ROUND ROBIN" note="the balancer takes turns 1 → 2 → 3" position={[-30, 70]} />

      <GlowNode ref={sReq} label="REQUESTS" accent={C.teal} width={220} height={88} position={[-400, 360]} />
      <Line ref={sReqEdge} points={[[-290, 360], [-160, 360]]} stroke={C.teal} lineWidth={3} opacity={0.5} lineDash={[2, 12]} end={0} />
      <Circle ref={sReqDot} size={18} fill={C.teal} shadowColor={C.teal} shadowBlur={16} position={[-290, 360]} opacity={0} />

      <BalancerNode ref={bal} ringRef={ring} ring2Ref={ring2} position={[-30, 360]} label="LOAD BALANCER" sub="round-robin" />

      <FlowEdge lineRef={sEdgeLine[0]} dotRef={sEdgeDot[0]} from={[95, 320]} to={[255, sWebY[0]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[1]} dotRef={sEdgeDot[1]} from={[95, 360]} to={[255, sWebY[1]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[2]} dotRef={sEdgeDot[2]} from={[95, 400]} to={[255, sWebY[2]]} color={C.teal} />

      <ServerNode ref={sWeb[0]} name="web-1" load={sLoad[0]} position={[380, sWebY[0]]} />
      <ServerNode ref={sWeb[1]} name="web-2" load={sLoad[1]} position={[380, sWebY[1]]} />
      <ServerNode ref={sWeb[2]} name="web-3" load={sLoad[2]} position={[380, sWebY[2]]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="REQUESTS" value={() => `${Math.round(sReqN())} of 9`} accent={C.teal} width={300} />
        <StatCard label="SERVED" value="evenly" accent={C.teal} width={300} />
        <StatCard label="DROPPED" value="0" width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pReq, sReq, bal]) r().scale(0);
  for (const r of [...pWeb, ...sWeb]) r().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem
  yield* pPill().opacity(1, 0.4);
  yield* all(pReq().scale(1, 0.5, easeOutBack), pX().scale(1, 0.5, easeOutBack).to(1, 0));
  yield* pX().opacity(1, 0.3);
  yield* all(
    pWeb[0]().scale(1, 0.4, easeOutBack),
    pWeb[1]().scale(1, 0.4, easeOutBack),
    pWeb[2]().scale(1, 0.4, easeOutBack),
  );
  yield* pStats().opacity(1, 0.4);

  // everything piles onto web-2
  yield* pEdgeLine().end(1, 0.4);
  yield* all(pReqN(9, 1.4), pServed(3, 1.0), pDropped(6, 1.4), pLoad[1](100, 1.4));
  for (let i = 0; i < 2; i++) {
    pEdgeDot().position([-250, -440]).opacity(1);
    yield* pEdgeDot().position([245, -440], 0.5);
    pEdgeDot().opacity(0);
  }
  yield* waitFor(0.8);

  // STATE 2: solution
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(sReq().scale(1, 0.5, easeOutBack), bal().scale(1, 0.6, easeOutBack));
  yield* sReqEdge().end(1, 0.3);
  yield* all(
    sWeb[0]().scale(1, 0.4, easeOutBack),
    sWeb[1]().scale(1, 0.4, easeOutBack),
    sWeb[2]().scale(1, 0.4, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  yield* all(sEdgeLine[0]().end(1, 0.35), sEdgeLine[1]().end(1, 0.35), sEdgeLine[2]().end(1, 0.35));
  yield* all(
    sReqN(9, 1.4),
    sLoad[0](33, 1.4),
    sLoad[1](33, 1.4),
    sLoad[2](33, 1.4),
  );
  // round-robin: a request arrives at the balancer, then is routed to the next server
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 3; i++) {
      sReqDot().position([-290, 360]).opacity(1);
      yield* sReqDot().position([-160, 360], 0.26);
      sReqDot().opacity(0);
      const from = new Vector2([95, 320 + i * 40]);
      const to = new Vector2([255, sWebY[i]]);
      sEdgeDot[i]().position(from).opacity(1);
      yield* sEdgeDot[i]().position(to, 0.32);
      sEdgeDot[i]().opacity(0);
    }
  }

  yield* waitFor(1.6);
});
