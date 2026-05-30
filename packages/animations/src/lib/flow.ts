import {
  ThreadGenerator,
  sequence,
  easeOutBack,
  easeOutCubic,
} from '@motion-canvas/core';
import type {Layout, Node} from '@motion-canvas/2d';

/**
 * Reusable animation helpers shared by every concept scene.
 * Components start "hidden" (scale 0 / opacity 0) and these reveal them.
 */

/** Pop a node in with a slight overshoot (scale 0 -> 1). */
export function popIn(node: Layout, duration = 0.5): ThreadGenerator {
  return node.scale(1, duration, easeOutBack);
}

/** Fade + rise a node into place (opacity 0 -> 1, y offset -> 0). */
export function* fadeUp(node: Node, duration = 0.5, dy = 30): ThreadGenerator {
  node.opacity(0);
  const targetY = node.position.y();
  node.position.y(targetY + dy);
  yield* node.position.y(targetY, duration, easeOutCubic);
}

/** Stagger a list of reveal tasks with a fixed delay between starts. */
export function stagger(delay: number, tasks: ThreadGenerator[]): ThreadGenerator {
  return sequence(delay, ...tasks);
}
