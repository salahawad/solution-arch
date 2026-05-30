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
  DbNode,
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

  // PROBLEM panel
  const pPill = createRef<Layout>();
  const pApp = createRef<Rect>();
  const pDb = createRef<Node>();
  const pX = createRef<Node>();
  const pEdgeLine = createRef<Line>();
  const pEdgeDot = createRef<Circle>();
  const pStats = createRef<Layout>();

  // SOLUTION panel
  const sPill = createRef<Layout>();
  const sApp = createRef<Rect>();
  const primary = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sRep = [createRef<Node>(), createRef<Node>()];
  const sStats = createRef<Layout>();
  const sWriteEdge = createRef<Line>();
  const sWriteDot = createRef<Circle>();
  const sReplLine = [createRef<Line>(), createRef<Line>()];
  const sReplDot = [createRef<Circle>(), createRef<Circle>()];
  const sReadLine = [createRef<Line>(), createRef<Line>()];
  const sReadDot = [createRef<Circle>(), createRef<Circle>()];

  // ---- metric signals --------------------------------------------------
  const pReadPct = createSignal(0);
  const pWriteN = createSignal(0);

  // node anchors
  const sRepY = [200, 500];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Database "
        titleB="Replication"
        subtitle="one primary is a single point of failure"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — ONE PRIMARY (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="ONE PRIMARY" note="every read and write hits one box" position={[-40, -660]} />

      <GlowNode ref={pApp} label="APP" accent={C.teal} width={220} height={92} position={[-340, -420]} />

      {/* the single primary DB — both reads and writes land here */}
      <DbNode ref={pDb} label="db" sub="primary" accent={C.coral} width={210} height={200} position={[340, -420]} />

      {/* "single point of failure" X badge over the one DB */}
      <Node ref={pX} position={[340, -420]}>
        <Circle size={150} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-34, -34], [34, 34]]} stroke={C.coral} lineWidth={7} />
        <Line points={[[34, -34], [-34, 34]]} stroke={C.coral} lineWidth={7} />
        <Txt text="SINGLE POINT OF FAILURE" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} y={140} />
      </Node>

      <FlowEdge lineRef={pEdgeLine} dotRef={pEdgeDot} from={[-228, -420]} to={[232, -420]} color={C.coral} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="READS" value={() => `${Math.round(pReadPct())}% on 1`} accent={C.coral} width={300} />
        <StatCard label="WRITES" value={() => `${Math.round(pWriteN())} on 1`} accent={C.coral} width={300} />
        <StatCard label="DOWN" value="outage" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — REPLICATION (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="REPLICATION" note="primary streams writes to read replicas" position={[-20, 70]} />

      <GlowNode ref={sApp} label="APP" accent={C.teal} width={200} height={88} position={[-400, 350]} />

      {/* writes flow APP -> PRIMARY */}
      <Line ref={sWriteEdge} points={[[-300, 350], [-160, 350]]} stroke={C.teal} lineWidth={3} opacity={0.5} lineDash={[2, 12]} endArrow arrowSize={14} end={0} />
      <Circle ref={sWriteDot} size={18} fill={C.teal} shadowColor={C.teal} shadowBlur={16} position={[-300, 350]} opacity={0} />

      {/* the primary in the middle, with sonar rings as it streams */}
      <BalancerNode ref={primary} ringRef={ring} ring2Ref={ring2} position={[-30, 350]} label="PRIMARY" sub="takes writes" />

      {/* replication edges: primary -> 2 replicas */}
      <FlowEdge lineRef={sReplLine[0]} dotRef={sReplDot[0]} from={[95, 320]} to={[235, sRepY[0]]} color={C.teal} />
      <FlowEdge lineRef={sReplLine[1]} dotRef={sReplDot[1]} from={[95, 380]} to={[235, sRepY[1]]} color={C.teal} />

      {/* the read replicas */}
      <DbNode ref={sRep[0]} label="replica-1" sub="reads" accent={C.teal} width={210} height={150} position={[360, sRepY[0]]} />
      <DbNode ref={sRep[1]} label="replica-2" sub="reads" accent={C.teal} width={210} height={150} position={[360, sRepY[1]]} />

      {/* reads fan from APP out to the replicas */}
      <FlowEdge lineRef={sReadLine[0]} dotRef={sReadDot[0]} from={[-400, 405]} to={[270, sRepY[0]]} color={C.amber} />
      <FlowEdge lineRef={sReadLine[1]} dotRef={sReadDot[1]} from={[-400, 405]} to={[270, sRepY[1]]} color={C.amber} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="REPLICAS" value="2" accent={C.teal} width={300} />
        <StatCard label="READS" value="spread" accent={C.amber} width={300} />
        <StatCard label="FAILOVER" value="3s" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pApp, sApp, primary]) r().scale(0);
  for (const r of [pDb, ...sRep]) r().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem — app and one primary DB
  yield* pPill().opacity(1, 0.4);
  yield* all(pApp().scale(1, 0.5, easeOutBack), pDb().scale(1, 0.5, easeOutBack));
  yield* pStats().opacity(1, 0.4);

  // all traffic piles onto the one DB
  yield* pEdgeLine().end(1, 0.4);
  yield* all(pReadPct(100, 1.2), pWriteN(1, 1.0));
  for (let i = 0; i < 2; i++) {
    pEdgeDot().position([-228, -420]).opacity(1);
    yield* pEdgeDot().position([232, -420], 0.5);
    pEdgeDot().opacity(0);
  }

  // the single DB dies — it is a single point of failure
  yield* all(pX().scale(1, 0.5, easeOutBack).to(1, 0), pX().opacity(1, 0.3));
  yield* waitFor(0.8);

  // STATE 2: solution — primary streams to replicas
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(sApp().scale(1, 0.5, easeOutBack), primary().scale(1, 0.6, easeOutBack));
  yield* sWriteEdge().end(1, 0.3);
  yield* all(sRep[0]().scale(1, 0.4, easeOutBack), sRep[1]().scale(1, 0.4, easeOutBack));
  yield* sStats().opacity(1, 0.4);

  // draw replication + read edges
  yield* all(
    sReplLine[0]().end(1, 0.35),
    sReplLine[1]().end(1, 0.35),
    sReadLine[0]().end(1, 0.35),
    sReadLine[1]().end(1, 0.35),
  );

  // writes -> primary -> replicate to replicas (two passes)
  for (let pass = 0; pass < 2; pass++) {
    sWriteDot().position([-300, 350]).opacity(1);
    yield* sWriteDot().position([-160, 350], 0.3);
    sWriteDot().opacity(0);
    yield* all(
      ...sReplDot.map((dot, i) => {
        const from = new Vector2([95, 320 + i * 60]);
        const to = new Vector2([235, sRepY[i]]);
        dot().position(from).opacity(1);
        return (function* () {
          yield* dot().position(to, 0.32);
          dot().opacity(0);
        })();
      }),
    );
  }

  // reads fan from app out across both replicas (spread)
  for (let pass = 0; pass < 2; pass++) {
    yield* all(
      ...sReadDot.map((dot, i) => {
        const from = new Vector2([-400, 405]);
        const to = new Vector2([270, sRepY[i]]);
        dot().position(from).opacity(1);
        return (function* () {
          yield* dot().position(to, 0.42);
          dot().opacity(0);
        })();
      }),
    );
  }

  // settle — END with BOTH panels fully visible (poster frame)
  yield* waitFor(1.6);
});
