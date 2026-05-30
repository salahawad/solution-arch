import {makeScene2D, Rect, Txt, Circle, Line, Node} from '@motion-canvas/2d';
import {createRef, createSignal, all, waitFor, easeOutBack, Reference, Vector2} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, FlowEdge, StatCard, StatRow} from '../../components';

const C = theme.colors;

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  view.add(<Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />);

  const title = createRef();

  // state 1 (single partition)
  const p1Pill = createRef();
  const p1Prod = [createRef<Rect>(), createRef<Rect>()];
  const p1Part = createRef<Rect>();
  const p1Cons = createRef<Rect>();
  const p1e1 = mkEdge(), p1e2 = mkEdge(), p1e3 = mkEdge();
  const p1Stats = createRef();
  const lag1 = createSignal(0);

  // state 2 (partitioned)
  const p2Pill = createRef();
  const p2Prod = [createRef<Rect>(), createRef<Rect>()];
  const p2Part = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const p2Cons = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const p2eIn = [mkEdge(), mkEdge(), mkEdge()];
  const p2eOut = [mkEdge(), mkEdge(), mkEdge()];
  const p2Stats = createRef();
  const thru = createSignal(1);

  const partY = [230, 360, 490];

  view.add(
    <>
      <TitleBlock ref={title} handle="github.com/salahawad/solution-arch" titleA="Apache " titleB="Kafka" subtitle="one log, many partitions, parallel consumers" position={[0, -830]} />

      {/* STATE 1 */}
      <SectionPill ref={p1Pill} variant="problem" label="SINGLE PARTITION" note="one lane, one consumer — capped" position={[10, -650]} />
      <GlowNode ref={p1Prod[0]} label="producer" width={210} height={78} position={[-380, -490]} />
      <GlowNode ref={p1Prod[1]} label="producer" width={210} height={78} position={[-380, -380]} />
      <GlowNode ref={p1Part} label="partition-0" accent={C.amber} width={250} height={96} position={[0, -435]} />
      <GlowNode ref={p1Cons} label="consumer" width={210} height={96} position={[385, -435]} />
      {edge(p1e1, [-270, -490], [-130, -445], C.teal)}
      {edge(p1e2, [-270, -380], [-130, -425], C.teal)}
      {edge(p1e3, [130, -435], [275, -435], C.amber)}
      <StatRow ref={p1Stats} position={[0, -180]} gap={22}>
        <StatCard label="THROUGHPUT" value="1x" width={300} />
        <StatCard label="LAG" value={() => `${Math.round(lag1())}`} accent={C.coral} width={300} />
        <StatCard label="CONSUMERS" value="1" width={300} />
      </StatRow>

      {/* STATE 2 */}
      <SectionPill ref={p2Pill} variant="solution" label="PARTITIONED" note="a consumer group reads in parallel" position={[-10, 70]} />
      <GlowNode ref={p2Prod[0]} label="producer" width={190} height={72} position={[-410, 300]} />
      <GlowNode ref={p2Prod[1]} label="producer" width={190} height={72} position={[-410, 420]} />
      {partY.map((y, i) => (
        <GlowNode ref={p2Part[i]} label={`partition-${i}`} accent={C.amber} width={230} height={84} position={[0, y]} fontSize={26} />
      ))}
      {partY.map((y, i) => (
        <GlowNode ref={p2Cons[i]} label={`C${i}`} width={96} height={84} position={[395, y]} />
      ))}
      {partY.map((y, i) => edge(p2eIn[i], [-315, 360], [-120, y], C.teal))}
      {partY.map((y, i) => edge(p2eOut[i], [120, y], [342, y], C.amber))}
      <StatRow ref={p2Stats} position={[0, 700]} gap={22}>
        <StatCard label="THROUGHPUT" value={() => `${Math.round(thru())}x`} accent={C.teal} width={300} />
        <StatCard label="LAG" value="0" accent={C.teal} width={300} />
        <StatCard label="CONSUMERS" value="3" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // hidden initial
  title().opacity(0);
  for (const r of [p1Pill, p1Stats, p2Pill, p2Stats]) r().opacity(0);
  for (const r of [p1Part, p1Cons, ...p1Prod, ...p2Part, ...p2Cons, ...p2Prod]) r().scale(0);

  // --- choreography ---
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1
  yield* p1Pill().opacity(1, 0.4);
  yield* all(p1Prod[0]().scale(1, 0.4, easeOutBack), p1Prod[1]().scale(1, 0.4, easeOutBack), p1Part().scale(1, 0.45, easeOutBack), p1Cons().scale(1, 0.45, easeOutBack));
  yield* all(p1e1.line().end(1, 0.3), p1e2.line().end(1, 0.3), p1e3.line().end(1, 0.3));
  yield* p1Stats().opacity(1, 0.4);
  // messages pile up -> lag grows
  for (let i = 0; i < 3; i++) {
    yield* all(sendDot(p1e1, [-270, -490], [-130, -445]), sendDot(p1e2, [-270, -380], [-130, -425]));
    yield* lag1(lag1() + 3, 0.3);
  }
  yield* waitFor(0.7);

  // STATE 2
  yield* p2Pill().opacity(1, 0.4);
  yield* all(...p2Prod.map(r => r().scale(1, 0.4, easeOutBack)), ...p2Part.map(r => r().scale(1, 0.4, easeOutBack)), ...p2Cons.map(r => r().scale(1, 0.4, easeOutBack)));
  yield* all(...p2eIn.map(e => e.line().end(1, 0.3)), ...p2eOut.map(e => e.line().end(1, 0.3)));
  yield* p2Stats().opacity(1, 0.4);
  yield* thru(3, 1.0);
  for (let pass = 0; pass < 2; pass++) {
    yield* all(...partY.map((y, i) => sendDot(p2eIn[i], [-315, 360], [-120, y], 0.34)));
    yield* all(...partY.map((y, i) => sendDot(p2eOut[i], [120, y], [342, y], 0.3)));
  }
  yield* waitFor(1.6);
});

/* ---- local edge helpers (a Line that draws + a dot that travels) ---- */
function mkEdge() {
  return {line: createRef<Line>(), dot: createRef<Circle>()};
}
function edge(e: {line: Reference<Line>; dot: Reference<Circle>}, from: [number, number], to: [number, number], color: string) {
  return <FlowEdge lineRef={e.line} dotRef={e.dot} from={from} to={to} color={color} />;
}
function* sendDot(e: {line: Reference<Line>; dot: Reference<Circle>}, from: [number, number], to: [number, number], dur = 0.4) {
  e.dot().position(new Vector2(from)).opacity(1);
  yield* e.dot().position(new Vector2(to), dur);
  e.dot().opacity(0);
}
