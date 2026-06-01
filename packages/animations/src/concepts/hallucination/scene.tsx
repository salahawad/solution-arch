import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  all,
  waitFor,
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

  // PROBLEM — the model answers fluently and fabricates the gap
  const pPill = createRef<Layout>();
  const pUser = createRef<Rect>();
  const pLlm = createRef<Rect>();
  const pAns = createRef<Rect>();
  const pQ = createRef<Txt>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pWarn = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — retrieve sources, cite them, and allow abstaining
  const sPill = createRef<Layout>();
  const sUser = createRef<Rect>();
  const sLlm = createRef<Rect>();
  const sSrc = createRef<Node>();
  const sAns = createRef<Rect>();
  const sCite = createRef<Layout>();
  const sAbstain = createRef<Layout>();
  const sE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sE3 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sStats = createRef<Layout>();

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Hallucination"
        subtitle="the model states false things with total confidence — design for it"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — confident & wrong ============ */}
      <SectionPill ref={pPill} variant="problem" label="CONFIDENT & WRONG" note="fluent, confident, and wrong" position={[-10, -650]} />

      <GlowNode ref={pUser} label="USER" accent={C.teal} width={190} height={92} fontSize={28} position={[-360, -440]} />
      <Txt ref={pQ} text="Q: cite a study on X" fill={C.muted} fontFamily={F.mono} fontSize={22} position={[-360, -362]} />

      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-265, -440]} to={[-110, -440]} color={C.teal} />
      <GlowNode ref={pLlm} label="LLM" accent={C.teal} width={190} height={110} fontSize={34} position={[0, -440]} />

      {/* LLM -> answer hop, flagged with a coral warning marker */}
      <FlowEdge lineRef={pE2.line} dotRef={pE2.dot} from={[95, -440]} to={[280, -440]} color={C.coral} />
      <Node ref={pWarn} position={[192, -440]}>
        <Line points={[[0, -30], [28, 22], [-28, 22]]} closed stroke={C.coral} lineWidth={5} fill={`${C.coral}22`} shadowColor={C.coral} shadowBlur={theme.glow} />
        <Txt text="!" fill={C.coral} fontFamily={F.sans} fontWeight={800} fontSize={32} y={6} />
      </Node>

      <GlowNode ref={pAns} label="false" labelColor={C.text} accent={C.coral} width={210} height={92} fontSize={28} position={[385, -440]} />
      <Txt text="fabricated" fill={C.coral} fontFamily={F.mono} fontSize={22} position={[385, -362]} />

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="CONFIDENCE" value="high" accent={C.coral} width={300} />
        <StatCard label="ACCURACY" value="wrong" accent={C.coral} width={300} />
        <StatCard label="TRUST" value="misplaced" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — ground it ============ */}
      <SectionPill ref={sPill} variant="solution" label="GROUND IT" note="retrieve sources, cite them, and let it say 'I don't know'" position={[-10, 70]} />

      <GlowNode ref={sUser} label="USER" accent={C.teal} width={170} height={88} fontSize={26} position={[-420, 360]} />
      <FlowEdge lineRef={sE1.line} dotRef={sE1.dot} from={[-335, 360]} to={[-210, 360]} color={C.teal} />

      {/* the LLM, now backed by retrieved sources */}
      <GlowNode ref={sLlm} label="LLM" accent={C.teal} width={150} height={110} fontSize={30} position={[-120, 360]} />

      {/* abstain path: it can say "I don't know" when grounding is missing */}
      <Layout ref={sAbstain} layout padding={[8, 18]} radius={999} fill={`${C.amber}22`} stroke={C.amber} lineWidth={2} position={[-120, 470]}>
        <Txt text="I don't know" fill={C.amber} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={1} />
      </Layout>

      {/* SOURCES feed the LLM (retrieved grounding) */}
      <DbNode ref={sSrc} label="SOURCES" sub="retrieved" accent={C.teal} width={170} height={150} position={[120, 300]} />
      <FlowEdge lineRef={sE2.line} dotRef={sE2.dot} from={[120, 225]} to={[-50, 340]} color={C.teal} />

      {/* LLM -> grounded answer */}
      <FlowEdge lineRef={sE3.line} dotRef={sE3.dot} from={[-45, 360]} to={[290, 360]} color={C.teal} />
      <GlowNode ref={sAns} label="grounded" labelColor={C.text} accent={C.teal} width={200} height={96} fontSize={26} position={[400, 360]} />
      <Layout ref={sCite} layout padding={[6, 16]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[400, 462]}>
        <Txt text="cited [1][2]" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={20} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="GROUNDING" value="retrieved" accent={C.teal} width={300} />
        <StatCard label="CITATIONS" value="shown" accent={C.teal} width={300} />
        <StatCard label="ABSTAIN" value="when unsure" accent={C.amber} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pUser, pLlm, pAns, sUser, sLlm, sAns]) r().scale(0);
  sSrc().scale(0);
  pWarn().scale(0).opacity(0);
  for (const r of [pQ]) r().opacity(0);
  sCite().opacity(0).scale(0.8);
  sAbstain().opacity(0).scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: question -> fluent LLM -> confident, fabricated answer
  yield* pPill().opacity(1, 0.4);
  yield* all(pUser().scale(1, 0.45, easeOutBack), pLlm().scale(1, 0.45, easeOutBack));
  yield* pQ().opacity(1, 0.3);
  yield* pE1.line().end(1, 0.3);
  pE1.dot().position([-265, -440]).opacity(1);
  yield* pE1.dot().position([-110, -440], 0.35);
  pE1.dot().opacity(0);

  // the answer pops out coral, with a warning marker over the hop
  yield* all(pAns().scale(1, 0.45, easeOutBack), pE2.line().end(1, 0.3));
  pE2.dot().position([95, -440]).opacity(1);
  yield* pE2.dot().position([280, -440], 0.35);
  pE2.dot().opacity(0);
  yield* all(pWarn().scale(1, 0.5, easeOutBack), pWarn().opacity(1, 0.4));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: ground the model in retrieved sources, cite them, allow abstaining
  yield* sPill().opacity(1, 0.4);
  yield* all(sUser().scale(1, 0.45, easeOutBack), sLlm().scale(1, 0.45, easeOutBack));
  yield* sE1.line().end(1, 0.3);
  sE1.dot().position([-335, 360]).opacity(1);
  yield* sE1.dot().position([-210, 360], 0.3);
  sE1.dot().opacity(0);

  // sources appear and feed grounding into the LLM
  yield* sSrc().scale(1, 0.5, easeOutBack);
  yield* sE2.line().end(1, 0.3);
  sE2.dot().position([120, 225]).opacity(1);
  yield* sE2.dot().position([-50, 340], 0.35);
  sE2.dot().opacity(0);

  // the abstain pill surfaces — it can decline when grounding is missing
  yield* all(sAbstain().opacity(1, 0.4), sAbstain().scale(1, 0.4, easeOutBack));

  // LLM emits a grounded, cited answer
  yield* all(sAns().scale(1, 0.45, easeOutBack), sE3.line().end(1, 0.3));
  sE3.dot().position([-45, 360]).opacity(1);
  yield* sE3.dot().position([290, 360], 0.35);
  sE3.dot().opacity(0);
  yield* all(sCite().opacity(1, 0.4), sCite().scale(1, 0.4, easeOutBack));
  yield* sStats().opacity(1, 0.4);

  // tint settled-healthy solution nodes so the grounded frame reads as the densest, lit one
  yield* all(
    sAns().fill(`${C.teal}22`, 0.4),
    sLlm().fill(`${C.teal}22`, 0.4),
  );

  yield* waitFor(1.8);
});
