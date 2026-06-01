import {makeScene2D, Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  createRef,
  all,
  waitFor,
  easeOutCubic,
  easeOutBack,
  easeInOutCubic,
} from '@motion-canvas/core';
import {theme} from '../../theme';
import {TitleBlock, SectionPill, StatCard, StatRow} from '../../components';

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

  // PROBLEM — the budget overflows; earliest tokens are dropped
  const pPill = createRef<Layout>();
  const pWindow = createRef<Rect>();
  const pTiles = [
    createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(),
    createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(),
  ];
  const pDropped = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pDropLabel = createRef<Txt>();
  const pFeed = createRef<Rect>();
  const pStats = createRef<Layout>();

  // SOLUTION — compact: summarize the old, retrieve the relevant; it fits
  const sPill = createRef<Layout>();
  const sWindow = createRef<Rect>();
  const sOld = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()]; // collapse into one summary
  const sSummary = createRef<Rect>();
  const sRetrieved = [createRef<Rect>(), createRef<Rect>()];
  const sKeep = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()]; // recent tokens kept
  const sStats = createRef<Layout>();

  // ---- layout constants ------------------------------------------------
  const tileW = 56;
  const tileH = 40;
  const tileStep = 64;

  // window container geometry
  const winW = 600;
  const winH = 140;
  const pWinPos: [number, number] = [60, -430];
  const sWinPos: [number, number] = [60, 380];

  // 8 tile slots inside a window, centered on the window x
  const slotXs = (cx: number, n: number) =>
    Array.from({length: n}, (_, i) => cx + (i - (n - 1) / 2) * tileStep);
  const pSlots = slotXs(pWinPos[0], 8);

  // a small rounded token tile
  const Tile = (
    ref: any,
    x: number,
    y: number,
    accent: string,
    label: string,
    w = tileW,
  ) => (
    <Rect
      ref={ref}
      position={[x, y]}
      size={[w, tileH]}
      radius={10}
      fill={C.panel}
      stroke={accent}
      lineWidth={2.5}
      shadowColor={accent}
      shadowBlur={16}
      layout
      alignItems="center"
      justifyContent="center"
    >
      <Txt text={label} fill={accent} fontFamily={F.mono} fontSize={18} fontWeight={700} letterSpacing={1} />
    </Rect>
  );

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Context "
        titleB="Window"
        subtitle="a model sees a fixed token budget — choose what to keep"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — OVERFLOW ============ */}
      <SectionPill ref={pPill} variant="problem" label="OVERFLOW" note="prompt + history exceed the budget" position={[-10, -650]} />

      {/* the dropped (coral) tiles spilling off the LEFT edge of the window */}
      {pDropped.map((r, i) =>
        Tile(r, pWinPos[0] - winW / 2 - 52 - i * tileStep, pWinPos[1], C.coral, '✕'),
      )}
      <Txt
        ref={pDropLabel}
        text="dropped"
        fill={C.coral}
        fontFamily={F.mono}
        fontSize={20}
        letterSpacing={2}
        position={[pWinPos[0] - winW / 2 - 116, pWinPos[1] + 50]}
      />

      {/* the fixed window container */}
      <Rect
        ref={pWindow}
        position={pWinPos}
        size={[winW, winH]}
        radius={theme.radius}
        fill={`${C.panel}`}
        stroke={C.teal}
        lineWidth={2.5}
        shadowColor={C.teal}
        shadowBlur={theme.glow}
      />
      <Txt text="CONTEXT WINDOW · 128K" fill={C.teal} fontFamily={F.mono} fontSize={22} fontWeight={700} letterSpacing={2} position={[pWinPos[0], pWinPos[1] - winH / 2 - 26]} />

      {/* the 8 token tiles that fill the window */}
      {pSlots.map((x, i) => Tile(pTiles[i], x, pWinPos[1], C.teal, `t${i + 1}`))}

      {/* the incoming feed marker on the right (more tokens still arriving) */}
      {Tile(pFeed, pWinPos[0] + winW / 2 + 60, pWinPos[1], C.amber, '+++')}

      <StatRow ref={pStats} position={[0, -160]} gap={22}>
        <StatCard label="WINDOW" value="128K" accent={C.teal} width={300} />
        <StatCard label="INPUT" value="exceeds" accent={C.coral} width={300} />
        <StatCard label="LOST" value="oldest" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — FIT THE BUDGET ============ */}
      <SectionPill ref={sPill} variant="solution" label="FIT THE BUDGET" note="retrieve only what's relevant, summarize the rest" position={[-10, 70]} />

      {/* the same fixed window container */}
      <Rect
        ref={sWindow}
        position={sWinPos}
        size={[winW, winH]}
        radius={theme.radius}
        fill={`${C.panel}`}
        stroke={C.teal}
        lineWidth={2.5}
        shadowColor={C.teal}
        shadowBlur={theme.glow}
      />
      <Txt text="CONTEXT WINDOW · 128K" fill={C.teal} fontFamily={F.mono} fontSize={22} fontWeight={700} letterSpacing={2} position={[sWinPos[0], sWinPos[1] - winH / 2 - 26]} />

      {/* three old tiles that will collapse into one summary tile */}
      {sOld.map((r, i) =>
        Tile(r, sWinPos[0] - winW / 2 + 60 + i * tileStep, sWinPos[1], C.teal, `t${i + 1}`),
      )}

      {/* the merged "summary" tile (wide) — starts hidden, appears on compaction */}
      {Tile(sSummary, sWinPos[0] - winW / 2 + 110, sWinPos[1], C.teal, 'summary', 168)}

      {/* a couple of "retrieved" relevant tiles */}
      {sRetrieved.map((r, i) =>
        Tile(r, sWinPos[0] - 20 + i * 124, sWinPos[1], C.teal, 'retrieved', 108),
      )}

      {/* recent tokens kept verbatim on the right */}
      {sKeep.map((r, i) =>
        Tile(r, sWinPos[0] + winW / 2 - 156 + i * tileStep, sWinPos[1], C.teal, `t${6 + i}`),
      )}

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="STRATEGY" value="compact" accent={C.teal} width={300} />
        <StatCard label="FIT" value="in budget" accent={C.teal} width={300} />
        <StatCard label="COST" value="bounded" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  pWindow().scale(0);
  sWindow().scale(0);
  for (const r of pTiles) r().scale(0).opacity(0);
  for (const r of pDropped) r().scale(0).opacity(0);
  pDropLabel().opacity(0);
  pFeed().scale(0).opacity(0);
  for (const r of sOld) r().scale(0).opacity(0);
  sSummary().scale(0).opacity(0);
  for (const r of sRetrieved) r().scale(0).opacity(0);
  for (const r of sKeep) r().scale(0).opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // PROBLEM: the window fills, then overflows --------------------------
  yield* pPill().opacity(1, 0.4);
  yield* pWindow().scale(1, 0.55, easeOutBack);

  // feed a stream of tokens in from the left — they pop into their slots
  for (let i = 0; i < pTiles.length; i++) {
    pTiles[i]().position([pWinPos[0] - winW / 2 - 60, pWinPos[1]]).scale(1).opacity(1);
    yield* pTiles[i]().position([pSlots[i], pWinPos[1]], 0.16, easeOutCubic);
  }

  // the window is full; the amber feed marker shows more tokens still arriving
  yield* all(pFeed().scale(1, 0.35, easeOutBack), pFeed().opacity(1, 0.3));
  yield* pFeed().position([pWinPos[0] + winW / 2 + 20, pWinPos[1]], 0.3, easeInOutCubic);
  yield* pFeed().position([pWinPos[0] + winW / 2 + 60, pWinPos[1]], 0.2, easeOutCubic);

  // overflow: the earliest tokens get shoved off the LEFT edge as dropped tiles
  yield* all(
    ...pDropped.map((r, i) =>
      all(
        r().scale(1, 0.3, easeOutBack),
        r().opacity(1, 0.3),
      ),
    ),
    // the in-window tiles turn the leftmost ones coral to read as "about to fall off"
    pTiles[0]().stroke(C.coral, 0.4),
    pTiles[0]().shadowColor(C.coral, 0.4),
  );
  yield* pDropLabel().opacity(1, 0.3);
  yield* pStats().opacity(1, 0.4);

  yield* waitFor(0.8);

  // SOLUTION: compact so it fits ---------------------------------------
  yield* sPill().opacity(1, 0.4);
  yield* sWindow().scale(1, 0.55, easeOutBack);

  // the recent tokens we keep verbatim appear on the right
  yield* all(
    ...sKeep.map((r, i) =>
      all(r().scale(1, 0.35, easeOutBack), r().opacity(1, 0.3)),
    ),
  );

  // the old tokens appear on the left (the candidates for compaction)
  yield* all(
    ...sOld.map((r, i) =>
      all(r().scale(1, 0.35, easeOutBack), r().opacity(1, 0.3)),
    ),
  );
  yield* waitFor(0.4);

  // compaction: the three old tiles collapse / merge into one wide summary tile
  const mergeTarget: [number, number] = [sWinPos[0] - winW / 2 + 110, sWinPos[1]];
  yield* all(
    ...sOld.map(r =>
      all(
        r().position(mergeTarget, 0.55, easeInOutCubic),
        r().scale(0.2, 0.55, easeInOutCubic),
        r().opacity(0, 0.55, easeInOutCubic),
      ),
    ),
  );
  yield* all(sSummary().scale(1, 0.4, easeOutBack), sSummary().opacity(1, 0.35));

  // retrieve only the relevant chunks into the freed space
  yield* all(
    ...sRetrieved.map((r, i) =>
      all(r().scale(1, 0.4, easeOutBack), r().opacity(1, 0.35)),
    ),
  );
  yield* sStats().opacity(1, 0.4);

  // everything now FITS inside the window — tint settled-healthy tiles teal
  yield* all(
    sSummary().fill(`${C.teal}22`, 0.4),
    ...sRetrieved.map(r => r().fill(`${C.teal}22`, 0.4)),
    ...sKeep.map(r => r().fill(`${C.teal}22`, 0.4)),
  );

  yield* waitFor(1.8);
});
