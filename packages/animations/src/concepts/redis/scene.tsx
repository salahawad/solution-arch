import {makeScene2D, Rect, Circle, Node} from '@motion-canvas/2d';
import {createRef, createSignal, all, waitFor, easeOutBack} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, DbNode, StatCard, StatRow} from '../../components';
import {mkEdge, edge, drawEdge, sendDot} from '../../lib/edges';

const C = theme.colors;

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  view.add(<Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />);

  const title = createRef();

  // state 1 — disk only
  const p1 = createRef();
  const app1 = createRef<Rect>();
  const db1 = createRef<Node>();
  const e1 = mkEdge();
  const s1 = createRef();
  const lat1 = createSignal(0);

  // state 2 — cache-aside
  const p2 = createRef();
  const app2 = createRef<Rect>();
  const redis = createRef<Rect>();
  const db2 = createRef<Node>();
  const e2 = mkEdge(); // app -> redis (hit)
  const e3 = mkEdge(); // redis -> db (miss/populate)
  const s2 = createRef();
  const lat2 = createSignal(40);
  const hit = createSignal(0);

  view.add(
    <>
      <TitleBlock ref={title} handle="@solution-arch" titleA="" titleB="Redis" subtitle="serve from memory, fall back to disk" position={[0, -830]} />

      {/* STATE 1 */}
      <SectionPill ref={p1} variant="problem" label="DISK ONLY" note="every read hits the database" position={[-90, -640]} />
      <GlowNode ref={app1} label="app" width={200} height={110} position={[-340, -430]} />
      <DbNode ref={db1} label="DB" sub="disk" accent={C.coral} width={210} height={200} position={[340, -430]} />
      {edge(e1, [-235, -430], [232, -430], C.coral)}
      <StatRow ref={s1} position={[0, -150]} gap={22}>
        <StatCard label="LATENCY" value={() => `${Math.round(lat1())}ms`} accent={C.coral} width={300} />
        <StatCard label="READS/s" value="120" width={300} />
        <StatCard label="SOURCE" value="disk" width={300} />
      </StatRow>

      {/* STATE 2 */}
      <SectionPill ref={p2} variant="solution" label="CACHE-ASIDE" note="hot reads served from memory" position={[-50, 90]} />
      <GlowNode ref={app2} label="app" width={180} height={104} position={[-410, 380]} />
      <GlowNode ref={redis} label="Redis" accent={C.teal} width={210} height={120} position={[-20, 380]} fontSize={32}>
      </GlowNode>
      <DbNode ref={db2} label="DB" sub="disk" accent={C.muted} width={190} height={190} position={[410, 380]} />
      {edge(e2, [-315, 380], [-130, 380], C.teal)}
      {edge(e3, [90, 380], [310, 380], C.muted)}
      <StatRow ref={s2} position={[0, 690]} gap={22}>
        <StatCard label="LATENCY" value={() => `${lat2().toFixed(1)}ms`} accent={C.teal} width={300} />
        <StatCard label="HIT RATE" value={() => `${Math.round(hit())}%`} accent={C.teal} width={300} />
        <StatCard label="SOURCE" value="memory" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  title().opacity(0);
  for (const r of [p1, s1, p2, s2]) r().opacity(0);
  for (const r of [app1, db1, app2, redis, db2]) r().scale(0);

  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1
  yield* p1().opacity(1, 0.4);
  yield* all(app1().scale(1, 0.45, easeOutBack), db1().scale(1, 0.5, easeOutBack));
  yield* drawEdge(e1, 0.35);
  yield* s1().opacity(1, 0.4);
  yield* all(lat1(40, 1.0));
  for (let i = 0; i < 3; i++) {
    yield* sendDot(e1, [-235, -430], [232, -430], 0.6);
  }
  yield* waitFor(0.6);

  // STATE 2
  yield* p2().opacity(1, 0.4);
  yield* all(app2().scale(1, 0.45, easeOutBack), redis().scale(1, 0.5, easeOutBack), db2().scale(1, 0.5, easeOutBack));
  yield* all(drawEdge(e2, 0.3), drawEdge(e3, 0.3));
  yield* s2().opacity(1, 0.4);
  // first read: miss -> goes to db, populates, then hits get fast
  yield* sendDot(e2, [-315, 380], [-130, 380], 0.35);
  yield* sendDot(e3, [90, 380], [310, 380], 0.4);
  yield* all(lat2(0.5, 1.0), hit(95, 1.2));
  // subsequent reads: fast hits, no db
  for (let i = 0; i < 3; i++) {
    yield* sendDot(e2, [-315, 380], [-130, 380], 0.28);
  }
  yield* waitFor(1.6);
});
