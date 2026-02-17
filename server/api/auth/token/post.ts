import { defineEventHandler, readBody, createError } from 'h3'
import { validateOrigin, setCorsHeaders } from '../../../utils/validateOrigin'
import { generateApiToken } from '../../../utils/apiTokens'

interface AuthTokenRequestBody {
    endpoint: string
}

export default defineEventHandler(async (event) => {
    // CORS & Origin Validation
    validateOrigin(event)
    setCorsHeaders(event)

    // Handle OPTIONS request
    if (event.node.req.method === 'OPTIONS') {
        return 'OK'
    }

    try {
        // Use process.env directly
        const tokenSecret = process.env.TOKEN_SECRET || 'your-secret-key-change-in-production'

        // 1. Validate Environment Variables
        if (!tokenSecret) {
            // This should technically never happen due to the default above, but keeping for safety
            console.warn('[WARNING] Using default TOKEN_SECRET')
        }

        console.log('[DEBUG] Auth Token Request:', {
            method: event.node.req.method,
            url: event.node.req.url,
            headers: {
                host: event.node.req.headers.host,
                origin: event.node.req.headers.origin
            }
        })

        // 2. Parse Body (Trusting h3's readBody with @netlify/nuxt)
        let body: AuthTokenRequestBody
        try {
            body = await readBody(event)
        } catch (parseError: any) {
            console.error('[ERROR] Body parsing failed:', parseError.message)
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid request body',
            })
        }

        if (!body || !body.endpoint) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Endpoint is required',
            })
        }

        // 3. Validate Endpoint
        const allowedEndpoints = [
            'bills/congress',
            'bills/city-council',
            'courts/2',
            'courts/3',
            'courts/4',
            'courts/5',
            'courts/6',
            'courts/7',
            'courts/8',
            'courts/9',
            'courts/10',
            'courts/11',
            'courts/12',
            'courts/13',
            'courts/14',
            'courts/15',
            'courts/16',
            'courts/17',
            'district-court',
            'federal-rules/frcp',
            'federal-rules/frcmp',
            'laws/federal',
            'laws/eo',
            'laws/municipal',
            'constitution/constitution',
            'constitution/constitution-amandments',
            'constitution/articles',
            'resources/definitions',
            'resources/files',
            'resources/court-procedure',
            'resources/office',
            'resources/vips',
        ]

        if (!allowedEndpoints.includes(body.endpoint)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid endpoint: ' + body.endpoint,
            })
        }

        // 4. Generate Token
        console.log('[DEBUG] Generating token for endpoint:', body.endpoint)
        const token = generateApiToken(body.endpoint)

        return {
            token,
            expiresIn: '5 minutes'
        }

    } catch (error: any) {
        console.error('[ERROR] Token endpoint failure:', {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode
        })

        // Propagate the error with proper status code
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error',
            data: { message: error.message } // Optional: expose error message for debugging
        })
    }
})
