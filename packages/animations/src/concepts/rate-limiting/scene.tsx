import {makeScene2D, Rect, Circle, Node} from '@motion-canvas/2d';
import {createRef, createSignal, all, waitFor, easeOutBack} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, ServerNode, Bucket, StatCard, StatRow} from '../../components';
import {mkEdge, edge, drawEdge, sendDot} from '../../lib/edges';

const C = theme.colors;

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  view.add(<Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />);

  const title = createRef();

  // state 1 — no limit
  const p1 = createRef();
  const clients1 = createRef<Rect>();
  const svc1 = createRef<Rect>();
  const svcLoad1 = createSignal(0);
  const e1 = mkEdge();
  const s1 = createRef();
  const err1 = createSignal(0);

  // state 2 — token bucket
  const p2 = createRef();
  const clients2 = createRef<Rect>();
  const bucket = createRef<Rect>();
  const tokens = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const svc2 = createRef<Rect>();
  const svcLoad2 = createSignal(0);
  const eIn = mkEdge();
  const eOut = mkEdge();
  const s2 = createRef();
  const allowed = createSignal(0);
  const throttled = createSignal(0);

  view.add(
    <>
      <TitleBlock ref={title} handle="github.com/salahawad/solution-arch" titleA="Rate " titleB="Limiting" subtitle="absorb bursts, protect the service" position={[0, -830]} />

      {/* STATE 1 */}
      <SectionPill ref={p1} variant="problem" label="NO LIMIT" note="a burst floods the service" position={[-60, -650]} />
      <GlowNode ref={clients1} label="clients" width={200} height={110} position={[-360, -440]} />
      <ServerNode ref={svc1} name="service" load={svcLoad1} position={[380, -440]} width={250} />
      {edge(e1, [-255, -440], [240, -440], C.coral)}
      <StatRow ref={s1} position={[0, -150]} gap={22}>
        <StatCard label="INCOMING" value="50/s" width={300} />
        <StatCard label="SERVED" value="overload" accent={C.coral} width={300} />
        <StatCard label="503s" value={() => `${Math.round(err1())}`} accent={C.coral} width={300} />
      </StatRow>

      {/* STATE 2 */}
      <SectionPill ref={p2} variant="solution" label="TOKEN BUCKET" note="tokens meter the flow" position={[-30, 90]} />
      <GlowNode ref={clients2} label="clients" width={180} height={100} position={[-420, 390]} />
      <Bucket ref={bucket} tokenRefs={tokens} capacity={5} accent={C.teal} position={[-30, 360]} label="tokens" />
      <ServerNode ref={svc2} name="service" load={svcLoad2} position={[400, 390]} width={230} />
      {edge(eIn, [-330, 390], [-110, 390], C.teal)}
      {edge(eOut, [50, 390], [285, 390], C.teal)}
      <StatRow ref={s2} position={[0, 700]} gap={22}>
        <StatCard label="ALLOWED" value={() => `${Math.round(allowed())}/s`} accent={C.teal} width={300} />
        <StatCard label="THROTTLED" value={() => `${Math.round(throttled())}/s`} accent={C.amber} width={300} />
        <StatCard label="503s" value="0" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  title().opacity(0);
  for (const r of [p1, s1, p2, s2]) r().opacity(0);
  for (const r of [clients1, svc1, clients2, bucket, svc2]) r().scale(0);
  for (const t of tokens) t().opacity(0);

  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1 — flood
  yield* p1().opacity(1, 0.4);
  yield* all(clients1().scale(1, 0.45, easeOutBack), svc1().scale(1, 0.45, easeOutBack));
  yield* drawEdge(e1, 0.35);
  yield* s1().opacity(1, 0.4);
  yield* all(svcLoad1(100, 1.0), err1(34, 1.4));
  for (let i = 0; i < 4; i++) {
    yield* sendDot(e1, [-255, -440], [240, -440], 0.22);
  }
  yield* waitFor(0.6);

  // STATE 2 — token bucket
  yield* p2().opacity(1, 0.4);
  yield* all(clients2().scale(1, 0.45, easeOutBack), bucket().scale(1, 0.5, easeOutBack), svc2().scale(1, 0.45, easeOutBack));
  yield* all(drawEdge(eIn, 0.3), drawEdge(eOut, 0.3));
  // fill the bucket with tokens
  for (const t of tokens) yield* t().opacity(1, 0.12);
  yield* s2().opacity(1, 0.4);
  yield* all(svcLoad2(42, 1.0), allowed(20, 1.0), throttled(30, 1.0));
  // metered flow: each request consumes a token, service stays healthy
  for (let i = 0; i < 4; i++) {
    yield* sendDot(eIn, [-330, 390], [-110, 390], 0.26);
    tokens[4 - (i % 5)]().opacity(0.25);
    yield* sendDot(eOut, [50, 390], [285, 390], 0.24);
  }
  yield* waitFor(1.6);
});
