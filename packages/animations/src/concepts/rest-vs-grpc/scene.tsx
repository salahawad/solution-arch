import {makeScene2D, Rect, Txt, Circle, Line, Layout} from '@motion-canvas/2d';
import {
  createRef,
  all,
  waitFor,
  easeOutBack,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {
  TitleBlock,
  SectionPill,
  GlowNode,
  FlowEdge,
  StatCard,
  StatRow,
  HeroMetric,
} from '../../components';

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

  // REST — top band (amber, neutral)
  const rPill = createRef<Layout>();
  const rClient = createRef<Rect>();
  const rServer = createRef<Rect>();
  const rEdge = createRef<Line>();
  const rDot = createRef<Circle>();
  const rTag = createRef<Rect>();
  const rHero = createRef<Layout>();
  const rStats = createRef<Layout>();

  // gRPC — bottom band (teal)
  const gPill = createRef<Layout>();
  const gClient = createRef<Rect>();
  const gServer = createRef<Rect>();
  const gEdge = createRef<Line>();
  const gDot = createRef<Circle>();
  const gTag = createRef<Rect>();
  const gHero = createRef<Layout>();
  const gStats = createRef<Layout>();

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="REST vs "
        titleB=" gRPC"
        subtitle="same call, different wire — pick by the edge you're on"
        position={[0, -830]}
      />

      {/* ============ REST · HTTP/1.1 (amber) ============ */}
      <SectionPill ref={rPill} accent={C.amber} label="REST · HTTP/1.1" note="text · simple · universal" position={[-110, -660]} />

      <GlowNode ref={rClient} label="Client" accent={C.amber} width={220} height={92} position={[-380, -500]} />
      <GlowNode ref={rServer} label="Server" accent={C.amber} width={220} height={92} position={[380, -500]} />
      <FlowEdge lineRef={rEdge} dotRef={rDot} from={[-270, -500]} to={[270, -500]} color={C.amber} />

      <Rect ref={rTag} layout padding={[6, 18]} radius={999} fill={`${C.amber}1A`} stroke={C.amber} lineWidth={2} position={[0, -610]}>
        <Txt text={'200 OK   { "name": "Ana", … }'} fill={C.amber} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Rect>

      <HeroMetric ref={rHero} value="~1.2 KB" sub="JSON text per call" accent={C.amber} position={[0, -300]} />

      <StatRow ref={rStats} position={[0, -120]} gap={22}>
        <StatCard label="WIRE" value="JSON" accent={C.amber} width={300} />
        <StatCard label="TRANSPORT" value="HTTP/1.1" accent={C.amber} width={300} />
        <StatCard label="SHAPE" value="1 req → 1 resp" accent={C.amber} width={300} />
      </StatRow>

      {/* ============ gRPC · HTTP/2 (teal) ============ */}
      <SectionPill ref={gPill} accent={C.teal} label="gRPC · HTTP/2" note="binary · fast · streaming" position={[-110, 70]} />

      <GlowNode ref={gClient} label="Client" accent={C.teal} width={220} height={92} position={[-380, 250]} />
      <GlowNode ref={gServer} label="Server" accent={C.teal} width={220} height={92} position={[380, 250]} />
      <FlowEdge lineRef={gEdge} dotRef={gDot} from={[-270, 250]} to={[270, 250]} color={C.teal} />

      <Rect ref={gTag} layout padding={[6, 18]} radius={999} fill={`${C.teal}1A`} stroke={C.teal} lineWidth={2} position={[0, 150]}>
        <Txt text="proto · stream: chunk 1 · 2 · 3" fill={C.teal} fontFamily={F.mono} fontSize={22} letterSpacing={1} />
      </Rect>

      <HeroMetric ref={gHero} value="~0.3 KB" sub="protobuf binary per call" accent={C.teal} position={[0, 450]} />

      <StatRow ref={gStats} position={[0, 700]} gap={22}>
        <StatCard label="WIRE" value="Protobuf" accent={C.teal} width={300} />
        <StatCard label="TRANSPORT" value="HTTP/2" accent={C.teal} width={300} />
        <StatCard label="SHAPE" value="stream" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [rPill, rStats, gPill, gStats, rTag, gTag, rHero, gHero]) r().opacity(0);
  for (const r of [rClient, rServer, gClient, gServer]) r().scale(0);
  gHero().scale(0.8);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // REST: one request, one response — repeated (verbose, chatty)
  yield* rPill().opacity(1, 0.4);
  yield* all(rClient().scale(1, 0.5, easeOutBack), rServer().scale(1, 0.5, easeOutBack));
  yield* all(rEdge().end(1, 0.4), rStats().opacity(1, 0.4));
  yield* all(rTag().opacity(1, 0.4), rHero().opacity(1, 0.4));
  for (let i = 0; i < 2; i++) {
    rDot().position([-270, -500]).opacity(1);
    yield* rDot().position([270, -500], 0.4); // request out
    yield* rDot().position([-270, -500], 0.4); // response back
    rDot().opacity(0);
    yield* waitFor(0.15);
  }
  yield* waitFor(0.6);

  // gRPC: open one connection; the server streams many chunks back over it
  yield* gPill().opacity(1, 0.4);
  yield* all(gClient().scale(1, 0.5, easeOutBack), gServer().scale(1, 0.5, easeOutBack));
  yield* all(gEdge().end(1, 0.4), gStats().opacity(1, 0.4));
  yield* all(gTag().opacity(1, 0.4), gHero().opacity(1, 0.4), gHero().scale(1, 0.5, easeOutBack));

  // proto request opens the stream
  gDot().position([-270, 250]).opacity(1);
  yield* gDot().position([270, 250], 0.35);
  gDot().opacity(0);

  // three chunks stream back over the single connection
  for (let i = 0; i < 3; i++) {
    gDot().position([270, 250]).opacity(1);
    yield* gDot().position([-270, 250], 0.3);
    gDot().opacity(0);
    yield* waitFor(0.08);
  }

  // settle — END with BOTH bands visible (poster frame)
  yield* waitFor(1.6);
});
