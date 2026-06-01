import {makeProject} from '@motion-canvas/core';
import './fonts.css';
import loadBalancing from './concepts/load-balancing/scene?scene';
import kafka from './concepts/kafka/scene?scene';
import redis from './concepts/redis/scene?scene';
import sharding from './concepts/sharding/scene?scene';
import cdn from './concepts/cdn/scene?scene';
import rateLimiting from './concepts/rate-limiting/scene?scene';
import circuitBreaker from './concepts/circuit-breaker/scene?scene';
import retryBackoff from './concepts/retry-backoff/scene?scene';
import idempotency from './concepts/idempotency/scene?scene';
import replication from './concepts/replication/scene?scene';
import saga from './concepts/saga/scene?scene';
import capTheorem from './concepts/cap-theorem/scene?scene';
import eventSourcing from './concepts/event-sourcing/scene?scene';
import consistentHashing from './concepts/consistent-hashing/scene?scene';
import apiGateway from './concepts/api-gateway/scene?scene';
import messageQueue from './concepts/message-queue/scene?scene';
import leaderElection from './concepts/leader-election/scene?scene';
import kubernetes from './concepts/kubernetes/scene?scene';
import offlineFirst from './concepts/offline-first/scene?scene';
import mobileFirst from './concepts/mobile-first/scene?scene';
import distributedTracing from './concepts/distributed-tracing/scene?scene';
import canary from './concepts/canary/scene?scene';
import backpressure from './concepts/backpressure/scene?scene';
import bulkhead from './concepts/bulkhead/scene?scene';
import outbox from './concepts/outbox/scene?scene';
import deadLetterQueue from './concepts/dead-letter-queue/scene?scene';
import autoscaling from './concepts/autoscaling/scene?scene';
import rag from './concepts/rag/scene?scene';
import aiAgents from './concepts/ai-agents/scene?scene';
import vectorDb from './concepts/vector-db/scene?scene';
import hallucination from './concepts/hallucination/scene?scene';
import contextWindow from './concepts/context-window/scene?scene';
import monitoring from './concepts/monitoring/scene?scene';
import databaseIndexing from './concepts/database-indexing/scene?scene';
import restVsGrpc from './concepts/rest-vs-grpc/scene?scene';

// Editor preview shows the whole library. The embed build uses the per-concept files
// in projects/ to produce one bundle per concept.
export default makeProject({
  scenes: [
    loadBalancing, kafka, redis, sharding, cdn, rateLimiting,
    circuitBreaker, retryBackoff, idempotency, replication, saga, capTheorem,
    eventSourcing, consistentHashing, apiGateway, messageQueue, leaderElection,
    kubernetes, offlineFirst, mobileFirst,
    distributedTracing, canary, backpressure, bulkhead, outbox, deadLetterQueue, autoscaling,
    rag, aiAgents, vectorDb, hallucination, contextWindow, monitoring,
    databaseIndexing, restVsGrpc,
  ],
});
