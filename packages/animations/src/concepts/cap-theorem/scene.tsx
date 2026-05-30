import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
  spawn,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {
  TitleBlock,
  SectionPill,
  GlowNode,
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

  // PROBLEM panel
  const pPill = createRef<Layout>();
  const pA = createRef<Rect>();
  const pB = createRef<Rect>();
  const pLink = createRef<Line>();
  const pBolt = createRef<Node>();
  const pWriteEdge = createRef<Line>();
  const pWriteDot = createRef<Circle>();
  const pConflictA = createRef<Txt>();
  const pConflictB = createRef<Txt>();
  const pStats = createRef<Layout>();

  // SOLUTION panel
  const sPill = createRef<Layout>();
  const sCpA = createRef<Rect>();
  const sCpB = createRef<Rect>();
  const sCpLink = createRef<Line>();
  const sCpBolt = createRef<Node>();
  const sCpReject = createRef<Node>();
  const sCpEdge = createRef<Line>();
  const sCpDot = createRef<Circle>();

  const sApA = createRef<Rect>();
  const sApB = createRef<Rect>();
  const sApLink = createRef<Line>();
  const sApBolt = createRef<Node>();
  const sApStale = createRef<Node>();
  const sApEdge = createRef<Line>();
  const sApDot = createRef<Circle>();
  const sStats = createRef<Layout>();

  // ---- metric signals --------------------------------------------------
  const pImpossible = createSignal(0); // 0..1 -> drives "C + A" fade
  const cpY = -40; // CP row center y within solution panel area
  const apY = 0;

  // node x positions
  const leftX = -300;
  const rightX = 300;

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="CAP "
        titleB="Theorem"
        subtitle="in a partition, choose consistency or availability"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — PARTITION ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="PARTITION"
        note="the network splits A from B"
        position={[-40, -660]}
        zIndex={5}
      />

      {/* the two nodes */}
      <GlowNode ref={pA} label="NODE A" accent={C.coral} width={230} height={110} position={[leftX, -420]} />
      <GlowNode ref={pB} label="NODE B" accent={C.coral} width={230} height={110} position={[rightX, -420]} />

      {/* the link between them (drawn intact, then broken) */}
      <Line
        ref={pLink}
        points={[[leftX + 130, -420], [rightX - 130, -420]]}
        stroke={C.teal}
        lineWidth={4}
        opacity={0}
        lineDash={[2, 14]}
        end={0}
      />

      {/* partition bolt — the broken link marker */}
      <Node ref={pBolt} position={[0, -420]} opacity={0}>
        <Line points={[[-8, -54], [-26, -6], [4, -6], [-14, 54]]} stroke={C.coral} lineWidth={7} lineCap="round" lineJoin="round" />
        <Txt text="X PARTITION" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} y={78} />
      </Node>

      {/* a write arrives on Node A */}
      <FlowEdge lineRef={pWriteEdge} dotRef={pWriteDot} from={[leftX, -300]} to={[leftX, -370]} color={C.teal} />
      <Txt ref={pConflictA} text="write x=1" fill={C.teal} fontFamily={F.mono} fontSize={24} position={[leftX, -270]} opacity={0} />
      <Txt ref={pConflictB} text="x=0 (stale)" fill={C.amber} fontFamily={F.mono} fontSize={24} position={[rightX, -270]} opacity={0} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="PARTITION" value="yes" accent={C.coral} width={300} />
        <StatCard label="CONSISTENT" value="x=1 vs x=0" accent={C.coral} width={300} />
        <StatCard label="C + A" value={() => (pImpossible() > 0.5 ? 'impossible' : '...')} accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — CHOOSE CP OR AP ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="CHOOSE PER CASE"
        note="CP rejects, AP stays up & reconciles"
        position={[-30, 70]}
        zIndex={5}
      />

      {/* ---- CP outcome row ---- */}
      <Txt text="CP" fill={C.teal} fontFamily={F.sans} fontWeight={800} fontSize={40} position={[-440, 250 + cpY]} />
      <GlowNode ref={sCpA} label="NODE A" accent={C.teal} width={200} height={92} position={[-200, 250 + cpY]} />
      <GlowNode ref={sCpB} label="NODE B" accent={C.teal} width={200} height={92} position={[260, 250 + cpY]} />
      <Line
        ref={sCpLink}
        points={[[-90, 250 + cpY], [150, 250 + cpY]]}
        stroke={C.teal}
        lineWidth={4}
        opacity={0}
        lineDash={[2, 14]}
        end={0}
      />
      <Node ref={sCpBolt} position={[30, 250 + cpY]} opacity={0}>
        <Line points={[[-6, -38], [-20, -4], [2, -4], [-10, 38]]} stroke={C.coral} lineWidth={5} lineCap="round" lineJoin="round" />
      </Node>
      {/* write hits minority side B -> rejected */}
      <Line ref={sCpEdge} points={[[440, 250 + cpY], [370, 250 + cpY]]} stroke={C.coral} lineWidth={3} opacity={0.5} lineDash={[2, 14]} end={0} />
      <Circle ref={sCpDot} size={18} fill={C.coral} shadowColor={C.coral} shadowBlur={16} position={[440, 250 + cpY]} opacity={0} />
      <Node ref={sCpReject} position={[260, 320 + cpY]} opacity={0}>
        <Txt text="reject write" fill={C.coral} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Node>

      {/* ---- AP outcome row ---- */}
      <Txt text="AP" fill={C.amber} fontFamily={F.sans} fontWeight={800} fontSize={40} position={[-440, 470 + apY]} />
      <GlowNode ref={sApA} label="NODE A" accent={C.amber} width={200} height={92} position={[-200, 470 + apY]} />
      <GlowNode ref={sApB} label="NODE B" accent={C.amber} width={200} height={92} position={[260, 470 + apY]} />
      <Line
        ref={sApLink}
        points={[[-90, 470 + apY], [150, 470 + apY]]}
        stroke={C.amber}
        lineWidth={4}
        opacity={0}
        lineDash={[2, 14]}
        end={0}
      />
      <Node ref={sApBolt} position={[30, 470 + apY]} opacity={0}>
        <Line points={[[-6, -38], [-20, -4], [2, -4], [-10, 38]]} stroke={C.coral} lineWidth={5} lineCap="round" lineJoin="round" />
      </Node>
      {/* write hits B -> accepted, may be stale, reconcile later */}
      <Line ref={sApEdge} points={[[440, 470 + apY], [370, 470 + apY]]} stroke={C.amber} lineWidth={3} opacity={0.5} lineDash={[2, 14]} end={0} />
      <Circle ref={sApDot} size={18} fill={C.amber} shadowColor={C.amber} shadowBlur={16} position={[440, 470 + apY]} opacity={0} />
      <Node ref={sApStale} position={[260, 540 + apY]} opacity={0}>
        <Txt text="accept, reconcile later" fill={C.amber} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Node>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="CP" value="reject" accent={C.teal} width={300} />
        <StatCard label="AP" value="serve stale" accent={C.amber} width={300} />
        <StatCard label="PICK" value="per case" width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pA, pB, sCpA, sCpB, sApA, sApB]) r().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // ===== PROBLEM =====
  yield* pPill().opacity(1, 0.4);
  yield* all(pA().scale(1, 0.5, easeOutBack), pB().scale(1, 0.5, easeOutBack));

  // the healthy link appears
  yield* pLink().opacity(0.6, 0.3);
  yield* pLink().end(1, 0.4);
  yield* waitFor(0.3);

  // the partition cuts the link
  yield* all(pLink().opacity(0, 0.3), pBolt().opacity(1, 0.4, easeOutCubic));
  yield* pStats().opacity(1, 0.4);

  // a write arrives on Node A — it can't reach B
  yield* pWriteEdge().end(1, 0.3);
  yield* pConflictA().opacity(1, 0.3);
  pWriteDot().position([leftX, -300]).opacity(1);
  yield* pWriteDot().position([leftX, -370], 0.4);
  pWriteDot().opacity(0);

  // node A now diverges from node B
  yield* all(pA().stroke(C.teal, 0.3), pConflictB().opacity(1, 0.4));
  yield* pImpossible(1, 0.4);
  yield* waitFor(0.8);

  // ===== SOLUTION =====
  yield* sPill().opacity(1, 0.4);

  // CP row reveals
  yield* all(sCpA().scale(1, 0.45, easeOutBack), sCpB().scale(1, 0.45, easeOutBack));
  yield* all(sCpLink().opacity(0.4, 0.2), sCpBolt().opacity(1, 0.3));
  yield* sCpEdge().end(1, 0.3);
  // write travels toward minority node B, then bounces — rejected
  sCpDot().position([440, 250 + cpY]).opacity(1);
  yield* sCpDot().position([370, 250 + cpY], 0.3);
  yield* all(sCpDot().position([440, 250 + cpY], 0.25), sCpReject().opacity(1, 0.3));
  sCpDot().opacity(0);
  yield* waitFor(0.3);

  // AP row reveals
  yield* all(sApA().scale(1, 0.45, easeOutBack), sApB().scale(1, 0.45, easeOutBack));
  yield* all(sApLink().opacity(0.4, 0.2), sApBolt().opacity(1, 0.3));
  yield* sApEdge().end(1, 0.3);
  // write travels into node B and is accepted (available, possibly stale)
  sApDot().position([440, 470 + apY]).opacity(1);
  yield* sApDot().position([370, 470 + apY], 0.35);
  sApDot().opacity(0);
  yield* sApStale().opacity(1, 0.3);

  yield* sStats().opacity(1, 0.4);

  // settle: replay both choices once so the poster frame reads clearly
  yield* waitFor(0.4);
  spawn(function* () {
    sCpDot().position([440, 250 + cpY]).opacity(1);
    yield* sCpDot().position([370, 250 + cpY], 0.3, easeOutCubic);
    yield* sCpDot().position([440, 250 + cpY], 0.25, easeOutCubic);
    sCpDot().opacity(0);
  });
  sApDot().position([440, 470 + apY]).opacity(1);
  yield* sApDot().position([370, 470 + apY], 0.4, easeOutCubic);
  sApDot().opacity(0);

  yield* waitFor(1.6);
});
