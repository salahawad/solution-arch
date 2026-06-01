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
import {TitleBlock, SectionPill, GlowNode, ServerNode, BalancerNode, FlowEdge, StatCard, StatRow} from '../../components';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  view.add(
    <Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — big-bang: everyone flipped to a broken v2
  const pPill = createRef<Layout>();
  const pUsers = createRef<Rect>();
  const pLb = createRef<Rect>();
  const pV2 = createRef<Rect>();
  const pV1ghost = createRef<Rect>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pLbV2 = createRef<Line>();
  const pDot = createRef<Circle>();
  const pStats = createRef<Layout>();

  // SOLUTION — canary: 95% to v1, 5% to v2, watched
  const sPill = createRef<Layout>();
  const sUsers = createRef<Rect>();
  const sLb = createRef<Rect>();
  const sV1 = createRef<Rect>();
  const sV2 = createRef<Rect>();
  const sE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const v1Line = createRef<Line>();
  const v1Dot = createRef<Circle>();
  const v2Line = createRef<Line>();
  const v2Dot = createRef<Circle>();
  const canaryTag = createRef<Layout>();
  const rampTag = createRef<Layout>();
  const sStats = createRef<Layout>();

  // ---- signals ---------------------------------------------------------
  const pErr = createSignal(0);
  const pV2load = createSignal(0);
  const v1load = createSignal(0);
  const v2load = createSignal(0);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Canary "
        titleB="Deployment"
        subtitle="ship to 5% first — catch the bad deploy before it hits everyone"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — big-bang release ============ */}
      <SectionPill ref={pPill} variant="problem" label="BIG-BANG" note="flip 100% to v2 at once — one bug, everyone's down" position={[-10, -650]} />

      <GlowNode ref={pUsers} label="USERS" accent={C.teal} width={190} height={92} fontSize={28} position={[-400, -430]} />
      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-305, -430]} to={[-240, -430]} color={C.teal} />
      <GlowNode ref={pLb} label="ROUTER" accent={C.teal} width={180} height={92} fontSize={26} position={[-130, -430]} />

      {/* all traffic to v2 (fat coral edge) */}
      <Line ref={pLbV2} points={[[-40, -430], [200, -430]]} stroke={C.coral} lineWidth={9} opacity={0.9} endArrow arrowSize={18} end={0} />
      <Circle ref={pDot} size={20} fill={C.coral} shadowColor={C.coral} shadowBlur={16} position={[-40, -430]} opacity={0} />
      <ServerNode ref={pV2} name="v2" load={pV2load} position={[330, -430]} width={210} />
      {/* v1 retired, ghosted below */}
      <Rect ref={pV1ghost} size={[210, 70]} radius={18} fill={C.panel} stroke={C.mutedDim} lineWidth={2} position={[330, -330]} layout direction="row" alignItems="center" justifyContent="space-between" padding={[0, 22]}>
        <Txt text="v1" fill={C.mutedDim} fontFamily={F.mono} fontSize={26} />
        <Txt text="retired" fill={C.mutedDim} fontFamily={F.mono} fontSize={22} />
      </Rect>

      <StatRow ref={pStats} position={[0, -170]} gap={22}>
        <StatCard label="LIVE" value="v2 · 100%" accent={C.coral} width={300} />
        <StatCard label="BLAST RADIUS" value="100%" accent={C.coral} width={300} />
        <StatCard label="ERRORS" value={() => `${Math.round(pErr())}%`} accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — canary ============ */}
      <SectionPill ref={sPill} variant="solution" label="CANARY" note="5% to v2, watch its errors, then ramp or roll back" position={[-10, 60]} />

      <GlowNode ref={sUsers} label="USERS" accent={C.teal} width={190} height={92} fontSize={28} position={[-400, 360]} />
      <FlowEdge lineRef={sE1.line} dotRef={sE1.dot} from={[-305, 360]} to={[-250, 360]} color={C.teal} />
      <BalancerNode ref={sLb} position={[-130, 360]} label="ROUTER" sub="weighted split" />

      {/* 95% -> v1 (thick teal), 5% -> v2 canary (thin amber) */}
      <Line ref={v1Line} points={[[-10, 330], [150, 300]]} stroke={C.teal} lineWidth={9} opacity={0.9} endArrow arrowSize={16} end={0} />
      <Circle ref={v1Dot} size={18} fill={C.teal} shadowColor={C.teal} shadowBlur={14} position={[-10, 330]} opacity={0} />
      <Line ref={v2Line} points={[[-10, 392], [150, 470]]} stroke={C.amber} lineWidth={3} opacity={0.9} lineDash={[4, 8]} endArrow arrowSize={12} end={0} />
      <Circle ref={v2Dot} size={16} fill={C.amber} shadowColor={C.amber} shadowBlur={14} position={[-10, 392]} opacity={0} />

      <ServerNode ref={sV1} name="v1  95%" load={v1load} position={[300, 300]} width={250} />
      <ServerNode ref={sV2} name="v2  5%" load={v2load} position={[300, 470]} width={250} />
      <Layout ref={canaryTag} layout padding={[6, 18]} radius={999} fill={`${C.amber}22`} stroke={C.amber} lineWidth={2} position={[300, 560]}>
        <Txt text="CANARY" fill={C.amber} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={2} />
      </Layout>

      <Layout ref={rampTag} layout padding={[8, 22]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[-300, 470]}>
        <Txt text="ramp 5% → 25% → 100%" fill={C.teal} fontFamily={F.mono} fontWeight={600} fontSize={22} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="CANARY" value="5% → 100%" accent={C.teal} width={300} />
        <StatCard label="ERROR BUDGET" value="ok" accent={C.teal} width={300} />
        <StatCard label="ON SPIKE" value="rollback" accent={C.amber} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pUsers, pLb, pV2, pV1ghost, sUsers, sV1, sV2]) r().scale(0);
  sLb().scale(0);
  for (const r of [canaryTag, rampTag]) r().opacity(0).scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: everyone routed to v2, which is broken
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pUsers().scale(1, 0.45, easeOutBack),
    pLb().scale(1, 0.45, easeOutBack),
    pV2().scale(1, 0.45, easeOutBack),
    pV1ghost().scale(1, 0.45, easeOutBack),
  );
  yield* all(pE1.line().end(1, 0.3), pLbV2().end(1, 0.35));
  yield* pStats().opacity(1, 0.4);
  // traffic pours to v2; load + errors spike to 100%
  for (let i = 0; i < 3; i++) {
    pDot().position([-40, -430]).opacity(1);
    yield* pDot().position([200, -430], 0.28);
    pDot().opacity(0);
  }
  yield* all(pV2load(100, 1.2), pErr(100, 1.2));
  yield* waitFor(0.8);

  // SOLUTION: weighted split, canary watched
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sUsers().scale(1, 0.45, easeOutBack),
    sLb().scale(1, 0.5, easeOutBack),
    sV1().scale(1, 0.45, easeOutBack),
    sV2().scale(1, 0.45, easeOutBack),
  );
  yield* all(sE1.line().end(1, 0.3), v1Line().end(1, 0.35), v2Line().end(1, 0.35));
  yield* all(canaryTag().opacity(1, 0.4), canaryTag().scale(1, 0.4, easeOutBack), rampTag().opacity(1, 0.4), rampTag().scale(1, 0.4, easeOutBack));
  yield* sStats().opacity(1, 0.4);
  // ramp loads: v1 carries the bulk (teal), v2 a healthy sliver
  yield* all(v1load(62, 1.0), v2load(6, 1.0));
  // a few requests fan: mostly to v1, one to the canary
  for (let i = 0; i < 4; i++) {
    v1Dot().position([-10, 330]).opacity(1);
    yield* v1Dot().position([150, 300], 0.22);
    v1Dot().opacity(0);
    if (i === 1) {
      v2Dot().position([-10, 392]).opacity(1);
      yield* v2Dot().position([150, 470], 0.3);
      v2Dot().opacity(0);
    }
  }

  yield* waitFor(1.8);
});
