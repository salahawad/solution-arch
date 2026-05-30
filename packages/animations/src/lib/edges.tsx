import {Line, Circle} from '@motion-canvas/2d';
import {createRef, Reference, Vector2, ThreadGenerator} from '@motion-canvas/core';
import {FlowEdge} from '../components';

/** Shared connection-edge helpers: a Line that draws in + a dot that travels along it. */
export interface Edge {
  line: Reference<Line>;
  dot: Reference<Circle>;
}

export function mkEdge(): Edge {
  return {line: createRef<Line>(), dot: createRef<Circle>()};
}

export function edge(e: Edge, from: [number, number], to: [number, number], color?: string) {
  return <FlowEdge lineRef={e.line} dotRef={e.dot} from={from} to={to} color={color} />;
}

/** Animate the connecting line drawing in. */
export function* drawEdge(e: Edge, dur = 0.3): ThreadGenerator {
  yield* e.line().end(1, dur);
}

/** Send the glowing dot from -> to once. */
export function* sendDot(e: Edge, from: [number, number], to: [number, number], dur = 0.4): ThreadGenerator {
  e.dot().position(new Vector2(from)).opacity(1);
  yield* e.dot().position(new Vector2(to), dur);
  e.dot().opacity(0);
}
