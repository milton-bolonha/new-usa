import { defineEventHandler } from 'h3'
import { generateApiToken } from '../utils/apiTokens'
import { validateOrigin } from '../utils/validateOrigin'

export default defineEventHandler(async (event) => {
  const result: any = {
    steps: [],
    success: false,
    env: process.env.NODE_ENV
  }

  try {
    result.steps.push('Start')
    
    // 1. Test validateOrigin import
    try {
      if (typeof validateOrigin === 'function') {
        result.steps.push('validateOrigin imported')
      } else {
        result.steps.push('validateOrigin IS NOT a function')
      }
    } catch (e: any) {
      result.steps.push('validateOrigin check failed: ' + e.message)
    }

    // 2. Test apiTokens import and usage
    try {
      if (typeof generateApiToken === 'function') {
        result.steps.push('generateApiToken imported')
        
        // 3. Test token generation (CRYPTO CHECK)
        const token = generateApiToken('/api/bills/congress')
        result.steps.push('generateApiToken executed')
        result.tokenPreview = token.substring(0, 5) + '...'
      } else {
         result.steps.push('generateApiToken IS NOT a function')
      }
    } catch (e: any) {
      result.steps.push('generateApiToken failed (CRYPTO CRASH?): ' + e.message)
      return { ...result, error: e.message, stack: e.stack, fatal: true }
    }

    result.success = true
    return result

  } catch (error: any) {
    return {
      steps: result.steps,
      error: error.message,
      stack: error.stack
    }
  }
})
