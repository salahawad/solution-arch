import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, StatCard, StatRow} from '../../components';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  view.add(
    <Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — metrics alone: you see the spike, not where or why
  const pPill = createRef<Layout>();
  const pMetrics = createRef<Node>();
  const pUnknown = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — three pillars correlated by one trace-id
  const sPill = createRef<Layout>();
  const sTraceTag = createRef<Layout>();
  const sCols = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const sArrows = createRef<Node>();
  const sStats = createRef<Layout>();

  // a labelled pillar column: panel + header + (caller-supplied) content
  const Col = (ref: any, x: number, head: string, sub: string, children: any) => (
    <Node ref={ref} position={[x, 400]}>
      <Rect width={285} height={300} radius={18} fill={C.panel} stroke={C.panelBorder} lineWidth={2} />
      <Txt text={head} fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={26} letterSpacing={2} position={[0, -118]} />
      <Txt text={sub} fill={C.muted} fontFamily={F.mono} fontSize={20} letterSpacing={1} position={[0, -86]} />
      {children}
    </Node>
  );

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Monitoring"
        subtitle="metrics, traces, logs — one pillar isn't enough"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — one pillar ============ */}
      <SectionPill ref={pPill} variant="problem" label="ONE PILLAR" note="metrics show the spike — but not where, not why" position={[-10, -650]} />

      {/* the only signal you have: a latency chart with a spike */}
      <Node ref={pMetrics} position={[-160, -430]}>
        <Rect width={390} height={180} radius={18} fill={C.panel} stroke={C.teal} lineWidth={2.5} shadowColor={C.teal} shadowBlur={theme.glow} />
        <Txt text="p99 latency" fill={C.muted} fontFamily={F.mono} fontSize={20} letterSpacing={1} position={[-110, -62]} />
        <Line
          points={[[-160, 45], [-90, 38], [-20, 34], [40, -48], [95, 40], [165, 34]]}
          stroke={C.coral}
          lineWidth={4}
          shadowColor={C.coral}
          shadowBlur={16}
        />
        <Txt text="4.2s" fill={C.coral} fontFamily={F.sans} fontWeight={800} fontSize={30} position={[40, -70]} />
      </Node>

      {/* metrics answer "what" — but "where" and "why" are unknown */}
      <Node ref={pUnknown} position={[280, -430]}>
        <Rect width={190} height={150} radius={16} fill={`${C.coral}10`} stroke={C.coralDim} lineWidth={2} lineDash={[6, 8]} />
        <Txt text="?" fill={C.coral} fontFamily={F.sans} fontWeight={800} fontSize={76} position={[0, -12]} />
        <Txt text="where? why?" fill={C.coral} fontFamily={F.mono} fontSize={22} position={[0, 52]} />
      </Node>

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="LATENCY" value="4.2s" accent={C.coral} width={300} />
        <StatCard label="WHERE" value="?" accent={C.coral} width={300} />
        <StatCard label="WHY" value="?" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — three pillars, correlated ============ */}
      <SectionPill ref={sPill} variant="solution" label="CORRELATED" note="metrics → traces → logs, stitched by one trace-id" position={[-10, 70]} />

      <Layout ref={sTraceTag} layout padding={[8, 22]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[0, 175]}>
        <Txt text="trace 8af2 · one id across all three" fill={C.teal} fontFamily={F.mono} fontWeight={600} fontSize={24} letterSpacing={1} />
      </Layout>

      {/* drill-down arrows between the columns */}
      <Node ref={sArrows}>
        <Line points={[[-186, 400], [-146, 400]]} stroke={C.amber} lineWidth={3} endArrow arrowSize={13} opacity={0.9} />
        <Line points={[[146, 400], [186, 400]]} stroke={C.amber} lineWidth={3} endArrow arrowSize={13} opacity={0.9} />
      </Node>

      {/* METRICS · what — the spike (recovered) */}
      {Col(sCols[0], -330, 'METRICS', 'what', (
        <>
          <Line points={[[-105, 30], [-45, 24], [5, 20], [45, -34], [85, 26], [110, 22]]} stroke={C.coral} lineWidth={3} />
          <Txt text="p99 4.2s" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={24} position={[0, 105]} />
        </>
      ))}

      {/* TRACES · where — span waterfall, payment is the long pole */}
      {Col(sCols[1], 0, 'TRACES', 'where', (
        <>
          <Rect position={[-110, -38]} offset={[-1, 0]} width={210} height={15} radius={4} fill={`${C.teal}33`} stroke={C.teal} lineWidth={1.5} />
          <Rect position={[-110, -14]} offset={[-1, 0]} width={55} height={15} radius={4} fill={`${C.teal}33`} stroke={C.teal} lineWidth={1.5} />
          <Rect position={[-55, 11]} offset={[-1, 0]} width={150} height={15} radius={4} fill={`${C.coral}33`} stroke={C.coral} lineWidth={2} shadowColor={C.coral} shadowBlur={10} />
          <Rect position={[-110, 35]} offset={[-1, 0]} width={32} height={15} radius={4} fill={`${C.teal}33`} stroke={C.teal} lineWidth={1.5} />
          <Txt text="94% payment" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={22} position={[0, 105]} />
        </>
      ))}

      {/* LOGS · why — the offending line */}
      {Col(sCols[2], 330, 'LOGS', 'why', (
        <>
          <Txt text="INFO  charge attempt=1" fill={C.mutedDim} fontFamily={F.mono} fontSize={16} position={[0, -38]} />
          <Txt text="WARN  timeout retry=1" fill={C.amber} fontFamily={F.mono} fontSize={16} position={[0, -12]} />
          <Rect width={250} height={26} radius={6} fill={`${C.coral}1A`} stroke={C.coralDim} lineWidth={1.5} position={[0, 16]} />
          <Txt text="ERROR  stripe_timeout" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={16} position={[0, 16]} />
          <Txt text="root cause" fill={C.coral} fontFamily={F.mono} fontSize={20} position={[0, 105]} />
        </>
      ))}

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="SIGNALS" value="all 3" accent={C.teal} width={300} />
        <StatCard label="ROOT CAUSE" value="payment" accent={C.teal} width={300} />
        <StatCard label="MTTR" value="minutes" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pMetrics, pUnknown]) r().scale(0).opacity(0);
  sTraceTag().opacity(0).scale(0.8);
  for (const r of sCols) r().scale(0).opacity(0);
  sArrows().opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: a metrics spike — but where and why are unknown
  yield* pPill().opacity(1, 0.4);
  yield* all(pMetrics().scale(1, 0.5, easeOutBack), pMetrics().opacity(1, 0.4));
  yield* all(pUnknown().scale(1, 0.5, easeOutBack), pUnknown().opacity(1, 0.4));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: the shared trace-id, then drill metrics -> traces -> logs
  yield* sPill().opacity(1, 0.4);
  yield* all(sTraceTag().opacity(1, 0.4), sTraceTag().scale(1, 0.4, easeOutBack));
  // reveal the three pillars left-to-right, then thread the drill arrows
  // between them (so an arrow never points at an empty slot)
  yield* all(sCols[0]().scale(1, 0.45, easeOutBack), sCols[0]().opacity(1, 0.4));
  yield* all(sCols[1]().scale(1, 0.45, easeOutBack), sCols[1]().opacity(1, 0.4));
  yield* all(sCols[2]().scale(1, 0.45, easeOutBack), sCols[2]().opacity(1, 0.4));
  yield* sArrows().opacity(1, 0.3);
  yield* sStats().opacity(1, 0.4);

  yield* waitFor(1.8);
});
