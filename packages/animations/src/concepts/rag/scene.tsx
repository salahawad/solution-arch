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

  view.add(
    <Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — the model answers from frozen weights and invents the gap
  const pPill = createRef<Layout>();
  const pUser = createRef<Rect>();
  const pLlm = createRef<Rect>();
  const pAns = createRef<Rect>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pFrozen = createRef<Txt>();
  const pQ = createRef<Txt>();
  const pStats = createRef<Layout>();

  // SOLUTION — retrieve relevant docs, then answer from them
  const sPill = createRef<Layout>();
  const sUser = createRef<Rect>();
  const sKb = createRef<Node>();
  const sDocs = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sLlm = createRef<Rect>();
  const sAns = createRef<Rect>();
  const sE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sE3 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sCtxLabel = createRef<Txt>();
  const sCite = createRef<Layout>();
  const sStats = createRef<Layout>();

  const docY = [300, 360, 420];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="RAG"
        subtitle="ground the model in retrieved facts, not its frozen training data"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — no grounding ============ */}
      <SectionPill ref={pPill} variant="problem" label="NO GROUNDING" note="the model answers from frozen training data" position={[-10, -650]} />

      <GlowNode ref={pUser} label="USER" accent={C.teal} width={190} height={92} fontSize={28} position={[-380, -440]} />
      <Txt ref={pQ} text="Q: refund policy?" fill={C.muted} fontFamily={F.mono} fontSize={22} position={[-380, -362]} />

      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-285, -440]} to={[-110, -440]} color={C.teal} />
      <GlowNode ref={pLlm} label="LLM" accent={C.teal} width={190} height={110} fontSize={34} position={[0, -440]} />
      <Txt ref={pFrozen} text="frozen weights" fill={C.mutedDim} fontFamily={F.mono} fontSize={20} position={[0, -362]} />

      <FlowEdge lineRef={pE2.line} dotRef={pE2.dot} from={[95, -440]} to={[270, -440]} color={C.coral} />
      <GlowNode ref={pAns} label="ANSWER" accent={C.coral} labelColor={C.text} width={200} height={92} fontSize={26} position={[385, -440]} />

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="KNOWLEDGE" value="frozen" accent={C.coral} width={300} />
        <StatCard label="FRESHNESS" value="stale" accent={C.coral} width={300} />
        <StatCard label="ANSWER" value="made up" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — RAG ============ */}
      <SectionPill ref={sPill} variant="solution" label="RAG" note="retrieve the top-k docs, then answer from that context — with citations" position={[-10, 70]} />

      <GlowNode ref={sUser} label="USER" accent={C.teal} width={160} height={84} fontSize={26} position={[-440, 360]} />
      <FlowEdge lineRef={sE1.line} dotRef={sE1.dot} from={[-360, 360]} to={[-300, 360]} color={C.teal} />

      {/* knowledge base / vector store */}
      <DbNode ref={sKb} label="KB" sub="vector store" accent={C.teal} width={150} height={150} position={[-225, 360]} />

      {/* retrieved top-k context chunks */}
      <Txt ref={sCtxLabel} text="top-k context" fill={C.muted} fontFamily={F.mono} fontSize={20} letterSpacing={1} position={[-50, 250]} />
      {docY.map((y, i) => (
        <Rect ref={sDocs[i]} position={[-50, y]} width={150} height={42} radius={8} fill={`${C.teal}1F`} stroke={C.teal} lineWidth={2}>
          <Txt text={`doc ${i + 1}`} fill={C.teal} fontFamily={F.mono} fontSize={20} />
        </Rect>
      ))}
      {/* KB feeds the context, context feeds the LLM */}
      <FlowEdge lineRef={sE2.line} dotRef={sE2.dot} from={[-150, 360]} to={[-130, 360]} color={C.teal} />
      <FlowEdge lineRef={sE3.line} dotRef={sE3.dot} from={[30, 360]} to={[120, 360]} color={C.teal} />

      <GlowNode ref={sLlm} label="LLM" accent={C.teal} width={150} height={110} fontSize={30} position={[210, 360]} />

      <Line points={[[285, 360], [330, 360]]} stroke={C.teal} lineWidth={3} opacity={0.5} lineDash={[2, 12]} endArrow arrowSize={12} />
      <GlowNode ref={sAns} label="ANSWER" accent={C.teal} labelColor={C.text} width={170} height={96} fontSize={24} position={[430, 300]} />
      <Layout ref={sCite} layout padding={[6, 16]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[430, 400]}>
        <Txt text="cited [1][2]" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={20} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="SOURCE" value="retrieved" accent={C.teal} width={300} />
        <StatCard label="GROUNDED" value="yes" accent={C.teal} width={300} />
        <StatCard label="ANSWER" value="cited" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pUser, pLlm, pAns, sUser, sLlm, sAns]) r().scale(0);
  sKb().scale(0);
  for (const r of sDocs) r().scale(0).opacity(0);
  for (const r of [pFrozen, pQ, sCtxLabel]) r().opacity(0);
  sCite().opacity(0).scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: question -> frozen LLM -> made-up answer
  yield* pPill().opacity(1, 0.4);
  yield* all(pUser().scale(1, 0.45, easeOutBack), pLlm().scale(1, 0.45, easeOutBack));
  yield* all(pQ().opacity(1, 0.3), pFrozen().opacity(1, 0.3));
  yield* pE1.line().end(1, 0.3);
  pE1.dot().position([-285, -440]).opacity(1);
  yield* pE1.dot().position([-110, -440], 0.35);
  pE1.dot().opacity(0);
  yield* all(pAns().scale(1, 0.45, easeOutBack), pE2.line().end(1, 0.3));
  pE2.dot().position([95, -440]).opacity(1);
  yield* pE2.dot().position([270, -440], 0.35);
  pE2.dot().opacity(0);
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: retrieve top-k, feed as context, grounded answer
  yield* sPill().opacity(1, 0.4);
  yield* all(sUser().scale(1, 0.45, easeOutBack), sKb().scale(1, 0.5, easeOutBack));
  yield* sE1.line().end(1, 0.3);
  sE1.dot().position([-360, 360]).opacity(1);
  yield* sE1.dot().position([-300, 360], 0.25);
  sE1.dot().opacity(0);

  // retrieve: chunks pop out of the KB
  yield* sCtxLabel().opacity(1, 0.3);
  yield* all(...sDocs.map((r, i) => all(r().scale(1, 0.35, easeOutBack), r().opacity(1, 0.3))));
  yield* all(sE2.line().end(1, 0.25), sE3.line().end(1, 0.25));

  // context flows into the LLM, which emits a grounded, cited answer
  yield* sLlm().scale(1, 0.45, easeOutBack);
  sE3.dot().position([30, 360]).opacity(1);
  yield* sE3.dot().position([120, 360], 0.3);
  sE3.dot().opacity(0);
  yield* all(sAns().scale(1, 0.45, easeOutBack), sCite().opacity(1, 0.4), sCite().scale(1, 0.4, easeOutBack));
  yield* sStats().opacity(1, 0.4);

  yield* waitFor(1.8);
});
