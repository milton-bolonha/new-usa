import { defineEventHandler } from 'h3'
import { tracingManager } from '../utils/tracing'

export default defineEventHandler((event) => {
  // Tracing disabled temporarily to fix 500 error
  // event.node usage is causing crashes in newer h3 versions
  return
})