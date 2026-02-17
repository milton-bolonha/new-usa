import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
    try {
        const allowed = process.env.ALLOWED_ORIGINS || 'NOT_SET'
        const baseUrl = process.env.BASE_URL || 'NOT_SET'
        const secret = process.env.TOKEN_SECRET ? 'SET (Present)' : 'MISSING'

        return {
            status: 'ok',
            env: {
                NODE_ENV: process.env.NODE_ENV,
                ALLOWED_ORIGINS: allowed,
                BASE_URL: baseUrl,
                TOKEN_SECRET_CHECK: secret
            },
            headers: {
                host: event.node.req.headers.host,
                origin: event.node.req.headers.origin
            }
        }
    } catch (e: any) {
        return {
            status: 'error',
            message: e.message
        }
    }
})
