import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
    return {
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        openssl: process.versions.openssl
    }
})
