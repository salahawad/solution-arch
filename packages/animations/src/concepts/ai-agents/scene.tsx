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

  // PROBLEM — a single call can only emit text, it can't act
  const pPill = createRef<Layout>();
  const pUser = createRef<Rect>();
  const pLlm = createRef<Rect>();
  const pAns = createRef<Rect>();
  const pE1 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pE2 = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pTask = createRef<Txt>();
  const pStats = createRef<Layout>();

  // SOLUTION — an agent loops with tools
  const sPill = createRef<Layout>();
  const sAgent = createRef<Rect>();
  const sLoop = createRef<Line>();
  const sLoopLabel = createRef<Txt>();
  const sTools = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sEdges = [
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
  ];
  const sDone = createRef<Layout>();
  const sStats = createRef<Layout>();

  const toolNames = ['search', 'code', 'api'];
  const toolY = [250, 390, 530];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="AI "
        titleB="Agents"
        subtitle="a model that loops with tools — so it can act, not just talk"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — one-shot, no tools ============ */}
      <SectionPill ref={pPill} variant="problem" label="ONE-SHOT" note="a single completion can only emit text — it can't take action" position={[-10, -650]} />

      <GlowNode ref={pUser} label="USER" accent={C.teal} width={190} height={92} fontSize={28} position={[-380, -440]} />
      <Txt ref={pTask} text="task: book flight + email me" fill={C.muted} fontFamily={F.mono} fontSize={22} position={[-300, -350]} offset={[-1, 0]} />

      <FlowEdge lineRef={pE1.line} dotRef={pE1.dot} from={[-285, -440]} to={[-110, -440]} color={C.teal} />
      <GlowNode ref={pLlm} label="LLM" accent={C.teal} width={190} height={110} fontSize={34} position={[0, -440]} />
      <FlowEdge lineRef={pE2.line} dotRef={pE2.dot} from={[95, -440]} to={[270, -440]} color={C.coral} />
      <GlowNode ref={pAns} label="TEXT ONLY" accent={C.coral} labelColor={C.text} width={210} height={92} fontSize={24} position={[390, -440]} />

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="ACTIONS" value="0" accent={C.coral} width={300} />
        <StatCard label="TOOLS" value="none" accent={C.coral} width={300} />
        <StatCard label="TASK" value="incomplete" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — agent loop with tools ============ */}
      <SectionPill ref={sPill} variant="solution" label="AGENT LOOP" note="reason, call a tool, observe, repeat — until the task is done" position={[-10, 70]} />

      {/* the loop arrow returning into the agent (think -> act -> observe) —
          bows out to the LEFT of the agent and lands its arrowhead on the
          agent's left edge (x=-155), never piercing the box */}
      <Line
        ref={sLoop}
        points={[[-155, 340], [-300, 346], [-358, 390], [-300, 434], [-160, 440]]}
        stroke={C.amber}
        lineWidth={4}
        shadowColor={C.amber}
        shadowBlur={theme.glow}
        endArrow
        arrowSize={15}
        end={0}
      />
      <Txt ref={sLoopLabel} text="loop" fill={C.amber} fontFamily={F.mono} fontSize={22} letterSpacing={2} position={[-415, 390]} />

      <GlowNode ref={sAgent} label="AGENT" accent={C.teal} width={230} height={130} fontSize={34} position={[-40, 390]} />

      {/* tools the agent can call */}
      {toolY.map((y, i) => (
        <FlowEdge lineRef={sEdges[i].line} dotRef={sEdges[i].dot} from={[80, 390]} to={[205, y]} color={C.teal} />
      ))}
      {toolNames.map((name, i) => (
        <GlowNode ref={sTools[i]} label={name} accent={C.teal} labelColor={C.muted} width={180} height={66} fontSize={26} position={[300, toolY[i]]} />
      ))}

      <Layout ref={sDone} layout padding={[8, 22]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} position={[-40, 575]}>
        <Txt text="task done" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 720]} gap={22}>
        <StatCard label="LOOP" value="bounded" accent={C.teal} width={300} />
        <StatCard label="TOOLS" value="3 tools" accent={C.teal} width={300} />
        <StatCard label="TASK" value="done" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pUser, pLlm, pAns, sAgent]) r().scale(0);
  for (const r of sTools) r().scale(0);
  pTask().opacity(0);
  sLoopLabel().opacity(0);
  sDone().opacity(0).scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: task -> single LLM call -> text only, can't act
  yield* pPill().opacity(1, 0.4);
  yield* all(pUser().scale(1, 0.45, easeOutBack), pLlm().scale(1, 0.45, easeOutBack));
  yield* pTask().opacity(1, 0.3);
  yield* pE1.line().end(1, 0.3);
  pE1.dot().position([-285, -440]).opacity(1);
  yield* pE1.dot().position([-110, -440], 0.35);
  pE1.dot().opacity(0);
  yield* all(pAns().scale(1, 0.45, easeOutBack), pE2.line().end(1, 0.3));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: the agent + its tools, then the loop
  yield* sPill().opacity(1, 0.4);
  yield* sAgent().scale(1, 0.5, easeOutBack);
  yield* all(...sTools.map(r => r().scale(1, 0.4, easeOutBack)));
  yield* all(...sEdges.map(e => e.line().end(1, 0.3)));
  yield* sStats().opacity(1, 0.4);

  // run the loop: call each tool and observe the result come back
  for (let i = 0; i < sEdges.length; i++) {
    const e = sEdges[i];
    e.dot().position([80, 390]).opacity(1);
    yield* e.dot().position([205, toolY[i]], 0.28); // act: call the tool
    yield* e.dot().position([80, 390], 0.28); // observe: result returns
    e.dot().opacity(0);
  }
  // draw the loop arrow + label as the cycle closes
  yield* all(sLoop().end(1, 0.6, easeOutCubic), sLoopLabel().opacity(1, 0.4));
  // task completes
  yield* all(sDone().opacity(1, 0.4), sDone().scale(1, 0.4, easeOutBack));

  yield* waitFor(1.8);
});
