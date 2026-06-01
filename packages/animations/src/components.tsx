import {Rect, Txt, Circle, Line, Layout, Node} from '@motion-canvas/2d';
import {
  Reference,
  PossibleVector2,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
  all,
  easeOutCubic,
} from '@motion-canvas/core';
import {theme} from './theme';

const C = theme.colors;
const F = theme.fonts;

/* ----------------------------------------------------------------------------
 * Title block — handle + split-color title + subtitle, stacked & centered.
 * -------------------------------------------------------------------------- */
export interface TitleBlockProps {
  ref?: Reference<Layout>;
  handle: string;
  titleA: string;
  titleB: string;
  subtitle: string;
  position?: PossibleVector2;
}
export function TitleBlock(props: TitleBlockProps) {
  return (
    <Layout
      ref={props.ref}
      layout
      direction="column"
      alignItems="center"
      gap={16}
      position={props.position}
    >
      <Txt text={props.handle} fill={C.mutedDim} fontFamily={F.mono} fontSize={22} letterSpacing={2} />
      <Layout layout direction="row">
        {props.titleA ? (
          <Txt text={props.titleA.trim()} fill={C.text} fontFamily={F.sans} fontWeight={800} fontSize={96} marginRight={26} />
        ) : null}
        <Txt text={props.titleB} fill={C.teal} fontFamily={F.sans} fontWeight={800} fontSize={96} />
      </Layout>
      <Txt text={props.subtitle} fill={C.muted} fontFamily={F.sans} fontSize={32} fontWeight={500} />
    </Layout>
  );
}

/* ----------------------------------------------------------------------------
 * Section pill — a labelled status pill + descriptor (problem = coral, solution = teal).
 * -------------------------------------------------------------------------- */
export interface SectionPillProps {
  ref?: Reference<Layout>;
  label: string;
  note: string;
  variant?: 'problem' | 'solution';
  /** explicit accent color; overrides `variant` (e.g. amber for a neutral comparison band) */
  accent?: string;
  position?: PossibleVector2;
}
export function SectionPill(props: SectionPillProps) {
  const accent = props.accent ?? (props.variant === 'problem' ? C.coral : C.teal);
  return (
    <Layout ref={props.ref} layout direction="row" alignItems="center" gap={20} position={props.position}>
      <Rect layout padding={[10, 24]} radius={999} fill={`${accent}22`} stroke={accent} lineWidth={2}>
        <Txt text={props.label} fill={accent} fontFamily={F.mono} fontWeight={700} fontSize={28} letterSpacing={2} />
      </Rect>
      <Txt text={props.note} fill={C.muted} fontFamily={F.sans} fontSize={28} />
    </Layout>
  );
}

/* ----------------------------------------------------------------------------
 * GlowNode — generic glowing rounded node with an optional label / children.
 * -------------------------------------------------------------------------- */
export interface GlowNodeProps {
  ref?: Reference<Rect>;
  label?: string;
  labelColor?: string;
  accent?: string;
  fill?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  position?: PossibleVector2;
  scale?: number;
  children?: any;
}
export function GlowNode(props: GlowNodeProps) {
  const accent = props.accent ?? C.teal;
  return (
    <Rect
      ref={props.ref}
      position={props.position}
      size={[props.width ?? 280, props.height ?? 130]}
      radius={theme.radius}
      fill={props.fill ?? C.panel}
      stroke={accent}
      lineWidth={2.5}
      shadowColor={accent}
      shadowBlur={theme.glow}
      scale={props.scale ?? 1}
      layout
      alignItems="center"
      justifyContent="center"
    >
      {props.label ? (
        <Txt
          text={props.label}
          fill={props.labelColor ?? accent}
          fontFamily={F.mono}
          fontSize={props.fontSize ?? 30}
          fontWeight={500}
          letterSpacing={2}
        />
      ) : null}
      {props.children}
    </Rect>
  );
}

/* ----------------------------------------------------------------------------
 * ServerNode — a server box with a live load badge; color shifts teal -> coral.
 * -------------------------------------------------------------------------- */
export interface ServerNodeProps {
  ref?: Reference<Rect>;
  name: string;
  load: SimpleSignal<number, void>; // 0..100
  position?: PossibleVector2;
  width?: number;
  /** font size for the name + load badge (default 30); drop it for narrow nodes in dense grids */
  fontSize?: number;
}
export function ServerNode(props: ServerNodeProps) {
  const fontSize = props.fontSize ?? 30;
  const accent = () => {
    const l = props.load();
    return l > 66 ? C.coral : l > 0 ? C.teal : C.panelBorder;
  };
  return (
    <Rect
      ref={props.ref}
      position={props.position}
      size={[props.width ?? 250, 92]}
      radius={18}
      fill={C.panel}
      stroke={accent}
      lineWidth={2.5}
      shadowColor={accent}
      shadowBlur={() => (props.load() > 0 ? theme.glow : 0)}
      layout
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      padding={[0, 24]}
    >
      <Txt text={props.name} fill={C.text} fontFamily={F.mono} fontSize={fontSize} fontWeight={500} />
      <Txt text={() => `${Math.round(props.load())}%`} fill={accent} fontFamily={F.mono} fontSize={fontSize} fontWeight={700} />
    </Rect>
  );
}

/* ----------------------------------------------------------------------------
 * BalancerNode — central node with two concentric "sonar" rings.
 * Drive the rings with pulseSonar() spawned from the scene.
 * -------------------------------------------------------------------------- */
export interface BalancerNodeProps {
  ref?: Reference<Rect>;
  ringRef?: Reference<Circle>;
  ring2Ref?: Reference<Circle>;
  position?: PossibleVector2;
  label?: string;
  sub?: string;
}
export function BalancerNode(props: BalancerNodeProps) {
  return (
    <Node position={props.position}>
      <Circle ref={props.ringRef} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
      <Circle ref={props.ring2Ref} size={150} stroke={C.teal} lineWidth={2} opacity={0} />
      <Rect
        ref={props.ref}
        size={[240, 130]}
        radius={theme.radius}
        fill={C.panel}
        stroke={C.teal}
        lineWidth={2.5}
        shadowColor={C.teal}
        shadowBlur={theme.glow}
        layout
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap={6}
      >
        <Txt text={props.label ?? 'LOAD BALANCER'} fill={C.teal} fontFamily={F.mono} fontWeight={700} fontSize={24} letterSpacing={2} />
        {props.sub ? <Txt text={props.sub} fill={C.muted} fontFamily={F.mono} fontSize={18} letterSpacing={1} /> : null}
      </Rect>
    </Node>
  );
}

/** Endless sonar pulse for a ring circle (spawn this from the scene). */
export function* pulseSonar(ring: Circle, baseSize = 150): ThreadGenerator {
  ring.size(baseSize);
  while (true) {
    ring.scale(1).opacity(0.55);
    yield* all(ring.scale(3.2, 1.8, easeOutCubic), ring.opacity(0, 1.8, easeOutCubic));
  }
}

/* ----------------------------------------------------------------------------
 * FlowEdge — a connection line that "draws" in, plus a glowing dot that travels.
 * -------------------------------------------------------------------------- */
export interface FlowEdgeProps {
  lineRef?: Reference<Line>;
  dotRef?: Reference<Circle>;
  from: PossibleVector2;
  to: PossibleVector2;
  color?: string;
}
export function FlowEdge(props: FlowEdgeProps) {
  const color = props.color ?? C.teal;
  return (
    <Node>
      <Line
        ref={props.lineRef}
        points={[props.from, props.to]}
        stroke={color}
        lineWidth={3}
        opacity={0.5}
        lineDash={[2, 14]}
        endArrow
        arrowSize={14}
        end={0}
      />
      <Circle
        ref={props.dotRef}
        size={18}
        fill={color}
        shadowColor={color}
        shadowBlur={16}
        position={props.from}
        opacity={0}
      />
    </Node>
  );
}

/* ----------------------------------------------------------------------------
 * StatCard / StatRow — a labelled metric with a (often animated) value.
 * -------------------------------------------------------------------------- */
export interface StatCardProps {
  ref?: Reference<Rect>;
  label: string;
  value: SignalValue<string>;
  accent?: string;
  width?: number;
}
export function StatCard(props: StatCardProps) {
  return (
    <Rect
      ref={props.ref}
      size={[props.width ?? 300, 150]}
      radius={18}
      fill={C.panel}
      stroke={C.panelBorder}
      lineWidth={2}
      layout
      direction="column"
      justifyContent="center"
      alignItems="start"
      padding={[0, 30]}
      gap={12}
    >
      <Txt text={props.label} fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={3} />
      <Txt text={props.value} fill={props.accent ?? C.text} fontFamily={F.sans} fontWeight={700} fontSize={46} />
    </Rect>
  );
}

export interface StatRowProps {
  ref?: Reference<Layout>;
  position?: PossibleVector2;
  gap?: number;
  children?: any;
}
export function StatRow(props: StatRowProps) {
  return (
    <Layout ref={props.ref} layout direction="row" gap={props.gap ?? 24} alignItems="center" position={props.position}>
      {props.children}
    </Layout>
  );
}

/* ----------------------------------------------------------------------------
 * HeroMetric — a big centered animated number (the payoff), with an optional caption.
 * Drive `value`/`sub` from scene signals, e.g. value={() => `${Math.round(ms())}ms`}.
 * -------------------------------------------------------------------------- */
export interface HeroMetricProps {
  ref?: Reference<Layout>;
  value: SignalValue<string>;
  sub?: SignalValue<string>;
  accent?: string;
  fontSize?: number;
  position?: PossibleVector2;
}
export function HeroMetric(props: HeroMetricProps) {
  return (
    <Layout ref={props.ref} layout direction="column" alignItems="center" gap={8} position={props.position}>
      <Txt text={props.value} fill={props.accent ?? C.teal} fontFamily={F.sans} fontWeight={800} fontSize={props.fontSize ?? 140} />
      {props.sub ? <Txt text={props.sub} fill={C.muted} fontFamily={F.sans} fontSize={30} /> : null}
    </Layout>
  );
}

/* ----------------------------------------------------------------------------
 * DbNode — a database "cylinder" (barrel) with a label and optional load badge.
 * -------------------------------------------------------------------------- */
export interface DbNodeProps {
  ref?: Reference<Node>;
  label?: string;
  sub?: string;
  accent?: string;
  width?: number;
  height?: number;
  position?: PossibleVector2;
}
export function DbNode(props: DbNodeProps) {
  const accent = props.accent ?? C.teal;
  const w = props.width ?? 200;
  const h = props.height ?? 180;
  const disk = 42;
  return (
    <Node ref={props.ref} position={props.position}>
      {/* body */}
      <Rect position={[0, 0]} width={w} height={h - disk} fill={C.panel} stroke={accent} lineWidth={2.5} shadowColor={accent} shadowBlur={theme.glow} />
      {/* mask the body's square top/bottom with the panel color via the disks */}
      <Circle position={[0, (h - disk) / 2]} width={w} height={disk} fill={C.panel} stroke={accent} lineWidth={2.5} />
      <Circle position={[0, -(h - disk) / 2]} width={w} height={disk} fill={C.panel} stroke={accent} lineWidth={2.5} />
      {/* a faint middle band for the "stacked disks" look */}
      <Circle position={[0, 0]} width={w} height={disk} stroke={accent} lineWidth={1.5} opacity={0.35} />
      <Txt text={props.label ?? 'DB'} fill={accent} fontFamily={F.mono} fontWeight={700} fontSize={30} y={-6} />
      {props.sub ? <Txt text={props.sub} fill={C.muted} fontFamily={F.mono} fontSize={20} y={28} /> : null}
    </Node>
  );
}

/* ----------------------------------------------------------------------------
 * Bucket — a token bucket: a container plus N token dots stacked inside.
 * -------------------------------------------------------------------------- */
export interface BucketProps {
  ref?: Reference<Rect>;
  tokenRefs?: Reference<Circle>[];
  capacity?: number;
  accent?: string;
  position?: PossibleVector2;
  label?: string;
}
export function Bucket(props: BucketProps) {
  const accent = props.accent ?? C.teal;
  const cap = props.capacity ?? 5;
  const w = 150;
  const h = 200;
  return (
    <Node position={props.position}>
      {/* label lives INSIDE the body Rect so hiding the bucket (ref = the Rect) hides the
          label too — otherwise a sibling label stays visible before the bucket reveals */}
      <Rect ref={props.ref} width={w} height={h} radius={[12, 12, 28, 28]} fill={C.panel} stroke={accent} lineWidth={2.5} shadowColor={accent} shadowBlur={theme.glow}>
        {props.label ? <Txt text={props.label} fill={C.muted} fontFamily={F.mono} fontSize={22} letterSpacing={2} y={h / 2 + 32} /> : null}
      </Rect>
      {Array.from({length: cap}).map((_, i) => (
        <Circle
          ref={props.tokenRefs?.[i]}
          width={36}
          height={36}
          fill={accent}
          shadowColor={accent}
          shadowBlur={10}
          position={[0, h / 2 - 34 - i * 36]}
          opacity={0}
        />
      ))}
    </Node>
  );
}
