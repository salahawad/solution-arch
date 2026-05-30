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

  // problem panel
  const pPill = createRef<Layout>();
  const pWrite = createRef<Rect>();
  const pRead = createRef<Rect>();
  const pRecord = createRef<Rect>();
  const pRecordVal = createSignal('v1: $100');
  const pX = createRef<Node>();
  const pWriteEdge = createRef<Line>();
  const pWriteDot = createRef<Circle>();
  const pReadEdge = createRef<Line>();
  const pReadDot = createRef<Circle>();
  const pStats = createRef<Layout>();

  // solution panel
  const sPill = createRef<Layout>();
  const sWrite = createRef<Rect>();
  const log = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const proj = createRef<Rect>();
  const sStats = createRef<Layout>();
  const sLogEdge = createRef<Line>();
  const sLogDot = createRef<Circle>();
  const sProjEdge = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sProjDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  // stacked event rows inside the append-only log
  const evt = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const evtY = [-50, 16, 82];
  const evtLabel = ['+$100 deposit', '-$30 withdraw', '+$50 deposit'];

  // ---- metric signals --------------------------------------------------
  const pHistory = createSignal(0); // versions kept
  const sEvents = createSignal(0); // events appended

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Event "
        titleB="Sourcing"
        subtitle="store the changes, not just the current state"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — MUTABLE RECORD (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="UPDATE IN PLACE" note="overwrite the row, the past is gone" position={[-30, -660]} />

      <GlowNode ref={pWrite} label="WRITE" accent={C.coral} width={180} height={84} position={[-360, -520]} />
      <GlowNode ref={pRead} label="READ" accent={C.coral} width={180} height={84} position={[-360, -340]} />

      {/* the single mutable record — overwritten in place */}
      <Rect
        ref={pRecord}
        position={[120, -430]}
        size={[330, 150]}
        radius={theme.radius}
        fill={C.panel}
        stroke={C.coral}
        lineWidth={2.5}
        shadowColor={C.coral}
        shadowBlur={theme.glow}
        layout
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap={10}
      >
        <Txt text="RECORD" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        <Txt text={() => pRecordVal()} fill={C.text} fontFamily={F.mono} fontWeight={700} fontSize={36} />
      </Rect>

      {/* both read + write contend on the same record */}
      <FlowEdge lineRef={pWriteEdge} dotRef={pWriteDot} from={[-270, -520]} to={[-50, -460]} color={C.coral} />
      <FlowEdge lineRef={pReadEdge} dotRef={pReadDot} from={[-270, -340]} to={[-50, -400]} color={C.coral} />

      {/* the "history lost" X */}
      <Node ref={pX} position={[120, -360]}>
        <Line points={[[-24, -24], [24, 24]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[24, -24], [-24, 24]]} stroke={C.coral} lineWidth={6} />
        <Txt text="HISTORY LOST" fill={C.coral} fontFamily={F.mono} fontSize={22} letterSpacing={2} y={48} />
      </Node>

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="HISTORY" value="lost" accent={C.coral} width={300} />
        <StatCard label="VERSIONS" value={() => `${Math.round(pHistory())} kept`} accent={C.coral} width={300} />
        <StatCard label="READS" value="contend" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — EVENT LOG + PROJECTION (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="APPEND-ONLY LOG" note="every change is an immutable event" position={[-10, 70]} />

      <GlowNode ref={sWrite} label="WRITE" accent={C.teal} width={180} height={84} position={[-400, 360]} />

      {/* the append-only event log — stacked immutable events */}
      <Rect
        ref={log}
        position={[-100, 360]}
        size={[300, 250]}
        radius={theme.radius}
        fill={C.panel}
        stroke={C.teal}
        lineWidth={2.5}
        shadowColor={C.teal}
        shadowBlur={theme.glow}
      >
        <Txt text="EVENT LOG" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} y={-100} />
        {evtLabel.map((lbl, i) => (
          <Rect
            ref={evt[i]}
            key={`evt-${i}`}
            position={[0, evtY[i]]}
            size={[250, 56]}
            radius={12}
            fill={`${C.teal}18`}
            stroke={C.teal}
            lineWidth={2}
            layout
            alignItems="center"
            justifyContent="center"
            opacity={0}
          >
            <Txt text={lbl} fill={C.text} fontFamily={F.mono} fontSize={24} fontWeight={500} />
          </Rect>
        ))}
      </Rect>

      {/* sonar-pulsing projection (read model) rebuilt by replay */}
      <BalancerNode ref={proj} ringRef={ring} ring2Ref={ring2} position={[300, 360]} label="PROJECTION" sub="read model" />

      <FlowEdge lineRef={sLogEdge} dotRef={sLogDot} from={[-290, 360]} to={[-260, 360]} color={C.teal} />
      <FlowEdge lineRef={sProjEdge[0]} dotRef={sProjDot[0]} from={[55, 320]} to={[175, 330]} color={C.teal} />
      <FlowEdge lineRef={sProjEdge[1]} dotRef={sProjDot[1]} from={[55, 360]} to={[175, 360]} color={C.teal} />
      <FlowEdge lineRef={sProjEdge[2]} dotRef={sProjDot[2]} from={[55, 400]} to={[175, 390]} color={C.teal} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="EVENTS" value="appended" accent={C.teal} width={300} />
        <StatCard label="APPENDED" value={() => `${Math.round(sEvents())} kept`} accent={C.teal} width={300} />
        <StatCard label="PROJECTION" value="fast reads" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pWrite, pRead, pRecord, sWrite, log, proj]) r().scale(0);
  pX().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem — a mutable record overwritten in place
  yield* pPill().opacity(1, 0.4);
  yield* all(pWrite().scale(1, 0.5, easeOutBack), pRead().scale(1, 0.5, easeOutBack));
  yield* pRecord().scale(1, 0.5, easeOutBack);
  yield* pStats().opacity(1, 0.4);

  yield* all(pWriteEdge().end(1, 0.4), pReadEdge().end(1, 0.4));

  // overwrite the record in place — each write destroys the previous value
  const versions = ['v2: $70', 'v3: $120'];
  for (let i = 0; i < versions.length; i++) {
    pWriteDot().position([-270, -520]).opacity(1);
    yield* pWriteDot().position([-50, -460], 0.5);
    pWriteDot().opacity(0);
    // flash the record coral as the previous state is overwritten
    yield* all(
      pRecord().scale(1.06, 0.12).to(1, 0.18),
      pRecordVal(versions[i], 0),
    );
    yield* waitFor(0.2);
  }
  // only the latest version survives — history is lost
  yield* all(pX().scale(1, 0.5, easeOutBack), pX().opacity(1, 0.3));
  // a read contends on the very same record
  pReadDot().position([-270, -340]).opacity(1);
  yield* pReadDot().position([-50, -400], 0.5);
  pReadDot().opacity(0);
  yield* waitFor(0.6);

  // STATE 2: solution — append immutable events, project a read model
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(sWrite().scale(1, 0.5, easeOutBack), log().scale(1, 0.6, easeOutBack), proj().scale(1, 0.6, easeOutBack));
  yield* sStats().opacity(1, 0.4);

  yield* sLogEdge().end(1, 0.3);

  // append each event to the log — nothing is overwritten, only added
  for (let i = 0; i < evt.length; i++) {
    sLogDot().position([-290, 360]).opacity(1);
    yield* sLogDot().position([-260, 360], 0.28);
    sLogDot().opacity(0);
    yield* all(
      evt[i]().opacity(1, 0.3),
      evt[i]().scale(0.85, 0).to(1, 0.3, easeOutBack),
      sEvents(i + 1, 0.3),
    );
    yield* waitFor(0.15);
  }

  // replay the log into the projection read model
  yield* all(sProjEdge[0]().end(1, 0.35), sProjEdge[1]().end(1, 0.35), sProjEdge[2]().end(1, 0.35));
  for (let i = 0; i < 3; i++) {
    const from = new Vector2([55, 320 + i * 40]);
    const to = new Vector2([175, 330 + i * 30]);
    sProjDot[i]().position(from).opacity(1);
    yield* sProjDot[i]().position(to, 0.3);
    sProjDot[i]().opacity(0);
  }

  // settle — BOTH panels fully visible & static (this is the poster frame).
  // Hold long and steady (no looping dot motion) so any sampled frame in the
  // first play-through lands on the complete, settled diagram — mirroring the
  // stable end-hold of the load-balancing scene.
  yield* waitFor(4);
});
