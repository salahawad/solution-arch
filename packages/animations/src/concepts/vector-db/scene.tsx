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
import {TitleBlock, SectionPill, GlowNode, FlowEdge, StatCard, StatRow} from '../../components';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);

  view.add(
    <Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />,
  );

  // ---- refs ------------------------------------------------------------
  const title = createRef<Layout>();

  // PROBLEM — keyword search matches tokens, not meaning
  const pPill = createRef<Layout>();
  const pQuery = createRef<Rect>();
  const pIndex = createRef<Rect>();
  const pResult = createRef<Rect>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pQcap = createRef<Txt>();
  const pMissed = createRef<Layout>();
  const pStats = createRef<Layout>();

  // SOLUTION — vector space, nearest neighbours
  const sPill = createRef<Layout>();
  const sQcap = createRef<Txt>();
  const sHood = createRef<Circle>();
  const sFar = Array.from({length: 8}, () => createRef<Circle>());
  const sNear = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const sLinks = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sQuery = createRef<Circle>();
  const sQueryRing = createRef<Circle>();
  const sNearLabel = createRef<Layout>();
  const sTopk = createRef<Txt>();
  const sStats = createRef<Layout>();

  const Q: [number, number] = [-45, 395];
  const far: [number, number][] = [
    [-290, 300], [170, 290], [250, 430], [-250, 520],
    [140, 560], [-150, 270], [235, 540], [-275, 430],
  ];
  const near: [number, number][] = [[30, 330], [-140, 455], [70, 480]];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Vector "
        titleB="Database"
        subtitle="search by meaning — the nearest vectors are the closest matches"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — keyword search ============ */}
      <SectionPill ref={pPill} variant="problem" label="KEYWORD SEARCH" note="matches tokens, not meaning" position={[-10, -650]} />

      <GlowNode ref={pQuery} label="QUERY" accent={C.teal} width={200} height={92} fontSize={28} position={[-370, -440]} />
      <Txt ref={pQcap} text="“affordable laptop”" fill={C.muted} fontFamily={F.mono} fontSize={22} position={[-370, -362]} />

      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-270, -440]} to={[-110, -440]} color={C.teal} />
      <GlowNode ref={pIndex} label="KEYWORD" accent={C.teal} width={200} height={110} fontSize={28} position={[0, -440]} />
      <FlowEdge lineRef={pE2.line} dotRef={pE2.dot} from={[100, -440]} to={[270, -440]} color={C.coral} />
      <GlowNode ref={pResult} label="0 matches" accent={C.coral} labelColor={C.text} width={210} height={92} fontSize={26} position={[390, -440]} />

      {/* the relevant doc that keyword search never finds */}
      <Layout ref={pMissed} layout padding={[8, 20]} radius={12} fill={`${C.coral}14`} stroke={C.coralDim} lineWidth={2} position={[0, -300]}>
        <Txt text="“cheap notebook”  ✗ missed" fill={C.coral} fontFamily={F.mono} fontSize={22} />
      </Layout>

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="MATCH" value="exact" accent={C.coral} width={300} />
        <StatCard label="RECALL" value="misses" accent={C.coral} width={300} />
        <StatCard label="RESULT" value="0 found" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — vector space ============ */}
      <SectionPill ref={sPill} variant="solution" label="VECTOR SEARCH" note="embed to vectors; nearest = most similar" position={[-10, 70]} />

      <Txt ref={sQcap} text="query: “affordable laptop”  →  embed  →  ●" fill={C.amber} fontFamily={F.mono} fontSize={24} position={[-40, 190]} />

      {/* neighbourhood radius around the query */}
      <Circle ref={sHood} position={Q} size={300} stroke={C.teal} lineWidth={2} lineDash={[6, 10]} opacity={0} />

      {/* far (dissimilar) docs */}
      {far.map((p, i) => (
        <Circle ref={sFar[i]} position={p} size={22} fill={C.mutedDim} opacity={0} />
      ))}

      {/* links query -> nearest neighbours */}
      {near.map((p, i) => (
        <Line ref={sLinks[i]} points={[Q, p]} stroke={C.teal} lineWidth={2.5} opacity={0.5} end={0} />
      ))}
      {/* nearest (similar) docs */}
      {near.map((p, i) => (
        <Circle ref={sNear[i]} position={p} size={30} fill={C.teal} shadowColor={C.teal} shadowBlur={14} opacity={0} />
      ))}

      {/* the query point */}
      <Circle ref={sQueryRing} position={Q} size={56} stroke={C.amber} lineWidth={3} opacity={0} />
      <Circle ref={sQuery} position={Q} size={30} fill={C.amber} shadowColor={C.amber} shadowBlur={18} scale={0} />

      <Layout ref={sNearLabel} layout padding={[6, 16]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[160, 330]}>
        <Txt text="“cheap notebook” ✓" fill={C.teal} fontFamily={F.mono} fontWeight={600} fontSize={20} />
      </Layout>
      <Txt ref={sTopk} text="top-3 nearest" fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={1} position={[-45, 580]} />

      <StatRow ref={sStats} position={[0, 720]} gap={22}>
        <StatCard label="SEARCH" value="by meaning" accent={C.teal} width={300} />
        <StatCard label="INDEX" value="HNSW ANN" accent={C.teal} width={300} />
        <StatCard label="TOP-K" value="3 nearest" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pQuery, pIndex, pResult]) r().scale(0);
  pQcap().opacity(0);
  pMissed().opacity(0).scale(0.8);
  sQcap().opacity(0);
  sNearLabel().opacity(0).scale(0.8);
  sTopk().opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: keyword query finds nothing; the paraphrase is missed
  yield* pPill().opacity(1, 0.4);
  yield* all(pQuery().scale(1, 0.45, easeOutBack), pIndex().scale(1, 0.45, easeOutBack));
  yield* pQcap().opacity(1, 0.3);
  yield* pE1.line().end(1, 0.3);
  pE1.dot().position([-270, -440]).opacity(1);
  yield* pE1.dot().position([-110, -440], 0.3);
  pE1.dot().opacity(0);
  yield* all(pResult().scale(1, 0.45, easeOutBack), pE2.line().end(1, 0.3));
  yield* all(pMissed().opacity(1, 0.4), pMissed().scale(1, 0.4, easeOutBack));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: embed into a space, find nearest neighbours
  yield* sPill().opacity(1, 0.4);
  yield* sQcap().opacity(1, 0.4);
  // the doc cloud fades in
  yield* all(...sFar.map(r => r().opacity(0.7, 0.5)));
  // the query lands in the space
  yield* all(sQuery().scale(1, 0.5, easeOutBack), sQueryRing().opacity(1, 0.4));
  yield* sStats().opacity(1, 0.4);
  // the neighbourhood expands and the nearest neighbours light up
  yield* sHood().opacity(0.45, 0.5);
  yield* all(
    ...sNear.map(r => r().opacity(1, 0.4)),
    ...sLinks.map(l => l().end(1, 0.5, easeOutCubic)),
  );
  yield* all(sNearLabel().opacity(1, 0.4), sNearLabel().scale(1, 0.4, easeOutBack), sTopk().opacity(1, 0.4));

  yield* waitFor(1.8);
});
