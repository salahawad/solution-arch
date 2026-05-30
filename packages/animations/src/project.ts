import {makeProject} from '@motion-canvas/core';
import './fonts.css';
import loadBalancing from './concepts/load-balancing/scene?scene';
import kafka from './concepts/kafka/scene?scene';
import redis from './concepts/redis/scene?scene';
import sharding from './concepts/sharding/scene?scene';
import cdn from './concepts/cdn/scene?scene';
import rateLimiting from './concepts/rate-limiting/scene?scene';

// Editor preview shows the whole library. The embed build uses the per-concept files
// in projects/ to produce one bundle per concept.
export default makeProject({
  scenes: [loadBalancing, kafka, redis, sharding, cdn, rateLimiting],
});
