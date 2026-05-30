import {makeScene2D, Rect, Txt, Circle, Node} from '@motion-canvas/2d';
import {createRef, createSignal, all, waitFor, easeOutBack} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, GlowNode, DbNode, StatCard, StatRow} from '../../components';
import {mkEdge, edge, drawEdge, sendDot} from '../../lib/edges';

const C = theme.colors;
const F = theme.fonts;

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  view.add(<Circle width={1700} height={1700} position={[0, -120]} fill={C.bgGlow} opacity={0.5} shadowColor={C.bgGlow} shadowBlur={400} zIndex={-10} />);

  const title = createRef();

  // state 1 — one database
  const p1 = createRef();
  const bigDb = createRef<Node>();
  const s1 = createRef();
  const cap1 = createSignal(0);

  // state 2 — sharded
  const p2 = createRef();
  const router = createRef<Rect>();
  const hashLabel = createRef<Txt>();
  const shards = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const eIn = [mkEdge(), mkEdge(), mkEdge()];
  const s2 = createRef();
  const cap2 = createSignal(98);
  const shardY = [250, 380, 510];

  view.add(
    <>
      <TitleBlock ref={title} handle="@solution-arch" titleA="" titleB="Sharding" subtitle="split data across nodes by shard key" position={[0, -830]} />

      {/* STATE 1 */}
      <SectionPill ref={p1} variant="problem" label="ONE DATABASE" note="a single node holds everything" position={[-50, -640]} />
      <DbNode ref={bigDb} label="users" sub={'98% full'} accent={C.coral} width={260} height={250} position={[0, -400]} />
      <StatRow ref={s1} position={[0, -120]} gap={22}>
        <StatCard label="CAPACITY" value={() => `${Math.round(cap1())}%`} accent={C.coral} width={300} />
        <StatCard label="WRITES/s" value="throttled" accent={C.coral} width={300} />
        <StatCard label="NODES" value="1" width={300} />
      </StatRow>

      {/* STATE 2 */}
      <SectionPill ref={p2} variant="solution" label="SHARDED" note="route by shard key" position={[-40, 110]} />
      <GlowNode ref={router} label="router" accent={C.teal} width={210} height={104} position={[-380, 390]} />
      <Txt ref={hashLabel} text="hash(key) % 3" fill={C.muted} fontFamily={F.mono} fontSize={22} position={[-380, 470]} opacity={0} />
      {shardY.map((y, i) => (
        <DbNode ref={shards[i]} label={`shard-${i}`} sub="33%" accent={C.teal} width={150} height={150} position={[360, y]} />
      ))}
      {shardY.map((y, i) => edge(eIn[i], [-275, 390], [285, y], C.teal))}
      <StatRow ref={s2} position={[0, 710]} gap={22}>
        <StatCard label="CAPACITY" value={() => `${Math.round(cap2())}%`} accent={C.teal} width={300} />
        <StatCard label="WRITES/s" value="3x" accent={C.teal} width={300} />
        <StatCard label="NODES" value="3" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  title().opacity(0);
  for (const r of [p1, s1, p2, s2]) r().opacity(0);
  bigDb().scale(0);
  router().scale(0);
  for (const r of shards) r().scale(0);

  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1
  yield* p1().opacity(1, 0.4);
  yield* bigDb().scale(1, 0.55, easeOutBack);
  yield* s1().opacity(1, 0.4);
  yield* cap1(98, 1.2);
  yield* waitFor(0.8);

  // STATE 2
  yield* p2().opacity(1, 0.4);
  yield* all(router().scale(1, 0.5, easeOutBack), hashLabel().opacity(1, 0.4));
  yield* all(...shards.map(r => r().scale(1, 0.45, easeOutBack)));
  yield* all(...eIn.map(e => drawEdge(e, 0.3)));
  yield* s2().opacity(1, 0.4);
  yield* cap2(33, 1.0);
  for (let pass = 0; pass < 2; pass++) {
    yield* all(...shardY.map((y, i) => sendDot(eIn[i], [-275, 390], [285, y], 0.34)));
  }
  yield* waitFor(1.6);
});
