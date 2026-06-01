import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
  Vector2,
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

  // PROBLEM — a request crosses a chain of services, one is slow, logs can't say which
  const pPill = createRef<Layout>();
  const chain = createRef<Node>();
  const pNodes = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pEdges = [
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
    {line: createRef<Line>(), dot: createRef<Circle>()},
  ];
  const pQ = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — one trace-id, spans on a waterfall expose the slow hop
  const sPill = createRef<Layout>();
  const traceId = createRef<Rect>();
  const axis = createRef<Line>();
  const sStats = createRef<Layout>();

  // problem service node x-centers (4 nodes, ~250 apart)
  const px = [-375, -125, 125, 375];
  const py = -420;
  const pNames = ['api', 'auth', 'orders', 'payments'];

  // waterfall spans: [label, startMs, durMs, isSlow]
  const baseX = -300;
  const scale = 700 / 1900; // px per ms across ~700px
  const spans: [string, number, number, boolean][] = [
    ['gateway', 0, 1900, false],
    ['auth', 60, 180, false],
    ['orders', 260, 240, false],
    ['payments-db', 520, 1240, true],
    ['cache', 1780, 110, false],
  ];
  const barRefs = spans.map(() => createRef<Rect>());
  const wfTop = 250;
  const wfGap = 68;

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Distributed "
        titleB="Tracing"
        subtitle="find the slow hop in a request that crosses six services"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — no trace ============ */}
      <SectionPill ref={pPill} variant="problem" label="NO TRACE" note="six services, per-service logs — which hop is slow?" position={[-10, -640]} />

      <Node ref={chain}>
        {pEdges.map((e, i) => (
          <FlowEdge lineRef={e.line} dotRef={e.dot} from={[px[i] + 80, py]} to={[px[i + 1] - 80, py]} color={C.teal} />
        ))}
        {px.map((x, i) => (
          <GlowNode ref={pNodes[i]} label={pNames[i]} accent={C.teal} width={160} height={96} fontSize={28} position={[x, py]} />
        ))}
      </Node>

      {/* the "which one?" overlay — a slow/error badge + question mark */}
      <Node ref={pQ} position={[0, -250]}>
        <Rect layout padding={[10, 26]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2}>
          <Txt text="500 · p99 1.9s · which service?" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={26} letterSpacing={1} />
        </Rect>
      </Node>

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="P99" value="1.9s" accent={C.coral} width={300} />
        <StatCard label="CORRELATION" value="none" accent={C.coral} width={300} />
        <StatCard label="ROOT CAUSE" value="?" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — trace waterfall ============ */}
      <SectionPill ref={sPill} variant="solution" label="TRACE" note="one trace-id; spans on a timeline expose the slow hop" position={[-10, 70]} />

      <Rect ref={traceId} layout padding={[10, 26]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[0, 180]}>
        <Txt text="trace-id  a3f9c1…  ·  total 1.9s" fill={C.teal} fontFamily={F.mono} fontWeight={600} fontSize={26} letterSpacing={1} />
      </Rect>

      {/* waterfall axis */}
      <Line ref={axis} points={[[baseX, wfTop - 30], [baseX, wfTop + (spans.length - 1) * wfGap + 30]]} stroke={C.panelBorder} lineWidth={2} />

      {spans.map(([label, startMs, durMs, slow], i) => {
        const accent = slow ? C.coral : C.teal;
        const left = baseX + startMs * scale;
        const w = durMs * scale;
        const y = wfTop + i * wfGap;
        const secs = (durMs / 1000).toFixed(durMs >= 1000 ? 1 : 2);
        return (
          <Node>
            <Txt text={label} fill={slow ? C.coral : C.muted} fontFamily={F.mono} fontSize={22} textAlign="right" position={[baseX - 24, y]} offset={[1, 0]} />
            <Rect
              ref={barRefs[i]}
              position={[left, y]}
              offset={[-1, 0]}
              width={w}
              height={42}
              radius={8}
              fill={`${accent}33`}
              stroke={accent}
              lineWidth={2.5}
              shadowColor={accent}
              shadowBlur={slow ? theme.glow : 0}
            />
            <Txt text={`${secs}s`} fill={accent} fontFamily={F.mono} fontWeight={700} fontSize={20} position={[left + w + 16, y]} offset={[-1, 0]} />
          </Node>
        );
      })}

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="TRACE-ID" value="a3f9c1" accent={C.teal} width={300} />
        <StatCard label="SLOW SPAN" value="payments-db" accent={C.coral} width={300} />
        <StatCard label="ROOT CAUSE" value="found" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of pNodes) r().scale(0);
  pQ().scale(0).opacity(0);
  traceId().opacity(0).scale(0.8);
  axis().opacity(0);
  for (const b of barRefs) b().width(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: reveal the chain, send a request across it
  yield* pPill().opacity(1, 0.4);
  yield* all(...pNodes.map(r => r().scale(1, 0.45, easeOutBack)));
  yield* all(...pEdges.map(e => e.line().end(1, 0.3)));
  // a request hops api -> auth -> orders -> payments
  for (let i = 0; i < pEdges.length; i++) {
    const e = pEdges[i];
    e.dot().position([px[i] + 80, py]).opacity(1);
    yield* e.dot().position([px[i + 1] - 80, py], i === pEdges.length - 1 ? 0.8 : 0.35);
    e.dot().opacity(0);
  }
  // it's slow somewhere — the payments node reddens, the "which?" badge + stats land
  yield* all(pNodes[3]().stroke(C.coral, 0.4), pNodes[3]().shadowColor(C.coral, 0.4));
  yield* all(pQ().scale(1, 0.5, easeOutBack), pQ().opacity(1, 0.4));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.8);

  // SOLUTION: trace-id, then spans grow into a waterfall
  yield* sPill().opacity(1, 0.4);
  yield* all(traceId().opacity(1, 0.4), traceId().scale(1, 0.4, easeOutBack));
  yield* axis().opacity(1, 0.3);
  yield* sStats().opacity(1, 0.4);

  // bars grow left-to-right, staggered down the waterfall
  for (let i = 0; i < barRefs.length; i++) {
    const [, , durMs, slow] = spans[i];
    const w = durMs * scale;
    barRefs[i]().opacity(1);
    yield* barRefs[i]().width(w, slow ? 0.7 : 0.35, easeOutCubic);
  }

  // pulse the culprit so the settled frame reads "payments-db is the slow hop"
  yield* all(barRefs[3]().scale(1.04, 0.3), barRefs[3]().shadowBlur(theme.glow * 1.6, 0.3));
  yield* all(barRefs[3]().scale(1, 0.3), barRefs[3]().shadowBlur(theme.glow, 0.3));

  yield* waitFor(1.8);
});
