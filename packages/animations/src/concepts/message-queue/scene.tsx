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

  // PROBLEM — direct synchronous call
  const pPill = createRef<Layout>();
  const pProd = createRef<Rect>();
  const pCons = createRef<Rect>();
  const pEdgeLine = createRef<Line>();
  const pEdgeDot = createRef<Circle>();
  const pStats = createRef<Layout>();
  // dropped-work marks (coral) that pile up on a spike
  const pDrop = [createRef<Node>(), createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const pConsLoad = createSignal(0);
  const pBlock = createRef<Txt>();

  // SOLUTION — queue buffers between producer and workers
  const sPill = createRef<Layout>();
  const sProd = createRef<Rect>();
  const queue = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sStats = createRef<Layout>();
  // buffered slots inside the queue
  const slot = [
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
    createRef<Rect>(),
  ];
  const slotFill = [
    createSignal(0),
    createSignal(0),
    createSignal(0),
    createSignal(0),
    createSignal(0),
    createSignal(0),
  ];
  // workers
  const wrk = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const wLoad = [createSignal(0), createSignal(0), createSignal(0)];
  // edges
  const sInLine = createRef<Line>();
  const sInDot = createRef<Circle>();
  const sOutLine = [createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const sOutDot = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];

  // ---- metric signals --------------------------------------------------
  const pIn = createSignal(0);
  const pDropN = createSignal(0);
  const sQueued = createSignal(0);

  const slotX = [-160, -96, -32, 32, 96, 160];
  const wrkY = [230, 360, 490];

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Message "
        titleB="Queue"
        subtitle="decouple producers from consumers, absorb spikes"
        position={[0, -830]}
      />

      {/* ============ STATE 1 — DIRECT CALL (problem) ============ */}
      <SectionPill ref={pPill} variant="problem" label="SYNCHRONOUS" note="producer calls consumer directly" position={[-30, -660]} />

      <GlowNode ref={pProd} label="PRODUCER" accent={C.teal} width={250} height={96} position={[-340, -440]} />

      <FlowEdge lineRef={pEdgeLine} dotRef={pEdgeDot} from={[-205, -440]} to={[230, -440]} color={C.coral} />

      <ServerNode ref={pCons} name="consumer" load={pConsLoad} width={250} position={[365, -440]} />

      {/* dropped work — coral X marks that appear on the spike */}
      {pDrop.map((r, i) => (
        <Node ref={r} position={[230 + (i % 2) * 64, -340 + Math.floor(i / 2) * 60]}>
          <Line points={[[-16, -16], [16, 16]]} stroke={C.coral} lineWidth={5} />
          <Line points={[[16, -16], [-16, 16]]} stroke={C.coral} lineWidth={5} />
        </Node>
      ))}
      <Txt ref={pBlock} text="BLOCKED" fill={C.coral} fontFamily={F.mono} fontSize={22} letterSpacing={2} position={[-340, -340]} opacity={0} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="INCOMING" value={() => `${Math.round(pIn())}/s`} width={300} />
        <StatCard label="DROPPED" value={() => `${Math.round(pDropN())}`} accent={C.coral} width={300} />
        <StatCard label="PRODUCER" value="blocked" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ STATE 2 — WORK QUEUE (solution) ============ */}
      <SectionPill ref={sPill} variant="solution" label="WORK QUEUE" note="enqueue, move on; workers drain at their pace" position={[10, 70]} />

      <GlowNode ref={sProd} label="PRODUCER" accent={C.teal} width={210} height={88} position={[-400, 360]} />

      <Line ref={sInLine} points={[[-295, 360], [-235, 360]]} stroke={C.teal} lineWidth={3} opacity={0.5} lineDash={[2, 12]} end={0} />
      <Circle ref={sInDot} size={18} fill={C.teal} shadowColor={C.teal} shadowBlur={16} position={[-295, 360]} opacity={0} />

      {/* the queue: a row of buffered slots */}
      <Node position={[-30, 360]}>
        <Circle ref={ring} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
        <Circle ref={ring2} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
        <Rect
          ref={queue}
          size={[400, 130]}
          radius={theme.radius}
          fill={C.panel}
          stroke={C.teal}
          lineWidth={2.5}
          shadowColor={C.teal}
          shadowBlur={theme.glow}
        >
          {slot.map((r, i) => (
            <Rect
              ref={r}
              size={[48, 60]}
              radius={8}
              position={[slotX[i], -8]}
              fill={() => `${C.teal}${slotFill[i]() > 0.5 ? '33' : '11'}`}
              stroke={() => (slotFill[i]() > 0.5 ? C.teal : C.panelBorder)}
              lineWidth={2}
              opacity={() => 0.4 + slotFill[i]() * 0.6}
            />
          ))}
          <Txt text="QUEUE" fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={2} y={42} />
        </Rect>
      </Node>

      {/* fan-out from queue to workers */}
      <FlowEdge lineRef={sOutLine[0]} dotRef={sOutDot[0]} from={[175, 330]} to={[290, wrkY[0]]} color={C.teal} />
      <FlowEdge lineRef={sOutLine[1]} dotRef={sOutDot[1]} from={[175, 360]} to={[290, wrkY[1]]} color={C.teal} />
      <FlowEdge lineRef={sOutLine[2]} dotRef={sOutDot[2]} from={[175, 390]} to={[290, wrkY[2]]} color={C.teal} />

      <ServerNode ref={wrk[0]} name="worker-1" load={wLoad[0]} position={[400, wrkY[0]]} />
      <ServerNode ref={wrk[1]} name="worker-2" load={wLoad[1]} position={[400, wrkY[1]]} />
      <ServerNode ref={wrk[2]} name="worker-3" load={wLoad[2]} position={[400, wrkY[2]]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="QUEUED" value={() => `${Math.round(sQueued())} buffered`} accent={C.teal} width={300} />
        <StatCard label="LOST" value="0" accent={C.teal} width={300} />
        <StatCard label="WORKERS" value="3" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pProd, pCons, sProd, queue]) r().scale(0);
  for (const r of [...wrk]) r().scale(0);
  for (const r of pDrop) r().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // STATE 1: problem — direct synchronous call
  yield* pPill().opacity(1, 0.4);
  yield* all(pProd().scale(1, 0.5, easeOutBack), pCons().scale(1, 0.5, easeOutBack));
  yield* pEdgeLine().end(1, 0.4);
  yield* pStats().opacity(1, 0.4);

  // steady state: a couple of calls get served, consumer ramps up
  yield* all(pIn(120, 0.8), pConsLoad(45, 0.8));
  for (let i = 0; i < 2; i++) {
    pEdgeDot().position([-205, -440]).opacity(1);
    yield* pEdgeDot().position([230, -440], 0.45);
    pEdgeDot().opacity(0);
  }

  // the spike: incoming surges, consumer pegs at 100%, work starts dropping
  yield* all(pIn(500, 1.0), pConsLoad(100, 1.0));
  yield* pBlock().opacity(1, 0.3);
  for (let i = 0; i < pDrop.length; i++) {
    pEdgeDot().position([-205, -440]).opacity(1);
    yield* pEdgeDot().position([110, -440], 0.22);
    pEdgeDot().opacity(0);
    yield* all(
      pDrop[i]().scale(1, 0.25, easeOutBack),
      pDrop[i]().opacity(1, 0.25),
      pDropN(pDropN() + 30, 0.25),
    );
  }
  yield* waitFor(0.8);

  // STATE 2: solution — a queue buffers the spike
  spawn(pulseSonar(ring()));
  yield* waitFor(0.4);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(sProd().scale(1, 0.5, easeOutBack), queue().scale(1, 0.6, easeOutBack));
  yield* sInLine().end(1, 0.3);
  yield* all(
    wrk[0]().scale(1, 0.4, easeOutBack),
    wrk[1]().scale(1, 0.4, easeOutBack),
    wrk[2]().scale(1, 0.4, easeOutBack),
  );
  yield* all(sOutLine[0]().end(1, 0.35), sOutLine[1]().end(1, 0.35), sOutLine[2]().end(1, 0.35));
  yield* sStats().opacity(1, 0.4);

  // producer enqueues fast and moves on — slots fill up, queue buffers the spike
  for (let i = 0; i < slot.length; i++) {
    sInDot().position([-295, 360]).opacity(1);
    yield* sInDot().position([-235, 360], 0.18);
    sInDot().opacity(0);
    yield* all(slotFill[i](1, 0.2), sQueued(sQueued() + 1, 0.2));
  }

  // workers drain the queue at their own pace — front slots empty, dots travel out
  const outFromY = [330, 360, 390];
  yield* all(wLoad[0](40, 0.5), wLoad[1](40, 0.5), wLoad[2](40, 0.5));
  for (let pass = 0; pass < 2; pass++) {
    yield* all(...[0, 1, 2].map(i => sendOut(i)));
    yield* all(
      slotFill[pass * 3 + 0](0, 0.22),
      slotFill[pass * 3 + 1](0, 0.22),
      slotFill[pass * 3 + 2](0, 0.22),
      sQueued(Math.max(0, sQueued() - 3), 0.22),
    );
  }

  // settle: workers steady, queue drained back to a healthy buffer
  yield* all(wLoad[0](33, 0.4), wLoad[1](33, 0.4), wLoad[2](33, 0.4), sQueued(0, 0.4));

  yield* waitFor(1.6);

  // ---- helper: a dot traveling from the queue to worker i -------------
  function* sendOut(i: number) {
    sOutDot[i]().position(new Vector2([175, outFromY[i]])).opacity(1);
    yield* sOutDot[i]().position(new Vector2([290, wrkY[i]]), 0.32, easeOutCubic);
    sOutDot[i]().opacity(0);
  }
});
