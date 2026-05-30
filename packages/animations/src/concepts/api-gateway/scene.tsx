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

  // problem panel
  const pPill = createRef<Layout>();
  const pClient = createRef<Rect>();
  const pStats = createRef<Layout>();
  const pSvc = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pLoad = [createSignal(0), createSignal(0), createSignal(0), createSignal(0)];
  const pEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const pEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const pAuth = [createRef<Node>(), createRef<Node>(), createRef<Node>(), createRef<Node>()];

  // solution panel
  const sPill = createRef<Layout>();
  const sClient = createRef<Rect>();
  const gw = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sStats = createRef<Layout>();
  const sSvc = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const sLoad = [createSignal(0), createSignal(0), createSignal(0), createSignal(0)];
  const sReqEdge = createRef<Line>();
  const sReqDot = createRef<Circle>();
  const sEdgeLine = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sEdgeDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];

  // ---- metric signals --------------------------------------------------
  const pRoutes = createSignal(0);
  const sRoutes = createSignal(0);

  // service Y positions (4 services per panel, stacked)
  const pSvcY = [-620, -520, -420, -320];
  const sSvcY = [160, 290, 420, 550];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="API "
        titleB="Gateway"
        subtitle="one front door instead of N"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — DIRECT CALLS (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="DIRECT CALLS" note="clients wire every service" position={[-180, -660]} />

      <GlowNode ref={pClient} label="CLIENT" accent={C.coral} width={210} height={92} position={[-370, -450]} />

      {/* four direct edges client -> each service, each carrying its own auth */}
      <FlowEdge lineRef={pEdgeLine[0]} dotRef={pEdgeDot[0]} from={[-265, -450]} to={[230, pSvcY[0]]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[1]} dotRef={pEdgeDot[1]} from={[-265, -450]} to={[230, pSvcY[1]]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[2]} dotRef={pEdgeDot[2]} from={[-265, -450]} to={[230, pSvcY[2]]} color={C.coral} />
      <FlowEdge lineRef={pEdgeLine[3]} dotRef={pEdgeDot[3]} from={[-265, -450]} to={[230, pSvcY[3]]} color={C.coral} />

      {/* an "auth" tag riding each direct edge — duplicated auth ×4 */}
      <Node ref={pAuth[0]} position={[0, pSvcY[0]]} opacity={0}>
        <Rect layout padding={[4, 12]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={1.5}>
          <Txt text="auth" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} />
        </Rect>
      </Node>
      <Node ref={pAuth[1]} position={[0, pSvcY[1]]} opacity={0}>
        <Rect layout padding={[4, 12]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={1.5}>
          <Txt text="auth" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} />
        </Rect>
      </Node>
      <Node ref={pAuth[2]} position={[0, pSvcY[2]]} opacity={0}>
        <Rect layout padding={[4, 12]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={1.5}>
          <Txt text="auth" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} />
        </Rect>
      </Node>
      <Node ref={pAuth[3]} position={[0, pSvcY[3]]} opacity={0}>
        <Rect layout padding={[4, 12]} radius={999} fill={`${C.coral}22`} stroke={C.coral} lineWidth={1.5}>
          <Txt text="auth" fill={C.coral} fontFamily={F.mono} fontSize={20} letterSpacing={2} />
        </Rect>
      </Node>

      <ServerNode ref={pSvc[0]} name="svc-a" load={pLoad[0]} position={[350, pSvcY[0]]} width={210} />
      <ServerNode ref={pSvc[1]} name="svc-b" load={pLoad[1]} position={[350, pSvcY[1]]} width={210} />
      <ServerNode ref={pSvc[2]} name="svc-c" load={pLoad[2]} position={[350, pSvcY[2]]} width={210} />
      <ServerNode ref={pSvc[3]} name="svc-d" load={pLoad[3]} position={[350, pSvcY[3]]} width={210} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="SERVICES" value="4 direct" accent={C.coral} width={300} />
        <StatCard label="AUTH" value={() => `×${Math.round(pRoutes())}`} accent={C.coral} width={300} />
        <StatCard label="COUPLING" value="tight" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — API GATEWAY (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="API GATEWAY" note="one entry point: routing · auth · TLS · aggregation" position={[0, 70]} />

      <GlowNode ref={sClient} label="CLIENT" accent={C.teal} width={210} height={88} position={[-400, 355]} />
      <Line ref={sReqEdge} points={[[-295, 355], [-160, 355]]} stroke={C.teal} lineWidth={3} opacity={0.5} lineDash={[2, 12]} end={0} />
      <Circle ref={sReqDot} size={18} fill={C.teal} shadowColor={C.teal} shadowBlur={16} position={[-295, 355]} opacity={0} />

      <BalancerNode ref={gw} ringRef={ring} ring2Ref={ring2} position={[-30, 355]} label="API GATEWAY" sub="auth · routing" />

      <FlowEdge lineRef={sEdgeLine[0]} dotRef={sEdgeDot[0]} from={[95, 310]} to={[235, sSvcY[0]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[1]} dotRef={sEdgeDot[1]} from={[95, 340]} to={[235, sSvcY[1]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[2]} dotRef={sEdgeDot[2]} from={[95, 370]} to={[235, sSvcY[2]]} color={C.teal} />
      <FlowEdge lineRef={sEdgeLine[3]} dotRef={sEdgeDot[3]} from={[95, 400]} to={[235, sSvcY[3]]} color={C.teal} />

      <ServerNode ref={sSvc[0]} name="svc-a" load={sLoad[0]} position={[355, sSvcY[0]]} width={210} />
      <ServerNode ref={sSvc[1]} name="svc-b" load={sLoad[1]} position={[355, sSvcY[1]]} width={210} />
      <ServerNode ref={sSvc[2]} name="svc-c" load={sLoad[2]} position={[355, sSvcY[2]]} width={210} />
      <ServerNode ref={sSvc[3]} name="svc-d" load={sLoad[3]} position={[355, sSvcY[3]]} width={210} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="GATEWAY" value="1" accent={C.teal} width={300} />
        <StatCard label="AUTH" value="central" accent={C.teal} width={300} />
        <StatCard label="ROUTES" value={() => `n=${Math.round(sRoutes())}`} accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pClient, sClient, gw]) r().scale(0);
  for (const r of [...pSvc, ...sSvc]) r().scale(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem — client calls four services directly
  yield* pPill().opacity(1, 0.4);
  yield* pClient().scale(1, 0.5, easeOutBack);
  yield* all(
    pSvc[0]().scale(1, 0.4, easeOutBack),
    pSvc[1]().scale(1, 0.4, easeOutBack),
    pSvc[2]().scale(1, 0.4, easeOutBack),
    pSvc[3]().scale(1, 0.4, easeOutBack),
  );
  yield* pStats().opacity(1, 0.4);

  // draw the four direct edges + reveal an auth tag on each (auth ×4)
  yield* all(
    pEdgeLine[0]().end(1, 0.45),
    pEdgeLine[1]().end(1, 0.45),
    pEdgeLine[2]().end(1, 0.45),
    pEdgeLine[3]().end(1, 0.45),
  );
  yield* all(
    pAuth[0]().opacity(1, 0.3),
    pAuth[1]().opacity(1, 0.3),
    pAuth[2]().opacity(1, 0.3),
    pAuth[3]().opacity(1, 0.3),
    pRoutes(4, 1.0),
    pLoad[0](74, 1.0),
    pLoad[1](78, 1.0),
    pLoad[2](72, 1.0),
    pLoad[3](82, 1.0),
  );

  // every direct call duplicates auth — dots fan out to all four services
  for (let pass = 0; pass < 2; pass++) {
    yield* all(
      ...pEdgeDot.map((d, i) => {
        const from = new Vector2([-265, -450]);
        const to = new Vector2([230, pSvcY[i]]);
        d().position(from).opacity(1);
        return d().position(to, 0.5).do(() => d().opacity(0));
      }),
    );
  }
  yield* waitFor(0.8);

  // STATE 2: solution — single gateway in front of the services
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(sClient().scale(1, 0.5, easeOutBack), gw().scale(1, 0.6, easeOutBack));
  yield* sReqEdge().end(1, 0.3);
  yield* all(
    sSvc[0]().scale(1, 0.4, easeOutBack),
    sSvc[1]().scale(1, 0.4, easeOutBack),
    sSvc[2]().scale(1, 0.4, easeOutBack),
    sSvc[3]().scale(1, 0.4, easeOutBack),
  );
  yield* sStats().opacity(1, 0.4);

  yield* all(
    sEdgeLine[0]().end(1, 0.35),
    sEdgeLine[1]().end(1, 0.35),
    sEdgeLine[2]().end(1, 0.35),
    sEdgeLine[3]().end(1, 0.35),
  );
  yield* all(
    sRoutes(4, 1.2),
    sLoad[0](40, 1.2),
    sLoad[1](40, 1.2),
    sLoad[2](40, 1.2),
    sLoad[3](40, 1.2),
  );

  // client hits the gateway once; the gateway authenticates then routes onward
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 4; i++) {
      sReqDot().position([-295, 355]).opacity(1);
      yield* sReqDot().position([-160, 355], 0.22);
      sReqDot().opacity(0);
      const from = new Vector2([95, 310 + i * 30]);
      const to = new Vector2([235, sSvcY[i]]);
      sEdgeDot[i]().position(from).opacity(1);
      yield* sEdgeDot[i]().position(to, 0.3);
      sEdgeDot[i]().opacity(0);
    }
  }

  yield* waitFor(1.6);
});
