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
import {TitleBlock, SectionPill, GlowNode, DbNode, FlowEdge, StatCard, StatRow} from '../../components';

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

  // PROBLEM — dual write: commit to DB, then publish to Kafka; crash between loses the event
  const pPill = createRef<Layout>();
  const pSvc = createRef<Rect>();
  const pDb = createRef<Node>();
  const pKafka = createRef<Rect>();
  const pCommit = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pPub = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pOk = createRef<Layout>();
  const pX = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — outbox: one txn writes orders + outbox; a relay publishes
  const sPill = createRef<Layout>();
  const sSvc = createRef<Rect>();
  const sDb = createRef<Node>();
  const sOutbox = createRef<Rect>();
  const sTxn = createRef<Rect>();
  const sRelay = createRef<Rect>();
  const sKafka = createRef<Rect>();
  const sWrite = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sPoll = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sPub = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sSent = createRef<Layout>();
  const sStats = createRef<Layout>();

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Outbox "
        titleB="Pattern"
        subtitle="commit the event with the data, then relay it"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — dual write ============ */}
      <SectionPill ref={pPill} variant="problem" label="DUAL WRITE" note="commit to DB, then publish — crash in between loses the event" position={[-10, -650]} />

      {/* SERVICE -> DB (commit, OK) */}
      <GlowNode ref={pSvc} label="SERVICE" accent={C.teal} width={210} height={104} fontSize={28} position={[-360, -430]} />
      <FlowEdge lineRef={pCommit.line} dotRef={pCommit.dot} from={[-255, -430]} to={[-140, -420]} color={C.teal} />
      <DbNode ref={pDb} label="DB" accent={C.teal} width={150} height={150} position={[-40, -420]} />

      {/* commit OK tag under the DB */}
      <Layout ref={pOk} layout padding={[6, 18]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[-40, -315]}>
        <Txt text="commit OK" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={1} />
      </Layout>

      {/* SERVICE -> KAFKA (publish, broken mid-way) */}
      <FlowEdge lineRef={pPub.line} dotRef={pPub.dot} from={[-255, -440]} to={[255, -440]} color={C.coral} />
      <GlowNode ref={pKafka} label="KAFKA" labelColor={C.text} accent={C.coral} width={190} height={104} fontSize={28} position={[360, -430]} />

      {/* the "crash" X over the SERVICE->KAFKA publish hop */}
      <Node ref={pX} position={[60, -440]}>
        <Circle size={104} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-24, -24], [24, 24]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[24, -24], [-24, 24]]} stroke={C.coral} lineWidth={6} />
        <Txt text="crash" fill={C.coral} fontFamily={F.mono} fontSize={22} letterSpacing={2} y={82} />
      </Node>

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="DB" value="committed" accent={C.teal} width={300} />
        <StatCard label="EVENT" value="lost" accent={C.coral} width={300} />
        <StatCard label="STATE" value="inconsistent" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — outbox ============ */}
      <SectionPill ref={sPill} variant="solution" label="OUTBOX" note="one transaction writes orders + outbox; a relay publishes" position={[-10, 70]} />

      {/* the atomic transaction wrap around SERVICE -> DB(+outbox) */}
      <Rect ref={sTxn} position={[-275, 372]} size={[420, 320]} radius={20} fill={`${C.teal}0D`} stroke={C.teal} lineWidth={2.5} lineDash={[10, 10]} />
      <Txt text="1 TXN" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={3} position={[-275, 232]} />

      {/* SERVICE -> DB */}
      <GlowNode ref={sSvc} label="SERVICE" accent={C.teal} width={190} height={96} fontSize={26} position={[-400, 350]} />
      <FlowEdge lineRef={sWrite.line} dotRef={sWrite.dot} from={[-305, 350]} to={[-235, 350]} color={C.teal} />
      <DbNode ref={sDb} label="DB" accent={C.teal} width={150} height={150} position={[-150, 350]} />

      {/* the highlighted OUTBOX table, under/beside the DB */}
      <Rect ref={sOutbox} position={[-150, 478]} size={[170, 86]} radius={12} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2.5} shadowColor={C.teal} shadowBlur={theme.glow} layout direction="column" alignItems="center" justifyContent="center" gap={8} padding={[12, 0]}>
        <Txt text="OUTBOX" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={20} letterSpacing={2} />
        <Line points={[[-58, 0], [58, 0]]} stroke={C.teal} lineWidth={1.5} opacity={0.55} />
        <Line points={[[-58, 0], [58, 0]]} stroke={C.teal} lineWidth={1.5} opacity={0.55} />
      </Rect>

      {/* DB(outbox) -> RELAY (poll) */}
      <FlowEdge lineRef={sPoll.line} dotRef={sPoll.dot} from={[-65, 350]} to={[75, 350]} color={C.teal} />
      <GlowNode ref={sRelay} label="RELAY" accent={C.teal} width={150} height={96} fontSize={26} position={[150, 360]} />

      {/* RELAY -> KAFKA (publish) */}
      <FlowEdge lineRef={sPub.line} dotRef={sPub.dot} from={[225, 360]} to={[300, 360]} color={C.teal} />
      <GlowNode ref={sKafka} label="KAFKA" labelColor={C.text} accent={C.teal} width={180} height={96} fontSize={26} position={[400, 360]} />

      {/* sent tag under the kafka node */}
      <Layout ref={sSent} layout padding={[6, 18]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[400, 452]}>
        <Txt text="sent" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="WRITE" value="atomic" accent={C.teal} width={300} />
        <StatCard label="DELIVERY" value="at-least-once" accent={C.teal} width={300} />
        <StatCard label="LOST" value="none" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pSvc, pKafka, sSvc, sRelay, sKafka, sOutbox]) r().scale(0);
  pDb().scale(0);
  sDb().scale(0);
  pX().scale(0).opacity(0);
  pOk().opacity(0).scale(0.8);
  sSent().opacity(0).scale(0.8);
  sTxn().opacity(0).scale(0.92);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: dual write ---------------------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pSvc().scale(1, 0.5, easeOutBack),
    pDb().scale(1, 0.5, easeOutBack),
    pKafka().scale(1, 0.5, easeOutBack),
  );
  yield* pStats().opacity(1, 0.4);

  // step 1 — commit to DB succeeds
  yield* pCommit.line().end(1, 0.32);
  pCommit.dot().position([-255, -430]).opacity(1);
  yield* pCommit.dot().position([-140, -420], 0.4);
  pCommit.dot().opacity(0);
  yield* all(pOk().opacity(1, 0.4), pOk().scale(1, 0.4, easeOutBack));

  // step 2 — try to publish to Kafka, but crash mid-way: the event never arrives
  yield* pPub.line().end(1, 0.35);
  yield* all(pX().scale(1, 0.5, easeOutBack), pX().opacity(1, 0.4));
  // the publish dot leaves the service, then stalls at the crash point
  for (let i = 0; i < 2; i++) {
    pPub.dot().position([-255, -440]).opacity(1);
    yield* pPub.dot().position([50, -440], 0.55);
    pPub.dot().opacity(0);
  }

  yield* waitFor(0.9);

  // SOLUTION: outbox ------------------------------------------------------
  yield* sPill().opacity(1, 0.4);
  yield* all(
    sSvc().scale(1, 0.5, easeOutBack),
    sDb().scale(1, 0.5, easeOutBack),
    sRelay().scale(1, 0.5, easeOutBack),
    sKafka().scale(1, 0.5, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  // one transaction writes the order row + the outbox row together
  yield* all(sTxn().opacity(1, 0.4), sTxn().scale(1, 0.4, easeOutBack));
  yield* sWrite.line().end(1, 0.3);
  yield* all(sOutbox().scale(1, 0.5, easeOutBack));
  sWrite.dot().position([-305, 350]).opacity(1);
  yield* sWrite.dot().position([-235, 350], 0.3);
  sWrite.dot().opacity(0);

  // draw the relay -> kafka chain
  yield* all(sPoll.line().end(1, 0.3), sPub.line().end(1, 0.3));

  // a dot travels outbox -> relay -> kafka, and the message is marked sent
  for (let i = 0; i < 2; i++) {
    sPoll.dot().position([-65, 350]).opacity(1);
    yield* sPoll.dot().position([75, 350], 0.3);
    sPoll.dot().opacity(0);
    sPub.dot().position([225, 360]).opacity(1);
    yield* sPub.dot().position([300, 360], 0.26);
    sPub.dot().opacity(0);
    if (i === 0) {
      yield* all(sSent().opacity(1, 0.4), sSent().scale(1, 0.4, easeOutBack));
    }
  }

  // tint the settled-healthy kafka teal so the delivered frame out-inks the transients
  yield* sKafka().fill(`${C.teal}22`, 0.4);

  yield* waitFor(1.8);
});
