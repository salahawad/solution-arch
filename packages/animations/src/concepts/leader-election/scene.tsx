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
  ServerNode,
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

  // PROBLEM — three nodes, a network split, two believe they are leader
  const pPill = createRef<Layout>();
  const pNode = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pLoad = [createSignal(0), createSignal(0), createSignal(0)];
  const pCrown = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const pLinkLine = createRef<Line>();
  const pLinkCut = createRef<Node>();
  const pConflictLine = [createRef<Line>(), createRef<Line>()];
  const pConflictDot = [createRef<Circle>(), createRef<Circle>()];
  const pStats = createRef<Layout>();

  // SOLUTION — three nodes vote, one wins a majority and leads
  const sPill = createRef<Layout>();
  const cand = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sNode = [createRef<Rect>(), createRef<Rect>()];
  const sLoad = [createSignal(0), createSignal(0)];
  const sCrown = createRef<Node>();
  const sVoteLine = [createRef<Line>(), createRef<Line>()];
  const sVoteDot = [createRef<Circle>(), createRef<Circle>()];
  const sLeadEdge = [createRef<Line>(), createRef<Line>()];
  const sLeadDot = [createRef<Circle>(), createRef<Circle>()];
  const sStats = createRef<Layout>();

  // ---- metric signals --------------------------------------------------
  const pLeaders = createSignal(0);
  const sVotes = createSignal(0);

  // problem node positions: a triangle of peers
  const pP = [
    new Vector2([-330, -560]),
    new Vector2([330, -560]),
    new Vector2([0, -360]),
  ];
  // solution: candidate on the left, two followers on the right
  const sCandP = new Vector2([-300, 385]);
  const sFollowP = [new Vector2([300, 280]), new Vector2([300, 490])];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Leader "
        titleB="Election"
        subtitle="one writer, agreed by a majority"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — SPLIT BRAIN (problem) ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="SPLIT BRAIN"
        note="a network hiccup makes two nodes both think they lead"
        position={[-30, -700]}
      />

      {/* the healthy peer link, later cut */}
      <FlowEdge lineRef={pLinkLine} from={pP[0]} to={pP[1]} color={C.teal} />
      <Node ref={pLinkCut} position={[0, -560]} opacity={0}>
        <Circle size={92} stroke={C.coral} lineWidth={2} lineDash={[6, 10]} opacity={0.7} />
        <Line points={[[-22, -22], [22, 22]]} stroke={C.coral} lineWidth={6} />
        <Line points={[[22, -22], [-22, 22]]} stroke={C.coral} lineWidth={6} />
        <Txt text="NETWORK PARTITION" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} y={70} />
      </Node>

      <ServerNode ref={pNode[0]} name="node-1" load={pLoad[0]} width={250} position={pP[0]} />
      <ServerNode ref={pNode[1]} name="node-2" load={pLoad[1]} width={250} position={pP[1]} />
      <ServerNode ref={pNode[2]} name="node-3" load={pLoad[2]} width={250} position={pP[2]} />

      {/* LEADER crowns over node-1 and node-2 (coral = wrong) */}
      <Node ref={pCrown[0]} position={pP[0].addY(-78)} opacity={0} scale={0}>
        <Rect layout padding={[6, 16]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2}>
          <Txt text="LEADER" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        </Rect>
      </Node>
      <Node ref={pCrown[1]} position={pP[1].addY(-78)} opacity={0} scale={0}>
        <Rect layout padding={[6, 16]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2}>
          <Txt text="LEADER" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        </Rect>
      </Node>

      {/* conflicting writes streaming into node-3 from both "leaders" */}
      <FlowEdge lineRef={pConflictLine[0]} dotRef={pConflictDot[0]} from={pP[0]} to={pP[2].addY(-46)} color={C.coral} />
      <FlowEdge lineRef={pConflictLine[1]} dotRef={pConflictDot[1]} from={pP[1]} to={pP[2].addY(-46)} color={C.coral} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="LEADERS" value={() => `${Math.round(pLeaders())}`} accent={C.coral} width={300} />
        <StatCard label="STATE" value="SPLIT" accent={C.coral} width={300} />
        <StatCard label="WRITES" value="conflict" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — QUORUM (solution) ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="QUORUM"
        note="only a majority of votes elects the leader (Raft)"
        position={[-30, 70]}
      />

      {/* vote arrows from followers to the candidate */}
      <FlowEdge lineRef={sVoteLine[0]} dotRef={sVoteDot[0]} from={sFollowP[0]} to={[-175, 360]} color={C.teal} />
      <FlowEdge lineRef={sVoteLine[1]} dotRef={sVoteDot[1]} from={sFollowP[1]} to={[-175, 410]} color={C.teal} />

      <BalancerNode ref={cand} ringRef={ring} ring2Ref={ring2} position={sCandP} label="node-1" sub="candidate" />

      {/* LEADER crown over the winner (teal = correct) */}
      <Node ref={sCrown} position={sCandP.addY(-92)} opacity={0} scale={0}>
        <Rect layout padding={[6, 16]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2}>
          <Txt text="LEADER" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        </Rect>
      </Node>

      {/* leadership / replication out to the followers */}
      <FlowEdge lineRef={sLeadEdge[0]} dotRef={sLeadDot[0]} from={[-175, 360]} to={sFollowP[0]} color={C.teal} />
      <FlowEdge lineRef={sLeadEdge[1]} dotRef={sLeadDot[1]} from={[-175, 410]} to={sFollowP[1]} color={C.teal} />

      <ServerNode ref={sNode[0]} name="node-2" load={sLoad[0]} width={250} position={sFollowP[0]} />
      <ServerNode ref={sNode[1]} name="node-3" load={sLoad[1]} width={250} position={sFollowP[1]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="LEADER" value="1" accent={C.teal} width={300} />
        <StatCard label="QUORUM" value={() => `${Math.round(sVotes())} / 3`} accent={C.teal} width={300} />
        <StatCard label="FOLLOWERS" value="2" width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [...pNode, cand, ...sNode]) r().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem — three healthy peers, connected
  yield* pPill().opacity(1, 0.4);
  yield* all(
    pNode[0]().scale(1, 0.4, easeOutBack),
    pNode[1]().scale(1, 0.4, easeOutBack),
    pNode[2]().scale(1, 0.4, easeOutBack),
  );
  yield* all(pLoad[0](40, 0.5), pLoad[1](40, 0.5), pLoad[2](40, 0.5));
  yield* pLinkLine().end(1, 0.4);
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.4);

  // the network partition cuts the peer link
  yield* all(pLinkCut().opacity(1, 0.3), pLinkLine().opacity(0.12, 0.4));

  // each side now elects itself — two LEADER crowns appear (coral)
  yield* all(
    pCrown[0]().scale(1, 0.5, easeOutBack),
    pCrown[0]().opacity(1, 0.4),
    pCrown[1]().scale(1, 0.5, easeOutBack),
    pCrown[1]().opacity(1, 0.4),
    pLeaders(2, 0.6),
    pLoad[0](95, 0.6),
    pLoad[1](95, 0.6),
  );

  // both "leaders" write conflicting data into node-3 — each on its own edge
  yield* all(pConflictLine[0]().end(1, 0.4), pConflictLine[1]().end(1, 0.4));
  const pConflictFrom = [pP[0], pP[1]];
  const pConflictTo = pP[2].addY(-46);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 2; i++) {
      pConflictDot[i]().position(pConflictFrom[i]).opacity(1);
      yield* pConflictDot[i]().position(pConflictTo, 0.4);
      pConflictDot[i]().opacity(0);
    }
  }
  yield* all(pLoad[2](100, 0.5));
  yield* waitFor(0.8);

  // STATE 2: solution — a quorum vote elects a single leader
  yield* sPill().opacity(1, 0.4);
  yield* all(
    cand().scale(1, 0.6, easeOutBack),
    sNode[0]().scale(1, 0.4, easeOutBack),
    sNode[1]().scale(1, 0.4, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  // followers cast their votes toward the candidate
  yield* all(sVoteLine[0]().end(1, 0.35), sVoteLine[1]().end(1, 0.35));
  for (let i = 0; i < 2; i++) {
    const from = new Vector2(sFollowP[i]);
    const to = new Vector2([-175, 360 + i * 50]);
    sVoteDot[i]().position(from).opacity(1);
    yield* sVoteDot[i]().position(to, 0.4);
    sVoteDot[i]().opacity(0);
    yield* sVotes(i + 1, 0.2);
  }

  // majority reached — the candidate becomes LEADER (teal crown + sonar)
  spawn(pulseSonar(ring()));
  yield* waitFor(0.3);
  spawn(pulseSonar(ring2()));
  yield* all(sCrown().scale(1, 0.5, easeOutBack), sCrown().opacity(1, 0.4));

  // the leader replicates to its followers; a minority cannot elect
  yield* all(sLeadEdge[0]().end(1, 0.35), sLeadEdge[1]().end(1, 0.35));
  yield* all(sLoad[0](33, 0.6), sLoad[1](33, 0.6));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 2; i++) {
      const from = new Vector2([-175, 360 + i * 50]);
      const to = new Vector2(sFollowP[i]);
      sLeadDot[i]().position(from).opacity(1);
      yield* sLeadDot[i]().position(to, 0.34);
      sLeadDot[i]().opacity(0);
    }
  }

  yield* waitFor(1.6);
});
