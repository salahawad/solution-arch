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

  // PROBLEM
  const pPill = createRef<Layout>();
  const pStats = createRef<Layout>();
  const pKeys = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const pKeyEdge = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const pWeb = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const pLoad = [createSignal(0), createSignal(0), createSignal(0), createSignal(0)];

  // SOLUTION
  const sPill = createRef<Layout>();
  const sStats = createRef<Layout>();
  const ringNode = createRef<Circle>();
  const ringPulse = createRef<Circle>();
  const sNodes = [createRef<Node>(), createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const sKeys = [createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>(), createRef<Circle>()];
  const sArc = createRef<Line>();

  // ---- metric signals --------------------------------------------------
  const pNodeN = createSignal(3);
  const pRemapped = createSignal(0);
  const sMoved = createSignal(0);

  // problem node positions (right column of 3, then a 4th appears). The column sits in the
  // band between the section pill (moved up to -700) and the stat row (cards top ~-255):
  // node-0 top -646 (clears the pill) and node-3 bottom -269 (clears the stats).
  const pWebY = [-600, -505, -410, -315];
  // key-dot column spacing (6 dots); lowest dot at pKeyY0 + 5*52 = -310 clears the stats.
  const pKeyY0 = pWebY[0] + 30; // top key dot (-570)
  const pKeyGap = 52;

  // hashing ring geometry (solution)
  // center nudged up + radius shrunk so the ring (and its sonar pulse base)
  // clears the bottom StatRow at y=700 (StatCards top ~625) with margin:
  // ring bottom = 380 + 205 = 585 (≈40px above the stat-card tops).
  const ringCenter = new Vector2(-200, 380);
  const ringR = 205;
  // node angles on the ring (degrees, 0 = right, clockwise positive in +y-down space)
  const nodeAngles = [-90, 30, 150]; // top, lower-right, lower-left (3 nodes)
  const node4Angle = -20; // the node we add (between node-0 at -90 and node-1 at 30)
  const nodeColors = [C.teal, C.amber, C.coral, '#A78BFA'];
  // key angles on the ring
  const keyAngles = [-60, -10, 65, 110, 170, 215];

  const onRing = (deg: number, r = ringR) => {
    const rad = (deg * Math.PI) / 180;
    return new Vector2(
      ringCenter.x + Math.cos(rad) * r,
      ringCenter.y + Math.sin(rad) * r,
    );
  };

  // ---- build tree ------------------------------------------------------
  view.add(
    <>
      <TitleBlock
        ref={title}
        handle="github.com/salahawad/solution-arch"
        titleA="Consistent "
        titleB="Hashing"
        subtitle="add a node without remapping every key"
        position={[0, -830]}
      />

      {/* ============ PROBLEM — hash(key) % N ============ */}
      <SectionPill
        ref={pPill}
        variant="problem"
        label="hash % N"
        note="almost every key moves"
        position={[-160, -660]}
      />

      {/* key column (left) feeding nodes (right) by modulo */}
      <Txt text="keys" fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={2} position={[-410, -640]} />
      {pKeys.map((r, i) => (
        <Circle
          ref={r}
          size={30}
          fill={C.teal}
          shadowColor={C.teal}
          shadowBlur={12}
          position={[-410, pKeyY0 + i * pKeyGap]}
          opacity={0}
          scale={0}
        />
      ))}

      {pKeyEdge.map((r, i) => (
        <Line
          ref={r}
          points={[
            [-390, pKeyY0 + i * pKeyGap],
            [185, pWebY[i % 3]],
          ]}
          stroke={C.coral}
          lineWidth={2.5}
          opacity={0.5}
          lineDash={[2, 12]}
          end={0}
        />
      ))}

      <ServerNode ref={pWeb[0]} name="node-0" load={pLoad[0]} position={[330, pWebY[0]]} width={260} />
      <ServerNode ref={pWeb[1]} name="node-1" load={pLoad[1]} position={[330, pWebY[1]]} width={260} />
      <ServerNode ref={pWeb[2]} name="node-2" load={pLoad[2]} position={[330, pWebY[2]]} width={260} />
      <ServerNode ref={pWeb[3]} name="node-3" load={pLoad[3]} position={[330, pWebY[3]]} width={260} />

      <StatRow ref={pStats} position={[0, -180]} gap={22}>
        <StatCard label="NODES" value={() => `${Math.round(pNodeN())}`} width={300} />
        <StatCard label="REMAPPED" value={() => `${Math.round(pRemapped())}%`} accent={C.coral} width={300} />
        <StatCard label="RESULT" value="miss storm" accent={C.coral} width={300} />
      </StatRow>

      {/* ============ SOLUTION — hash ring ============ */}
      <SectionPill
        ref={sPill}
        variant="solution"
        label="HASH RING"
        note="a key belongs to the next node clockwise"
        position={[-30, 70]}
      />

      {/* the ring */}
      <Circle
        ref={ringPulse}
        position={ringCenter}
        size={ringR * 2}
        stroke={C.teal}
        lineWidth={2}
        opacity={0}
      />
      <Circle
        ref={ringNode}
        position={ringCenter}
        size={ringR * 2}
        stroke={C.panelBorder}
        lineWidth={3}
        end={0}
      />

      {/* the arc that moves when a node is added (key range reassigned) */}
      <Line
        ref={sArc}
        position={ringCenter}
        points={() => {
          const pts: Vector2[] = [];
          // highlight ONLY the slice reassigned to the new node: from the previous node
          // (node-0 at -90) clockwise to n3 (node4Angle ≈ -20) — a small ~70° arc, not the whole ring
          const a0 = -90;
          const a1 = node4Angle;
          const steps = 28;
          for (let i = 0; i <= steps; i++) {
            const a = a0 + ((a1 - a0) * i) / steps;
            const rad = (a * Math.PI) / 180;
            pts.push(new Vector2(Math.cos(rad) * ringR, Math.sin(rad) * ringR));
          }
          return pts;
        }}
        stroke={C.amber}
        lineWidth={10}
        opacity={0}
        end={0}
      />

      {/* node markers on the ring */}
      {sNodes.map((r, i) => {
        const p = i < 3 ? onRing(nodeAngles[i]) : onRing(node4Angle);
        const col = nodeColors[i];
        return (
          <Node ref={r} position={p} opacity={0} scale={0}>
            <Circle size={28} fill={col} stroke={C.bg} lineWidth={3} shadowColor={col} shadowBlur={16} />
            <Txt
              text={i < 3 ? `n${i}` : 'n3'}
              fill={col}
              fontFamily={F.mono}
              fontWeight={700}
              fontSize={22}
              position={onRing(i < 3 ? nodeAngles[i] : node4Angle, ringR + 40).sub(p)}
            />
          </Node>
        );
      })}

      {/* key dots around the ring */}
      {sKeys.map((r, i) => (
        <Circle
          ref={r}
          position={onRing(keyAngles[i], ringR)}
          size={18}
          fill={C.teal}
          shadowColor={C.teal}
          shadowBlur={10}
          opacity={0}
          scale={0}
        />
      ))}

      {/* legend / nodes summary on the right of the ring */}
      <GlowNode label="ring 0 … 2^32" accent={C.teal} width={300} height={84} fontSize={26} position={[300, 230]} />

      <StatRow ref={sStats} position={[0, 700]} gap={22}>
        <StatCard label="STRUCTURE" value="ring" accent={C.teal} width={300} />
        <StatCard label="MOVED" value={() => `${Math.round(sMoved())}%`} accent={C.teal} width={300} />
        <StatCard label="RESULT" value="minimal" accent={C.teal} width={300} />
      </StatRow>
    </>,
  );

  // ---- initial hidden states ------------------------------------------
  title().opacity(0);
  for (const r of [pPill, pStats, sPill, sStats]) r().opacity(0);
  for (const r of pWeb) r().scale(0);
  // node-3 (problem) starts hidden entirely
  pWeb[3]().opacity(0);

  // ---- choreography ----------------------------------------------------
  yield* title().opacity(1, 0.6);
  yield* waitFor(0.2);

  // ========== PROBLEM ==========
  yield* pPill().opacity(1, 0.4);

  // reveal the 3 nodes
  yield* all(
    pWeb[0]().scale(1, 0.4, easeOutBack),
    pWeb[1]().scale(1, 0.4, easeOutBack),
    pWeb[2]().scale(1, 0.4, easeOutBack),
  );

  // reveal keys and map them across the 3 nodes by modulo (teal = settled)
  for (let i = 0; i < pKeys.length; i++) {
    pKeys[i]().scale(1, 0.18, easeOutBack);
    pKeys[i]().opacity(1, 0.18);
  }
  yield* waitFor(0.1);
  yield* all(
    ...pKeyEdge.map(e => e().end(1, 0.35)),
  );
  yield* all(
    pLoad[0](40, 0.6),
    pLoad[1](40, 0.6),
    pLoad[2](40, 0.6),
  );
  // recolor edges teal to show a stable mapping before the change
  yield* all(...pKeyEdge.map(e => e().stroke(C.teal, 0.3)));
  yield* pStats().opacity(1, 0.4);
  yield* waitFor(0.6);

  // add a 4th node: N 3 -> 4, the modulo changes for almost every key
  pWeb[3]().opacity(1);
  yield* all(
    pWeb[3]().scale(1, 0.45, easeOutBack),
    pNodeN(4, 0.6),
  );
  // remap: edges go coral and re-point to (i % 4) nodes -> nearly all move
  yield* all(
    ...pKeyEdge.map((e, i) => {
      const target = i % 4;
      return all(
        e().stroke(C.coral, 0.3),
        e().points(
          [
            [-390, pKeyY0 + i * pKeyGap],
            [185, pWebY[target]],
          ],
          0.6,
          easeOutCubic,
        ),
      );
    }),
    pLoad[3](40, 0.6),
    pRemapped(98, 0.9),
  );
  // load lights coral on the boxes to read as a miss storm
  yield* all(
    pLoad[0](72, 0.5),
    pLoad[1](72, 0.5),
    pLoad[2](72, 0.5),
    pLoad[3](72, 0.5),
  );
  yield* waitFor(0.8);

  // ========== SOLUTION ==========
  yield* sPill().opacity(1, 0.4);

  // draw the ring
  yield* ringNode().end(1, 0.8, easeOutCubic);

  // sonar pulse on the ring
  spawn(pulseSonar(ringPulse(), ringR * 2));

  // place the 3 nodes on the ring
  yield* all(
    sNodes[0]().scale(1, 0.4, easeOutBack),
    sNodes[0]().opacity(1, 0.4),
    sNodes[1]().scale(1, 0.4, easeOutBack),
    sNodes[1]().opacity(1, 0.4),
    sNodes[2]().scale(1, 0.4, easeOutBack),
    sNodes[2]().opacity(1, 0.4),
  );

  // place the keys on the ring
  yield* all(
    ...sKeys.map((k, i) =>
      all(
        k().scale(1, 0.25, easeOutBack).to(1, 0),
        k().opacity(1, 0.25),
      ),
    ),
  );
  yield* sStats().opacity(1, 0.4);
  yield* waitFor(0.4);

  // add a node on the ring — only the keys in one arc move
  yield* all(
    sNodes[3]().scale(1, 0.45, easeOutBack),
    sNodes[3]().opacity(1, 0.4),
  );

  // highlight the single arc that gets reassigned to the new node
  sArc().opacity(0.9);
  yield* sArc().end(1, 0.6, easeOutCubic);

  // the keys inside that arc nudge toward the new node to show they moved
  // arc spans roughly from node4Angle (-20) clockwise back to node-0 (-90 => 270),
  // i.e. keys with angle in (-90 .. -20] belong to n3 now. keyAngles[0] = -60 qualifies.
  const movedKeyIdx = [0];
  yield* all(
    ...movedKeyIdx.map(i =>
      all(
        sKeys[i]().fill(C.amber, 0.4),
        sKeys[i]().scale(1.4, 0.3).to(1, 0.3),
      ),
    ),
    sMoved(17, 0.9),
  );

  yield* waitFor(0.4);
  // settle the arc back to a calm highlight
  yield* sArc().opacity(0.55, 0.4);

  // END — both panels visible and settled (poster frame)
  yield* waitFor(1.6);
});
