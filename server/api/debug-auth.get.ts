import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  return {
    status: 'ok',
    message: 'Debug auth minimal working',
    time: new Date().toISOString()
  }
})
