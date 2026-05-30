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

  // state 1 — one origin
  const p1 = createRef();
  const users1 = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const origin1 = createRef<Node>();
  const e1 = [mkEdge(), mkEdge(), mkEdge()];
  const s1 = createRef();
  const lat1 = createSignal(0);
  const uY1 = [-560, -440, -320];

  // state 2 — edge cached
  const p2 = createRef();
  const users2 = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const edges2 = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const origin2 = createRef<Node>();
  const eUser = [mkEdge(), mkEdge(), mkEdge()];
  const eOrigin = mkEdge();
  const s2 = createRef();
  const lat2 = createSignal(280);
  const uY2 = [250, 380, 510];

  view.add(
    <>
      <TitleBlock ref={title} handle="@solution-arch" titleA="" titleB="CDN" subtitle="serve users from the nearest edge" position={[0, -830]} />

      {/* STATE 1 */}
      <SectionPill ref={p1} variant="problem" label="ONE ORIGIN" note="every user crosses the globe" position={[-40, -680]} />
      {uY1.map((y, i) => <GlowNode ref={users1[i]} label="user" width={150} height={74} position={[-400, y]} fontSize={26} />)}
      <DbNode ref={origin1} label="origin" sub="far away" accent={C.coral} width={190} height={210} position={[380, -440]} />
      {uY1.map((y, i) => edge(e1[i], [-315, y], [285, -440], C.coral))}
      <StatRow ref={s1} position={[0, -150]} gap={22}>
        <StatCard label="LATENCY" value={() => `${Math.round(lat1())}ms`} accent={C.coral} width={300} />
        <StatCard label="HOPS" value="12" width={300} />
        <StatCard label="CACHE" value="miss" accent={C.coral} width={300} />
      </StatRow>

      {/* STATE 2 */}
      <SectionPill ref={p2} variant="solution" label="EDGE CACHED" note="users hit a nearby PoP" position={[-30, 90]} />
      {uY2.map((y, i) => <GlowNode ref={users2[i]} label="user" width={140} height={70} position={[-430, y]} fontSize={24} />)}
      {uY2.map((y, i) => <GlowNode ref={edges2[i]} label="edge" accent={C.teal} width={150} height={78} position={[-70, y]} fontSize={26} />)}
      <DbNode ref={origin2} label="origin" sub="sync" accent={C.muted} width={150} height={170} position={[400, 380]} />
      {uY2.map((y, i) => edge(eUser[i], [-355, y], [-150, y], C.teal))}
      {edge(eOrigin, [10, 380], [320, 380], C.muted)}
      <StatRow ref={s2} position={[0, 700]} gap={22}>
        <StatCard label="LATENCY" value={() => `${Math.round(lat2())}ms`} accent={C.teal} width={300} />
        <StatCard label="HOPS" value="2" accent={C.teal} width={300} />
        <StatCard label="CACHE" value="92% hit" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  title().opacity(0);
  for (const r of [p1, s1, p2, s2]) r().opacity(0);
  for (const r of [origin1, origin2, ...users1, ...users2, ...edges2]) r().scale(0);

  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1
  yield* p1().opacity(1, 0.4);
  yield* all(origin1().scale(1, 0.5, easeOutBack), ...users1.map(r => r().scale(1, 0.4, easeOutBack)));
  yield* all(...e1.map(e => drawEdge(e, 0.35)));
  yield* s1().opacity(1, 0.4);
  yield* lat1(280, 1.2);
  for (let pass = 0; pass < 2; pass++) {
    yield* all(...uY1.map((y, i) => sendDot(e1[i], [-315, y], [285, -440], 0.7)));
  }
  yield* waitFor(0.5);

  // STATE 2
  yield* p2().opacity(1, 0.4);
  yield* all(...users2.map(r => r().scale(1, 0.4, easeOutBack)), ...edges2.map(r => r().scale(1, 0.4, easeOutBack)), origin2().scale(1, 0.5, easeOutBack));
  yield* all(...eUser.map(e => drawEdge(e, 0.3)), drawEdge(eOrigin, 0.3));
  yield* s2().opacity(1, 0.4);
  yield* lat2(25, 1.0);
  for (let pass = 0; pass < 3; pass++) {
    yield* all(...uY2.map((y, i) => sendDot(eUser[i], [-355, y], [-150, y], 0.26)));
  }
  yield* waitFor(1.6);
});
