import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${env.PORT}/api/v1`)
})

async function shutdown(signal: string) {
  console.log(`\n${signal} recibido, cerrando...`)
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
