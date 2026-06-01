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
import {TitleBlock, SectionPill, BalancerNode, ServerNode, StatCard, StatRow} from '../../components';

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

  // PROBLEM — fixed fleet of 3 pods, saturated by the noon spike
  const pPill = createRef<Layout>();
  const pCurve = createRef<Line>();
  const pPods = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pSat = createRef<Node>();
  const pStats = createRef<Layout>();

  // SOLUTION — HPA scales the fleet from 3 to 6 on queue depth
  const sPill = createRef<Layout>();
  const sCurve = createRef<Line>();
  const sHpa = createRef<Rect>();
  const sRing = createRef<Circle>();
  const sRing2 = createRef<Circle>();
  const sPods = [
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
  ];
  const scaledTag = createRef<Layout>();
  const sStats = createRef<Layout>();

  // ---- signals ---------------------------------------------------------
  // problem pods all driven to saturation (coral)
  const pLoad = [createSignal(0), createSignal(0), createSignal(0)];
  // solution pods settle at a healthy ~55 (teal)
  const sLoad = sPods.map(() => createSignal(0));

  // ---- geometry --------------------------------------------------------
  // problem fleet: 3 pods at y -340, x = -280, 0, 280
  const pPodX = [-280, 0, 280];
  // solution fleet: 6 pods in two rows of 3
  const sPodX = [-120, 90, 300];
  const sPodY = [300, 470];
  const sPodPos: [number, number][] = [];
  for (const y of sPodY) for (const x of sPodX) sPodPos.push([x, y]);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Autoscaling"
        subtitle="add replicas from the right signal, before saturation drops traffic"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — fixed fleet ============ */}
      <SectionPill ref={pPill} variant="problem" label="FIXED FLEET" note="3 pods, fixed — the noon spike saturates them" position={[-10, -650]} />

      {/* rising load curve climbing across the top of the problem band */}
      <Node>
        <Line
          ref={pCurve}
          points={[[-420, -360], [-180, -380], [40, -420], [240, -450], [420, -470]]}
          stroke={C.coral}
          lineWidth={5}
          shadowColor={C.coral}
          shadowBlur={theme.glow}
          end={0}
        />
        <Txt text="noon spike" fill={C.coral} fontFamily={F.mono} fontSize={22} letterSpacing={1} position={[420, -500]} offset={[1, 0]} />
        <Txt text="load" fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={1} position={[-440, -360]} offset={[1, 0]} />
      </Node>

      {/* the fixed fleet of 3 pods, all driven to 100% (coral) */}
      {pPodX.map((x, i) => (
        <ServerNode ref={pPods[i]} name={`pod-${i + 1}`} load={pLoad[i]} position={[x, -340]} width={240} fontSize={24} />
      ))}

      {/* "saturated" badge over the fleet */}
      <Node ref={pSat} position={[0, -250]}>
        <Rect layout padding={[10, 26]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={2}>
          <Txt text="SATURATED · requests dropping" fill={C.coral} fontFamily={F.mono} fontWeight={700} fontSize={26} letterSpacing={1} />
        </Rect>
      </Node>

      <StatRow ref={pStats} position={[0, -150]} gap={22}>
        <StatCard label="REPLICAS" value="3 (fixed)" accent={C.coral} width={300} />
        <StatCard label="LOAD" value={() => `${Math.round(pLoad[0]())}%`} accent={C.coral} width={300} />
        <StatCard label="DROPS" value="climbing" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — autoscale ============ */}
      <SectionPill ref={sPill} variant="solution" label="AUTOSCALE" note="scale on queue depth; replicas follow demand" position={[-10, 70]} />

      {/* the HPA / autoscaler, watching queue depth, with sonar rings */}
      <BalancerNode ref={sHpa} ringRef={sRing} ring2Ref={sRing2} position={[-380, 360]} label="HPA" sub="watch: queue depth" />

      {/* same rising load curve over a fleet that grows to keep up */}
      <Node>
        <Line
          ref={sCurve}
          points={[[-160, 250], [0, 235], [180, 215], [320, 200], [420, 195]]}
          stroke={C.teal}
          lineWidth={5}
          shadowColor={C.teal}
          shadowBlur={theme.glow}
          end={0}
        />
        <Txt text="load" fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={1} position={[-180, 250]} offset={[1, 0]} />
      </Node>

      {/* a fleet that grows from 3 to 6 pods, all healthy at ~55% (teal) */}
      {sPodPos.map((pos, i) => (
        <ServerNode ref={sPods[i]} name={`pod-${i + 1}`} load={sLoad[i]} position={pos} width={200} fontSize={23} />
      ))}

      <Layout ref={scaledTag} layout padding={[8, 22]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[300, 560]}>
        <Txt text="scaled out 3 → 6" fill={C.teal} fontFamily={F.mono} fontWeight={600} fontSize={22} letterSpacing={1} />
      </Layout>

      <StatRow ref={sStats} position={[0, 720]} gap={22}>
        <StatCard label="REPLICAS" value="3 → 6" accent={C.teal} width={300} />
        <StatCard label="SIGNAL" value="queue depth" accent={C.teal} width={300} />
        <StatCard label="P99" value="stable" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of pPods) r().scale(0);
  pSat().scale(0).opacity(0);
  sHpa().scale(0);
  for (const r of sPods) r().scale(0);
  scaledTag().opacity(0).scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: fixed fleet saturates as the load curve climbs ------------
  yield* pPill().opacity(1, 0.4);
  yield* all(...pPods.map(r => r().scale(1, 0.45, easeOutBack)));
  yield* pStats().opacity(1, 0.4);

  // the load curve grows up to the noon spike, pods drive to 100% (coral)
  yield* pCurve().end(1, 1.0, easeOutCubic);
  yield* all(...pLoad.map(s => s(100, 1.2)));

  // saturated badge lands
  yield* all(pSat().scale(1, 0.5, easeOutBack), pSat().opacity(1, 0.4));
  yield* waitFor(0.8);

  // SOLUTION: HPA watches queue depth and scales out ------------------
  yield* sPill().opacity(1, 0.4);
  yield* sHpa().scale(1, 0.5, easeOutBack);

  // the same curve climbs, but the fleet responds
  yield* sCurve().end(1, 0.9, easeOutCubic);

  // first 3 pods pop in and take the initial load
  yield* all(...sPods.slice(0, 3).map(r => r().scale(1, 0.45, easeOutBack)));
  yield* sStats().opacity(1, 0.4);
  yield* all(...sLoad.slice(0, 3).map(s => s(92, 0.9)));
  yield* waitFor(0.4);

  // queue depth crosses the threshold — HPA scales out: 3 more pods pop in
  yield* all(...sPods.slice(3).map(r => r().scale(1, 0.5, easeOutBack)));
  yield* all(scaledTag().opacity(1, 0.4), scaledTag().scale(1, 0.4, easeOutBack));

  // load spreads across the larger fleet; everyone settles healthy at ~55 (teal)
  yield* all(...sLoad.map(s => s(55, 1.1)));

  // tint the settled pods teal so the densest frame reads "healthy fleet of 6"
  yield* all(...sPods.map(r => r().fill(`${C.teal}22`, 0.4)));

  yield* waitFor(1.8);
});
