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
import {TitleBlock, SectionPill, GlowNode, FlowEdge, StatCard, StatRow, Bucket} from '../../components';

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

  // PROBLEM — fast producer, slow consumer, unbounded queue overflows
  const pPill = createRef<Layout>();
  const pProd = createRef<Rect>();
  const pCons = createRef<Rect>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pBucket = createRef<Rect>();
  const pTokens = Array.from({length: 6}, () => createRef<Circle>());
  const pOver = createRef<Node>(); // overflow tokens stacked above the rim
  const pStats = createRef<Layout>();

  // SOLUTION — bounded queue + a back-pressure signal that paces the producer
  const sPill = createRef<Layout>();
  const sProd = createRef<Rect>();
  const sCons = createRef<Rect>();
  const sE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sBucket = createRef<Rect>();
  const sTokens = Array.from({length: 6}, () => createRef<Circle>());
  const backLine = createRef<Line>();
  const backDot = createRef<Circle>();
  const slowTag = createRef<Layout>();
  const sStats = createRef<Layout>();

  // ---- metric / color signals -----------------------------------------
  const pDepth = createSignal(0);   // queue depth -> "12k+"
  const pMem = createSignal(0);     // memory % -> 100

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Backpressure"
        subtitle="pace the producer instead of letting an unbounded queue eat memory"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — unbounded queue ============ */}
      <SectionPill ref={pPill} variant="problem" label="UNBOUNDED" note="fast producer, slow consumer — the queue grows until OOM" position={[-10, -650]} />

      <GlowNode ref={pProd} label="PRODUCER" accent={C.teal} width={210} height={96} fontSize={26} position={[-380, -430]} />

      {/* PRODUCER -> QUEUE (fast) */}
      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-275, -430]} to={[-40, -400]} color={C.teal} />

      {/* the unbounded queue — fills and overflows; bucket turns coral */}
      <Bucket ref={pBucket} tokenRefs={pTokens} capacity={6} accent={C.coral} position={[40, -400]} label="QUEUE" />

      {/* overflow tokens spilling out above the rim (bucket top is at y = -100 relative to center) */}
      <Node ref={pOver} position={[40, -400]}>
        <Circle width={36} height={36} fill={C.coral} shadowColor={C.coral} shadowBlur={12} position={[-34, -132]} />
        <Circle width={36} height={36} fill={C.coral} shadowColor={C.coral} shadowBlur={12} position={[8, -160]} />
        <Circle width={36} height={36} fill={C.coral} shadowColor={C.coral} shadowBlur={12} position={[-20, -192]} />
        <Txt text="OVERFLOW" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={20} letterSpacing={2} position={[0, -226]} />
      </Node>

      {/* QUEUE -> CONSUMER (slow) */}
      <FlowEdge lineRef={pE2.line} dotRef={pE2.dot} from={[120, -400]} to={[275, -430]} color={C.teal} />

      <GlowNode ref={pCons} label="CONSUMER" accent={C.teal} width={210} height={96} fontSize={26} position={[380, -430]} />

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="QUEUE DEPTH" value={() => (pDepth() >= 12000 ? '12k+' : `${Math.round(pDepth() / 1000)}k`)} accent={C.coral} width={300} />
        <StatCard label="MEMORY" value={() => `${Math.round(pMem())}%`} accent={C.coral} width={300} />
        <StatCard label="STATUS" value="OOM" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — backpressure ============ */}
      <SectionPill ref={sPill} variant="solution" label="BACKPRESSURE" note="bound the queue; signal the producer to slow down" position={[-10, 70]} />

      <GlowNode ref={sProd} label="PRODUCER" accent={C.teal} width={210} height={96} fontSize={26} position={[-380, 360]} />

      {/* PRODUCER -> QUEUE (paced) */}
      <FlowEdge lineRef={sE1.line} dotRef={sE1.dot} from={[-275, 360]} to={[-40, 390]} color={C.teal} />

      {/* the bounded queue — only filled halfway, healthy teal, no overflow */}
      <Bucket ref={sBucket} tokenRefs={sTokens} capacity={6} accent={C.teal} position={[40, 390]} label="BOUNDED QUEUE" />

      {/* QUEUE -> CONSUMER */}
      <FlowEdge lineRef={sE2.line} dotRef={sE2.dot} from={[120, 390]} to={[275, 360]} color={C.teal} />

      <GlowNode ref={sCons} label="CONSUMER" accent={C.teal} width={210} height={96} fontSize={26} position={[380, 360]} />

      {/* the back-pressure signal — a coral line above the path, from queue back to the producer */}
      <Line ref={backLine} points={[[40, 250], [40, 230], [-380, 230], [-380, 290]]} radius={20} stroke={C.coral} lineWidth={4} opacity={0.9} lineDash={[6, 10]} endArrow arrowSize={16} end={0} />
      <Circle ref={backDot} size={16} fill={C.coral} shadowColor={C.coral} shadowBlur={14} position={[40, 230]} opacity={0} />
      <Layout ref={slowTag} layout padding={[8, 22]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2} position={[-170, 230]}>
        <Txt text="SLOW DOWN" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={2} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="QUEUE DEPTH" value="<= cap" accent={C.teal} width={300} />
        <StatCard label="PRODUCER" value="paced" accent={C.teal} width={300} />
        <StatCard label="LOSS" value="none" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pProd, pCons, sProd, sCons]) r().scale(0);
  pBucket().scale(0);
  sBucket().scale(0);
  pOver().opacity(0).scale(0.6);
  slowTag().opacity(0).scale(0.8);
  // tokens start hidden (Bucket already sets opacity 0, but be explicit)
  for (const t of [...pTokens, ...sTokens]) t().opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: reveal producer, queue, consumer ---------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pProd().scale(1, 0.5, easeOutBack),
    pBucket().scale(1, 0.55, easeOutBack),
    pCons().scale(1, 0.5, easeOutBack),
  );
  yield* all(pE1.line().end(1, 0.3), pE2.line().end(1, 0.3));
  yield* pStats().opacity(1, 0.4);

  // the producer fires fast dots into the queue; tokens fill bottom -> top
  for (let i = 0; i < 6; i++) {
    pE1.dot().position([-275, -430]).opacity(1);
    yield* pE1.dot().position([-40, -400], 0.18);
    pE1.dot().opacity(0);
    yield* pTokens[i]().opacity(1, 0.12);
  }

  // queue is full and still filling — overflow spills above the rim, bucket reddens
  yield* all(
    pOver().opacity(1, 0.5),
    pOver().scale(1, 0.5, easeOutBack),
    pBucket().stroke(C.coral, 0.4),
    pBucket().shadowColor(C.coral, 0.4),
  );

  // a couple more fast dots keep arriving while the consumer barely drains
  for (let i = 0; i < 2; i++) {
    pE1.dot().position([-275, -430]).opacity(1);
    yield* pE1.dot().position([-40, -400], 0.16);
    pE1.dot().opacity(0);
  }
  // the slow consumer drains one, slowly
  pE2.dot().position([120, -400]).opacity(1);
  yield* pE2.dot().position([275, -430], 0.85);
  pE2.dot().opacity(0);

  // depth + memory climb until OOM
  yield* all(pDepth(12000, 1.4), pMem(100, 1.4));
  yield* waitFor(0.9);

  // SOLUTION: bounded queue + back-pressure -----------------------------
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sProd().scale(1, 0.5, easeOutBack),
    sBucket().scale(1, 0.55, easeOutBack),
    sCons().scale(1, 0.5, easeOutBack),
  );
  yield* all(sE1.line().end(1, 0.3), sE2.line().end(1, 0.3));
  yield* sStats().opacity(1, 0.4);

  // tint the bounded queue teal so the settled healthy frame out-inks the problem
  yield* sBucket().fill(`${C.teal}22`, 0.3);

  // producer pushes a few dots; queue fills only halfway and holds steady
  for (let i = 0; i < 3; i++) {
    sE1.dot().position([-275, 360]).opacity(1);
    yield* sE1.dot().position([-40, 390], 0.3);
    sE1.dot().opacity(0);
    yield* sTokens[i]().opacity(1, 0.18);
    // the consumer keeps up, draining at the same pace
    sE2.dot().position([120, 390]).opacity(1);
    yield* sE2.dot().position([275, 360], 0.3);
    sE2.dot().opacity(0);
  }

  // the queue nears capacity -> emit a back-pressure signal upstream
  yield* all(
    backLine().end(1, 0.5),
    slowTag().opacity(1, 0.45),
    slowTag().scale(1, 0.45, easeOutBack),
  );
  // the "slow down" signal travels back to the producer, pacing it
  for (let i = 0; i < 2; i++) {
    backDot().position([40, 230]).opacity(1);
    yield* backDot().position([-380, 230], 0.6);
    backDot().opacity(0);
  }

  yield* waitFor(1.8);
});
