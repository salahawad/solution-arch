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
  const pServer = createRef<Rect>();
  const pEdge1 = createRef<Line>();
  const pDot1 = createRef<Circle>();
  const pEdge2 = createRef<Line>();
  const pDot2 = createRef<Circle>();
  const pTicket = [createRef<Node>(), createRef<Node>()];
  const pStats = createRef<Layout>();

  // solution panel
  const sPill = createRef<Layout>();
  const sClient = createRef<Rect>();
  const sServer = createRef<Rect>();
  const sStore = createRef<Rect>();
  const ring = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sEdge1 = createRef<Line>();
  const sDot1 = createRef<Circle>();
  const sEdge2 = createRef<Line>();
  const sDot2 = createRef<Circle>();
  const sStoreEdge = createRef<Line>();
  const sStoreDot = createRef<Circle>();
  const sTicket = createRef<Node>();
  const sDedup = createRef<Node>();
  const sStats = createRef<Layout>();

  // ---- metric signals --------------------------------------------------
  const pReqN = createSignal(0);
  const pCharged = createSignal(0);
  const pDup = createSignal(0);
  const sReqN = createSignal(0);
  const sCharged = createSignal(0);
  const sDedup2 = createSignal(0);

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA=""
        titleB="Idempotency"
        subtitle="make retries safe — exactly once, not twice"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — naive retry double-charges ============ */}
      <SectionPill ref={pPill} variant="problem" label="NAIVE RETRY" note="the retry charges the card twice" position={[-40, -660]} />

      <GlowNode ref={pClient} label="CLIENT" accent={C.coral} width={250} height={110} position={[-330, -470]} />
      <GlowNode ref={pServer} label="SERVER" accent={C.coral} width={250} height={110} position={[330, -470]} />

      {/* first "charge $20" request → server */}
      <FlowEdge lineRef={pEdge1} dotRef={pDot1} from={[-205, -495]} to={[205, -495]} color={C.coral} />
      {/* duplicate retry "charge $20" request → server */}
      <FlowEdge lineRef={pEdge2} dotRef={pDot2} from={[-205, -445]} to={[205, -445]} color={C.coral} />

      {/* two charge tickets pile up below the server — both fully clear of the stat row */}
      <Node ref={pTicket[0]} position={[330, -340]}>
        <Rect size={[210, 60]} radius={12} fill={C.panel} stroke={C.coral} lineWidth={2.5} shadowColor={C.coral} shadowBlur={theme.glow} layout alignItems="center" justifyContent="center">
          <Txt text="charge $20" fill={C.coral} fontFamily={F.mono} fontSize={28} fontWeight={700} />
        </Rect>
      </Node>
      <Node ref={pTicket[1]} position={[330, -272]}>
        <Rect size={[210, 60]} radius={12} fill={C.panel} stroke={C.coral} lineWidth={2.5} shadowColor={C.coral} shadowBlur={theme.glow} layout alignItems="center" justifyContent="center">
          <Txt text="charge $20" fill={C.coral} fontFamily={F.mono} fontSize={28} fontWeight={700} />
        </Rect>
      </Node>

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="REQUESTS" value={() => `${Math.round(pReqN())}`} width={300} />
        <StatCard label="CHARGED" value={() => `$${Math.round(pCharged())}`} accent={C.coral} width={300} />
        <StatCard label="DUPLICATE" value={() => (pDup() > 0 ? 'yes' : '—')} accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — idempotency key dedups the retry ============ */}
      <SectionPill ref={sPill} variant="solution" label="IDEMPOTENCY KEY" note="same key → return the stored result" position={[-30, 90]} />

      <GlowNode ref={sClient} label="CLIENT" accent={C.teal} width={250} height={110} position={[-330, 290]} />
      <BalancerNode ref={sServer} ringRef={ring} ring2Ref={ring2} position={[330, 290]} label="SERVER" sub="key abc123" />

      {/* key store below the server */}
      <GlowNode ref={sStore} label="KEY STORE" accent={C.teal} width={250} height={100} position={[330, 500]} />

      {/* first request carries the key */}
      <FlowEdge lineRef={sEdge1} dotRef={sDot1} from={[-205, 265]} to={[205, 265]} color={C.teal} />
      {/* retry with the same key (stops at the DEDUP badge) */}
      <FlowEdge lineRef={sEdge2} dotRef={sDot2} from={[-205, 315]} to={[205, 315]} color={C.teal} />
      {/* server writes / reads the key in the store */}
      <FlowEdge lineRef={sStoreEdge} dotRef={sStoreDot} from={[330, 350]} to={[330, 450]} color={C.teal} />

      {/* the single charge ticket, parked just left of the store path */}
      <Node ref={sTicket} position={[150, 400]} opacity={0}>
        <Rect size={[200, 58]} radius={12} fill={C.panel} stroke={C.teal} lineWidth={2.5} shadowColor={C.teal} shadowBlur={theme.glow} layout alignItems="center" justifyContent="center">
          <Txt text="charge $20" fill={C.teal} fontFamily={F.mono} fontSize={26} fontWeight={700} />
        </Rect>
      </Node>

      {/* dedup hit badge between client and server */}
      <Node ref={sDedup} position={[0, 315]}>
        <Rect size={[150, 56]} radius={999} fill={`${C.teal}22`} stroke={C.teal} lineWidth={2} layout alignItems="center" justifyContent="center">
          <Txt text="DEDUP" fill={C.teal} fontFamily={F.mono} fontSize={24} fontWeight={700} letterSpacing={2} />
        </Rect>
      </Node>

      <StatRow ref={sStats} position={[0, 680]} gap={22}>
        <StatCard label="KEY" value="abc123" accent={C.teal} width={300} />
        <StatCard label="CHARGED" value={() => `$${Math.round(sCharged())}`} accent={C.teal} width={300} />
        <StatCard label="DEDUP" value={() => (sDedup2() > 0 ? 'hit' : '—')} accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of [pClient, pServer, sClient, sServer, sStore]) r().scale(0);
  for (const r of [...pTicket, sDedup]) r().scale(0).opacity(0);
  sTicket().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // ===== PROBLEM: the retry double-charges =====
  yield* pPill().opacity(1, 0.4);
  yield* all(pClient().scale(1, 0.5, easeOutBack), pServer().scale(1, 0.5, easeOutBack));
  yield* pStats().opacity(1, 0.4);

  // first "charge $20" request travels and lands → first ticket + first charge
  yield* pEdge1().end(1, 0.35);
  pDot1().position([-205, -495]).opacity(1);
  yield* pDot1().position([205, -495], 0.45);
  pDot1().opacity(0);
  yield* all(
    pTicket[0]().scale(1, 0.4, easeOutBack),
    pTicket[0]().opacity(1, 0.3),
    pReqN(1, 0.4),
    pCharged(20, 0.5),
  );
  yield* waitFor(0.3);

  // response is lost → client retries → server processes it AGAIN
  yield* pEdge2().end(1, 0.35);
  pDot2().position([-205, -445]).opacity(1);
  yield* pDot2().position([205, -445], 0.45);
  pDot2().opacity(0);
  yield* all(
    pTicket[1]().scale(1, 0.4, easeOutBack),
    pTicket[1]().opacity(1, 0.3),
    pReqN(2, 0.4),
    pCharged(40, 0.6),
    pDup(1, 0.4),
  );
  yield* waitFor(0.7);

  // ===== SOLUTION: idempotency key dedups the retry =====
  spawn(pulseSonar(ring()));
  yield* waitFor(0.3);
  spawn(pulseSonar(ring2()));

  yield* sPill().opacity(1, 0.4);
  yield* all(
    sClient().scale(1, 0.5, easeOutBack),
    sServer().scale(1, 0.6, easeOutBack),
  );
  yield* sStore().scale(1, 0.5, easeOutBack);
  yield* sStats().opacity(1, 0.4);

  // first request carries the key → server charges once and stores key→result
  yield* sEdge1().end(1, 0.3);
  sDot1().position([-205, 265]).opacity(1);
  yield* sDot1().position([205, 265], 0.4);
  sDot1().opacity(0);
  yield* all(
    sTicket().scale(1, 0.4, easeOutBack),
    sTicket().opacity(1, 0.3),
    sReqN(1, 0.4),
    sCharged(20, 0.5),
  );
  // server writes the key→result into the store
  yield* sStoreEdge().end(1, 0.3);
  sStoreDot().position([330, 350]).opacity(1);
  yield* sStoreDot().position([330, 450], 0.35);
  sStoreDot().opacity(0);
  yield* waitFor(0.3);

  // retry with the SAME key → dedup hit → stored result returned, no re-charge
  yield* sEdge2().end(1, 0.3);
  sDot2().position([-205, 315]).opacity(1);
  yield* sDot2().position([0, 315], 0.3);
  sDot2().opacity(0);
  yield* all(
    sDedup().scale(1, 0.4, easeOutBack),
    sDedup().opacity(1, 0.3),
    sDedup2(1, 0.4),
  );
  yield* all(sReqN(2, 0.4), sCharged(20, 0.3)); // charged stays $20

  yield* waitFor(1.6);
});
