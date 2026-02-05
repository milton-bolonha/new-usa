import { defineEventHandler } from 'h3'
// import { generateApiToken } from '../utils/apiTokens'
import { validateOrigin } from '../utils/validateOrigin'

export default defineEventHandler(async (event) => {
  const result: any = {
    steps: [],
    success: false
  }

  try {
    result.steps.push('Start')
    
    // 1. Test validateOrigin import and simple call
    try {
      if (typeof validateOrigin === 'function') {
        result.steps.push('validateOrigin imported')
      } else {
        result.steps.push('validateOrigin IS NOT a function')
      }
    } catch (e: any) {
      result.steps.push('validateOrigin check failed: ' + e.message)
    }

    /*
    // 2. Test apiTokens import
    try {
      if (typeof generateApiToken === 'function') {
        result.steps.push('generateApiToken imported')
        
        // 3. Test token generation
        const token = generateApiToken('/api/bills/congress')
        result.steps.push('generateApiToken executed')
        result.tokenPreview = token.substring(0, 10) + '...'
      } else {
         result.steps.push('generateApiToken IS NOT a function')
      }
    } catch (e: any) {
      result.steps.push('generateApiToken failed: ' + e.message)
      // Return immediately if this fails, as it's likely the cause
      return { ...result, error: e.message, stack: e.stack }
    }
    */

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
