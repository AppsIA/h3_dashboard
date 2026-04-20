import Redis from 'ioredis'
import { createAdsSyncQueue, createAdsSyncWorker } from './queues/ads-sync.queue.js'
import { createCrmSyncQueue, createCrmSyncWorker } from './queues/crm-sync.queue.js'
import { scheduleAdsSyncForAllAccounts, scheduleCrmPollForAllAccounts } from './scheduler.js'
import { logger } from './logger.js'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,  // BullMQ requer null
  enableReadyCheck: false,
})

// Filas
const adsQueue = createAdsSyncQueue(redis)
const crmQueue = createCrmSyncQueue(redis)

// Workers
const adsWorker = createAdsSyncWorker(redis)
const crmWorker = createCrmSyncWorker(redis)

// ─── Eventos de diagnóstico ───────────────────────────────────────────────

adsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, name: job.name }, 'Ads sync job concluído')
})
adsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Ads sync job falhou')
})
crmWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'CRM sync job falhou')
})

// ─── Schedulers nativos (setInterval — substituir por pg_cron em prod) ───

// Ads sync: a cada 6 horas
setInterval(
  () => scheduleAdsSyncForAllAccounts(adsQueue),
  6 * 60 * 60 * 1000
)

// CRM poll: a cada 2 minutos
let lastCrmPoll = new Date(Date.now() - 2 * 60 * 1000)
const crmInterval = setInterval(async () => {
  const pollFrom = lastCrmPoll
  lastCrmPoll = new Date()
  await scheduleCrmPollForAllAccounts(crmQueue, pollFrom)
}, 2 * 60 * 1000)

// Executa imediatamente na inicialização
scheduleAdsSyncForAllAccounts(adsQueue).catch(logger.error.bind(logger))
scheduleCrmPollForAllAccounts(crmQueue, new Date(Date.now() - 5 * 60 * 1000)).catch(logger.error.bind(logger))

logger.info('Workers H3 Dashboard iniciados')
logger.info('  - Ads sync: a cada 6h')
logger.info('  - CRM poll: a cada 2min')

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando workers...')
  clearInterval(crmInterval)
  await adsWorker.close()
  await crmWorker.close()
  await redis.quit()
  process.exit(0)
})
