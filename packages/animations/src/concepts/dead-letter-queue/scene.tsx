import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
  easeInOutCubic,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, FlowEdge, StatCard, StatRow} from '../../components';

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

  // PROBLEM — a poison message at the head blocks the whole queue
  const pPill = createRef<Layout>();
  const pTiles = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pConsumer = createRef<Rect>();
  const pEdge = {line: createRef<Line>(), dot: createRef<Circle>()};
  const pStats = createRef<Layout>();

  // SOLUTION — after N retries, shunt the poison aside; the main queue drains
  const sPill = createRef<Layout>();
  const sTiles = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sConsumer = createRef<Rect>();
  const sDlq = createRef<Rect>();
  const sDivertEdge = createRef<Line>();
  const sFlow = {line: createRef<Line>(), dot: createRef<Circle>()};
  const sStats = createRef<Layout>();

  // ---- signals ---------------------------------------------------------
  const pRetry = createSignal('retry 1'); // poison retry counter on the problem panel
  const sRetry = createSignal('retry 1'); // counts up to N on the solution panel

  // ---- layout constants ------------------------------------------------
  const tile = 64;
  const tileStep = 92;
  const pHeadX = -300; // leftmost tile x (problem)
  const pY = -430;
  const sHeadX = -300; // leftmost tile x (solution)
  const sY = 320;
  const pConsumerPos: [number, number] = [360, -430];
  const sConsumerPos: [number, number] = [360, 320];
  const sDlqPos: [number, number] = [-180, 520];

  // tile x positions for a row of 6
  const xs = (head: number) => Array.from({length: 6}, (_, i) => head + i * tileStep);
  const pXs = xs(pHeadX);
  const sXs = xs(sHeadX);

  // a small rounded message tile
  const MsgTile = (ref: any, x: number, y: number, accent: string, label: string) => (
    <Rect
      ref={ref}
      position={[x, y]}
      size={[tile, tile]}
      radius={12}
      fill={C.panel}
      stroke={accent}
      lineWidth={2.5}
      shadowColor={accent}
      shadowBlur={theme.glow}
      layout
      alignItems="center"
      justifyContent="center"
    >
      <Txt text={label} fill={accent} fontFamily={F.mono} fontSize={26} fontWeight={700} />
    </Rect>
  );

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Dead Letter "
        titleB="Queue"
        subtitle="park the poison message so the queue keeps draining"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — head-of-line blocking ============ */}
      <SectionPill ref={pPill} variant="problem" label="HEAD-OF-LINE" note="a poison message at the head blocks everything behind it" position={[-10, -650]} />

      {/* queue row: head (leftmost) is poison/coral, the rest wait (teal) */}
      {pXs.map((x, i) =>
        MsgTile(pTiles[i], x, pY, i === 0 ? C.coral : C.teal, i === 0 ? '☠' : `${i}`),
      )}

      {/* head <-> consumer: a dot bounces while the retry counter cycles */}
      <FlowEdge lineRef={pEdge.line} dotRef={pEdge.dot} from={[pHeadX + tile / 2 + 6, pY]} to={[pConsumerPos[0] - 90, pY]} color={C.coral} />

      {/* retry counter floating above the head tile */}
      <Txt text={pRetry} fill={C.coral} fontFamily={F.mono} fontSize={26} fontWeight={700} letterSpacing={1} position={[pHeadX, pY - 64]} />

      <GlowNode ref={pConsumer} label="CONSUMER" accent={C.teal} width={170} height={96} fontSize={24} position={pConsumerPos} />

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="HEAD" value="poison" accent={C.coral} width={300} />
        <StatCard label="RETRIES" value="infinite" accent={C.coral} width={300} />
        <StatCard label="BACKLOG" value="blocked" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — dead letter queue ============ */}
      <SectionPill ref={sPill} variant="solution" label="DLQ" note="after N retries, shunt it aside; the main queue drains" position={[-10, 70]} />

      {/* the divert arrow: head tile slot -> DLQ box (coral) */}
      <Line ref={sDivertEdge} points={[[sHeadX, sY + tile / 2 + 6], [sDlqPos[0], sDlqPos[1] - 70]]} stroke={C.coral} lineWidth={4} opacity={0.85} lineDash={[6, 10]} endArrow arrowSize={16} end={0} />

      {/* the DLQ box below */}
      <GlowNode ref={sDlq} label="DLQ" accent={C.coral} width={200} height={120} fontSize={28} position={sDlqPos} />

      {/* queue row: head is poison (coral), rest are ready (teal) */}
      {sXs.map((x, i) =>
        MsgTile(sTiles[i], x, sY, i === 0 ? C.coral : C.teal, i === 0 ? '☠' : `${i}`),
      )}

      {/* drained queue -> consumer (teal flow) */}
      <FlowEdge lineRef={sFlow.line} dotRef={sFlow.dot} from={[sHeadX + 4 * tileStep + tile / 2 + 6, sY]} to={[sConsumerPos[0] - 90, sY]} color={C.teal} />

      <GlowNode ref={sConsumer} label="CONSUMER" accent={C.teal} width={170} height={96} fontSize={24} position={sConsumerPos} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="MAIN QUEUE" value="draining" accent={C.teal} width={300} />
        <StatCard label="DLQ" value="1" accent={C.coral} width={300} />
        <StatCard label="ACTION" value="alert + replay" accent={C.amber} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [...pTiles, pConsumer, ...sTiles, sConsumer, sDlq]) r().scale(0);
  pEdge.line().end(0);
  sFlow.line().end(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: head-of-line blocking ---------------------------------------
  yield* pPill().opacity(1, 0.4);
  yield* all(
    ...pTiles.map((r, i) => r().scale(1, 0.4, easeOutBack)),
    pConsumer().scale(1, 0.5, easeOutBack),
  );
  yield* pEdge.line().end(1, 0.3);
  yield* pStats().opacity(1, 0.4);

  // the head tile retries forever: the dot bounces head -> consumer -> back, counter climbs.
  // nothing advances — the rest of the queue stays put behind the poison message.
  const pRetries = ['retry 1', 'retry 2', 'retry 3', 'retry …'];
  for (let i = 0; i < pRetries.length; i++) {
    pRetry(pRetries[i]);
    pEdge.dot().position([pHeadX + tile / 2 + 6, pY]).opacity(1);
    yield* pEdge.dot().position([pConsumerPos[0] - 90, pY], 0.32, easeInOutCubic);
    // rejected — bounce back to the head, never acked
    yield* pEdge.dot().position([pHeadX + tile / 2 + 6, pY], 0.28, easeInOutCubic);
    pEdge.dot().opacity(0);
  }
  yield* waitFor(0.7);

  // SOLUTION: dead letter queue ------------------------------------------
  yield* sPill().opacity(1, 0.4);
  yield* all(
    ...sTiles.map((r, i) => r().scale(1, 0.4, easeOutBack)),
    sConsumer().scale(1, 0.5, easeOutBack),
    sDlq().scale(1, 0.55, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  // the head tile retries up to N, then gets diverted
  const sRetries = ['retry 1', 'retry 2', 'retry N'];
  for (let i = 0; i < sRetries.length; i++) {
    sRetry(sRetries[i]);
    yield* sTiles[0]().scale(1.08, 0.14).to(1, 0.14);
  }

  // draw the divert arrow, then shunt the poison tile down into the DLQ box
  yield* sDivertEdge().end(1, 0.35);
  yield* all(
    sTiles[0]().position(sDlqPos, 0.7, easeInOutCubic),
    sTiles[0]().scale(0.85, 0.7, easeOutCubic),
  );
  // it settles inside the DLQ — fade the loose tile so the DLQ box reads as holding it
  yield* sTiles[0]().opacity(0, 0.3);

  // remaining tiles shift left to close the gap left by the poison message
  yield* all(
    ...sTiles.slice(1).map((r, i) => r().position([sXs[i], sY], 0.5, easeOutCubic)),
  );

  // the main queue now drains: dots flow right from the tail tile to the consumer
  yield* sFlow.line().end(1, 0.3);
  const flowFrom: [number, number] = [sXs[4] + tile / 2 + 6, sY];
  const flowTo: [number, number] = [sConsumerPos[0] - 90, sY];
  for (let i = 0; i < 4; i++) {
    sFlow.dot().position(flowFrom).opacity(1);
    yield* sFlow.dot().position(flowTo, 0.34, easeInOutCubic);
    sFlow.dot().opacity(0);
  }

  // tint the DLQ-held poison + main queue tiles so the settled SOLUTION frame is the densest, lit one
  yield* all(
    sDlq().fill(`${C.coral}22`, 0.4),
    ...sTiles.slice(1).map(r => r().fill(`${C.teal}22`, 0.4)),
  );

  yield* waitFor(1.8);
});
