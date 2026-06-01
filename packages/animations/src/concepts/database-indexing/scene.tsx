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
import {
  TitleBlock,
  SectionPill,
  GlowNode,
  FlowEdge,
  StatCard,
  StatRow,
  DbNode,
  HeroMetric,
} from '../../components';

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

  // PROBLEM — full table scan
  const pPill = createRef<Layout>();
  const pApp = createRef<Rect>();
  const pDb = createRef<Node>();
  const pEdgeLine = createRef<Line>();
  const pEdgeDot = createRef<Circle>();
  const pQuery = createRef<Rect>();
  const pHero = createRef<Layout>();
  const pStats = createRef<Layout>();

  // SOLUTION — b-tree index
  const sPill = createRef<Layout>();
  const sApp = createRef<Rect>();
  const sDb = createRef<Node>();
  const sEdgeLine = createRef<Line>();
  const sEdgeDot = createRef<Circle>();
  const sQuery = createRef<Rect>();
  const sHero = createRef<Layout>();
  const sStats = createRef<Layout>();

  // ---- metric signals --------------------------------------------------
  const scanMs = createSignal(0);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Database "
        titleB="Indexing"
        subtitle="skip the scan — seek straight to the row"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — full table scan ============ */}
      <SectionPill ref={pPill} variant="problem" label="FULL TABLE SCAN" note="no index — read and test every row" position={[-60, -660]} />

      <GlowNode ref={pApp} label="APP" accent={C.coral} width={220} height={92} position={[-380, -500]} />
      <DbNode ref={pDb} label="users" sub="no index" accent={C.coral} width={210} height={200} position={[380, -500]} />
      <FlowEdge lineRef={pEdgeLine} dotRef={pEdgeDot} from={[-270, -500]} to={[270, -500]} color={C.coral} />

      <Rect ref={pQuery} layout padding={[6, 18]} radius={999} fill={`${C.coral}1A`} stroke={C.coral} lineWidth={2} position={[0, -610]}>
        <Txt text="WHERE email = ?" fill={C.coral} fontFamily={F.mono} fontSize={24} letterSpacing={1} />
      </Rect>

      <HeroMetric ref={pHero} value={() => `${Math.round(scanMs())}ms`} sub="scanning every row…" accent={C.coral} position={[0, -300]} />

      <StatRow ref={pStats} position={[0, -120]} gap={22}>
        <StatCard label="ROWS SCANNED" value="1,000,000" accent={C.coral} width={300} />
        <StatCard label="LATENCY" value={() => `${Math.round(scanMs())}ms`} accent={C.coral} width={300} />
        <StatCard label="PLAN" value="Seq Scan" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — b-tree index ============ */}
      <SectionPill ref={sPill} variant="solution" label="B-TREE INDEX" note="sorted keys + row pointers — seek, don't scan" position={[-30, 70]} />

      <GlowNode ref={sApp} label="APP" accent={C.teal} width={220} height={92} position={[-380, 250]} />
      <DbNode ref={sDb} label="users" sub="indexed" accent={C.teal} width={210} height={200} position={[380, 250]} />
      <FlowEdge lineRef={sEdgeLine} dotRef={sEdgeDot} from={[-270, 250]} to={[270, 250]} color={C.teal} />

      <Rect ref={sQuery} layout padding={[6, 18]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[0, 150]}>
        <Txt text="WHERE email = ?" fill={C.teal} fontFamily={F.mono} fontSize={24} letterSpacing={1} />
      </Rect>

      <HeroMetric ref={sHero} value="3ms" sub="index seek · ~20 steps" accent={C.teal} position={[0, 450]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="ROWS READ" value="~20" accent={C.teal} width={300} />
        <StatCard label="LATENCY" value="3ms" accent={C.teal} width={300} />
        <StatCard label="PLAN" value="Index Seek" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats, pQuery, sQuery, pHero, sHero]) r().opacity(0);
  for (const r of [pApp, sApp]) r().scale(0);
  for (const r of [pDb, sDb]) r().scale(0);
  sHero().scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: app queries a non-indexed table
  yield* pPill().opacity(1, 0.4);
  yield* all(pApp().scale(1, 0.5, easeOutBack), pDb().scale(1, 0.5, easeOutBack));
  yield* all(pEdgeLine().end(1, 0.4), pQuery().opacity(1, 0.4));
  yield* all(pHero().opacity(1, 0.4), pStats().opacity(1, 0.4));

  // the scan crawls — the counter climbs while query dots keep hammering the table
  yield* all(
    scanMs(1914, 1.6, easeOutCubic),
    (function* () {
      for (let i = 0; i < 4; i++) {
        pEdgeDot().position([-270, -500]).opacity(1);
        yield* pEdgeDot().position([270, -500], 0.4);
        pEdgeDot().opacity(0);
      }
    })(),
  );
  yield* waitFor(0.8);

  // SOLUTION: the indexed table seeks straight to the row
  yield* sPill().opacity(1, 0.4);
  yield* all(sApp().scale(1, 0.5, easeOutBack), sDb().scale(1, 0.5, easeOutBack));
  yield* all(sEdgeLine().end(1, 0.4), sQuery().opacity(1, 0.4));
  yield* sStats().opacity(1, 0.4);

  // one query dot, an immediate hit, and the payoff number pops
  sEdgeDot().position([-270, 250]).opacity(1);
  yield* sEdgeDot().position([270, 250], 0.35);
  sEdgeDot().opacity(0);
  yield* all(sHero().opacity(1, 0.4), sHero().scale(1, 0.5, easeOutBack));

  // settle — END with BOTH bands visible (poster frame: 1914ms vs 3ms)
  yield* waitFor(1.8);
});
