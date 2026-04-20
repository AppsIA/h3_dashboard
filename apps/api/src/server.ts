import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { authRoutes }     from './routes/auth/index.js'
import { accountRoutes }  from './routes/accounts/index.js'
import { objectiveRoutes } from './routes/objectives/index.js'
import { campaignRoutes } from './routes/campaigns/index.js'
import { webhookRoutes }  from './routes/webhooks/index.js'
import { internalRoutes } from './routes/internal/index.js'
import { databasePlugin } from './plugins/database.js'
import { redisPlugin }    from './plugins/redis.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const NODE_ENV = process.env.NODE_ENV ?? 'development'

export const app = Fastify({
  logger: {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    // Redactar PII dos logs (LGPD)
    redact: {
      paths: ['req.body.name', 'req.body.email', 'req.body.phone', '*.name_enc', '*.email_enc'],
      censor: '[REDACTED]',
    },
  },
  requestIdHeader: 'x-request-id',
  genReqId: () => crypto.randomUUID(),
})

// ─── Plugins ───────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: [
    process.env.WEB_URL ?? 'http://localhost:3000',
    'https://*.lovable.app',  // Lovable preview
  ],
  credentials: true,
})

await app.register(helmet, { contentSecurityPolicy: false })

await app.register(rateLimit, {
  max: 200,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.headers['x-forwarded-for'] as string ?? req.ip,
})

await app.register(databasePlugin)
await app.register(redisPlugin)

// ─── Routes ────────────────────────────────────────────────────────────────

await app.register(authRoutes,      { prefix: '/auth' })
await app.register(accountRoutes,   { prefix: '/accounts' })
await app.register(objectiveRoutes, { prefix: '/accounts' })
await app.register(campaignRoutes,  { prefix: '/accounts' })
await app.register(webhookRoutes,   { prefix: '/webhooks' })
await app.register(internalRoutes,  { prefix: '/internal' })

// ─── Health ────────────────────────────────────────────────────────────────

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

// ─── Start ─────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    app.log.info(`H3 API rodando na porta ${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
