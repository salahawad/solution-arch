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
  const pStats = createRef<Layout>();
  const pStep = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pEdgeLine = [createRef<Line>(), createRef<Line>()];
  const pEdgeDot = [createRef<Circle>(), createRef<Circle>()];
  const pBadge = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const pBoom = createRef<Node>();
  const pInconsistent = createRef<Layout>();

  // SOLUTION panel
  const sPill = createRef<Layout>();
  const sStats = createRef<Layout>();
  const sStep = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sFwdLine = [createRef<Line>(), createRef<Line>()];
  const sFwdDot = [createRef<Circle>(), createRef<Circle>()];
  const sCompLine = [createRef<Line>(), createRef<Line>()];
  const sCompDot = [createRef<Circle>(), createRef<Circle>()];
  const sFail = createRef<Node>();
  const sConsistent = createRef<Layout>();

  // ---- geometry --------------------------------------------------------
  const labels = ['PAYMENT', 'INVENTORY', 'SHIPPING'];
  const stepW = 268;
  const stepX = [-330, 0, 330];

  const pStepY = -440;
  const sStepY = 310;

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Saga"
        subtitle="distributed transactions without two-phase commit"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — no global transaction ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="NO GLOBAL TX"
        note="one order spans three services — and one fails"
        position={[-30, -660]}
      />

      <FlowEdge lineRef={pEdgeLine[0]} dotRef={pEdgeDot[0]} from={[stepX[0] + stepW / 2, pStepY]} to={[stepX[1] - stepW / 2, pStepY]} color={C.teal} />
      <FlowEdge lineRef={pEdgeLine[1]} dotRef={pEdgeDot[1]} from={[stepX[1] + stepW / 2, pStepY]} to={[stepX[2] - stepW / 2, pStepY]} color={C.coral} />

      <GlowNode ref={pStep[0]} label={labels[0]} accent={C.teal} width={stepW} height={104} fontSize={26} position={[stepX[0], pStepY]} />
      <GlowNode ref={pStep[1]} label={labels[1]} accent={C.teal} width={stepW} height={104} fontSize={26} position={[stepX[1], pStepY]} />
      <GlowNode ref={pStep[2]} label={labels[2]} accent={C.coral} width={stepW} height={104} fontSize={26} position={[stepX[2], pStepY]} />

      {/* committed / failed badges under each step */}
      <Node ref={pBadge[0]} position={[stepX[0], pStepY + 86]}>
        <Txt text="committed" fill={C.teal} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Node>
      <Node ref={pBadge[1]} position={[stepX[1], pStepY + 86]}>
        <Txt text="committed" fill={C.teal} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Node>
      <Node ref={pBadge[2]} position={[stepX[2], pStepY + 86]}>
        <Txt text="FAILED" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={2} />
      </Node>

      {/* failure burst above SHIPPING — sits over the node's top edge so it
          does not cut through the SHIPPING label text */}
      <Node ref={pBoom} position={[stepX[2], pStepY - 95]}>
        <Circle size={150} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-30, -30], [30, 30]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[30, -30], [-30, 30]]} stroke={C.coral} lineWidth={6} />
      </Node>

      {/* inconsistent banner */}
      <Layout ref={pInconsistent} layout direction="row" alignItems="center" gap={14} position={[0, pStepY + 150]}>
        <Rect layout padding={[8, 22]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2}>
          <Txt text="INCONSISTENT" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        </Rect>
        <Txt text="money taken, stock held, nothing shipped" fill={C.muted} fontFamily={F.sans} fontSize={26} />
      </Layout>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="STEPS" value="3" width={300} />
        <StatCard label="FAILED" value="shipping" accent={C.coral} width={300} />
        <StatCard label="STATE" value="broken" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — saga + compensations ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="SAGA"
        note="local transactions, each with a compensating undo"
        position={[-30, 70]}
      />

      {/* forward chain edges (teal) */}
      <FlowEdge lineRef={sFwdLine[0]} dotRef={sFwdDot[0]} from={[stepX[0] + stepW / 2, sStepY]} to={[stepX[1] - stepW / 2, sStepY]} color={C.teal} />
      <FlowEdge lineRef={sFwdLine[1]} dotRef={sFwdDot[1]} from={[stepX[1] + stepW / 2, sStepY]} to={[stepX[2] - stepW / 2, sStepY]} color={C.teal} />

      <GlowNode ref={sStep[0]} label={labels[0]} accent={C.teal} width={stepW} height={104} fontSize={26} position={[stepX[0], sStepY]} />
      <GlowNode ref={sStep[1]} label={labels[1]} accent={C.teal} width={stepW} height={104} fontSize={26} position={[stepX[1], sStepY]} />
      <GlowNode ref={sStep[2]} label={labels[2]} accent={C.amber} width={stepW} height={104} fontSize={26} position={[stepX[2], sStepY]} />

      {/* shipping fails marker */}
      <Node ref={sFail} position={[stepX[2], sStepY - 78]}>
        <Txt text=" shipping fails " fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={1} />
      </Node>

      {/* reverse compensation edges (coral) — sit below the forward chain */}
      <FlowEdge lineRef={sCompLine[0]} dotRef={sCompDot[0]} from={[stepX[2] - stepW / 2, sStepY + 78]} to={[stepX[1] + stepW / 2, sStepY + 78]} color={C.coral} />
      <FlowEdge lineRef={sCompLine[1]} dotRef={sCompDot[1]} from={[stepX[1] - stepW / 2, sStepY + 78]} to={[stepX[0] + stepW / 2, sStepY + 78]} color={C.coral} />

      <Txt text="restock" fill={C.coral} fontFamily={F.mono} fontSize={22} position={[(stepX[1] + stepX[2]) / 2, sStepY + 110]} />
      <Txt text="refund" fill={C.coral} fontFamily={F.mono} fontSize={22} position={[(stepX[0] + stepX[1]) / 2, sStepY + 110]} />

      {/* consistent banner */}
      <Layout ref={sConsistent} layout direction="row" alignItems="center" gap={14} position={[0, sStepY + 178]}>
        <Rect layout padding={[8, 22]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2}>
          <Txt text="CONSISTENT" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        </Rect>
        <Txt text="every committed step is cleanly undone" fill={C.muted} fontFamily={F.sans} fontSize={26} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="COMPENSATE" value="undo steps" accent={C.teal} width={300} />
        <StatCard label="REVERSE" value="3 → 2 → 1" accent={C.teal} width={300} />
        <StatCard label="STATE" value="consistent" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, pInconsistent, sPill, sStats, sConsistent]) r().opacity(0);
  for (const r of [...pStep, ...sStep]) r().scale(0);
  for (const r of [...pBadge, pBoom, sFail]) r().opacity(0);
  pBoom().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // ===== PROBLEM: the order runs forward, then shipping fails =====
  yield* pPill().opacity(1, 0.4);

  // payment commits
  yield* pStep[0]().scale(1, 0.4, easeOutBack);
  yield* pBadge[0]().opacity(1, 0.25);
  yield* pEdgeLine[0]().end(1, 0.3);
  pEdgeDot[0]().position([stepX[0] + stepW / 2, pStepY]).opacity(1);
  yield* pEdgeDot[0]().position([stepX[1] - stepW / 2, pStepY], 0.4, easeOutCubic);
  pEdgeDot[0]().opacity(0);

  // inventory commits
  yield* pStep[1]().scale(1, 0.4, easeOutBack);
  yield* pBadge[1]().opacity(1, 0.25);
  yield* pEdgeLine[1]().end(1, 0.3);
  pEdgeDot[1]().position([stepX[1] + stepW / 2, pStepY]).opacity(1);
  yield* pEdgeDot[1]().position([stepX[2] - stepW / 2, pStepY], 0.4, easeOutCubic);
  pEdgeDot[1]().opacity(0);

  // shipping arrives... then blows up
  yield* pStep[2]().scale(1, 0.4, easeOutBack);
  yield* all(pBoom().scale(1, 0.4, easeOutBack), pBoom().opacity(1, 0.3));
  yield* pBadge[2]().opacity(1, 0.25);
  yield* pInconsistent().opacity(1, 0.4);
  yield* pStats().opacity(1, 0.4);

  yield* waitFor(0.8);

  // ===== SOLUTION: forward chain, then reverse compensations =====
  yield* sPill().opacity(1, 0.4);

  // forward chain draws step by step
  yield* sStep[0]().scale(1, 0.4, easeOutBack);
  yield* sFwdLine[0]().end(1, 0.3);
  sFwdDot[0]().position([stepX[0] + stepW / 2, sStepY]).opacity(1);
  yield* sFwdDot[0]().position([stepX[1] - stepW / 2, sStepY], 0.38, easeOutCubic);
  sFwdDot[0]().opacity(0);

  yield* sStep[1]().scale(1, 0.4, easeOutBack);
  yield* sFwdLine[1]().end(1, 0.3);
  sFwdDot[1]().position([stepX[1] + stepW / 2, sStepY]).opacity(1);
  yield* sFwdDot[1]().position([stepX[2] - stepW / 2, sStepY], 0.38, easeOutCubic);
  sFwdDot[1]().opacity(0);

  yield* sStep[2]().scale(1, 0.4, easeOutBack);
  yield* sFail().opacity(1, 0.3);
  yield* sStats().opacity(1, 0.4);

  yield* waitFor(0.5);

  // reverse: restock (3 -> 2), then refund (2 -> 1)
  sStep[2]().stroke(C.coral);
  yield* sCompLine[0]().end(1, 0.3);
  sCompDot[0]().position([stepX[2] - stepW / 2, sStepY + 78]).opacity(1);
  yield* sCompDot[0]().position([stepX[1] + stepW / 2, sStepY + 78], 0.45, easeOutCubic);
  sCompDot[0]().opacity(0);
  yield* sStep[1]().stroke(C.coral, 0.3);

  yield* sCompLine[1]().end(1, 0.3);
  sCompDot[1]().position([stepX[1] - stepW / 2, sStepY + 78]).opacity(1);
  yield* sCompDot[1]().position([stepX[0] + stepW / 2, sStepY + 78], 0.45, easeOutCubic);
  sCompDot[1]().opacity(0);
  yield* sStep[0]().stroke(C.coral, 0.3);

  // settled: undone cleanly -> consistent
  yield* sConsistent().opacity(1, 0.4);

  yield* waitFor(1.6);
});
