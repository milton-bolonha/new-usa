import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isCI = process.env.CI === 'true'

const nitropackCorePath = path.join(__dirname, '../node_modules/nitropack/dist/core/index.mjs')
const nitropackCachePath = path.join(
  __dirname,
  '../node_modules/nitropack/dist/runtime/internal/cache.mjs'
)
const nitropackUtilsPath = path.join(
  __dirname,
  '../node_modules/nitropack/dist/runtime/internal/utils.mjs'
)
const nuxtNitroServerPath = path.join(
  __dirname,
  '../node_modules/@nuxt/nitro-server/dist/runtime/handlers/error.js'
)

// Patch Nitro's internal app to handle h3 v2 handlers
// TEMPORARILY DISABLED - wrapper causing 500 errors
/*
const nitroInternalAppPath = path.join(__dirname, '../node_modules/nitropack/dist/runtime/internal/app.mjs');
if (fs.existsSync(nitroInternalAppPath)) {
  let content = fs.readFileSync(nitroInternalAppPath, 'utf8');
  
  if (!content.includes('h3v2CompatWrapper')) {
    content = content.replace(
      /import \{ createApp \} from 'h3';/,
      "import { createApp, h3v2CompatWrapper } from 'h3';"
    );
    
    content = content.replace(
      /createApp\(([^)]*)\)/,
      "createApp($1, { handlerWrapper: h3v2CompatWrapper })"
    );
    
    fs.writeFileSync(nitroInternalAppPath, content);
    console.log('Patched Nitro internal app to handle h3 v2 handlers');
  }
}
*/

if (fs.existsSync(nitropackCorePath)) {
  let content = fs.readFileSync(nitropackCorePath, 'utf8')

  content = content.replace(
    /import \{ createError, getRequestURL, getRequestHeader, getResponseHeader, getRequestHeaders, setResponseHeaders, setResponseStatus, send, eventHandler, getRequestIP, toNodeListener, createApp, fromNodeMiddleware \} from 'h3';/,
    "import { createError, getRequestURL, getRequestHeader, getResponseHeader, getRequestHeaders, setResponseHeaders, setResponseStatus, eventHandler, getRequestIP, toNodeListener, createApp, fromNodeMiddleware } from 'h3';"
  )

  fs.writeFileSync(nitropackCorePath, content)
  console.log('Fixed h3 import in nitropack core')
}

if (fs.existsSync(nitropackCachePath)) {
  let content = fs.readFileSync(nitropackCachePath, 'utf8')

  content = content.replace(
    /^.*import \{\s*defineEventHandler,\s*fetchWithEvent,\s*handleCacheHeaders,\s*isEvent,\s*splitCookiesString\s*\} from "h3";.*$/gm,
    'import { defineEventHandler, fetchWithEvent, handleCacheHeaders, isEvent } from "h3";\nimport { splitSetCookieString as splitCookiesString } from "cookie-es";'
  )

  content = content.replace(
    /^.*import \{\s*createEvent,\s*defineEventHandler,\s*fetchWithEvent,\s*handleCacheHeaders,\s*isEvent,\s*splitCookiesString\s*\} from "h3";.*$/gm,
    'import { defineEventHandler, fetchWithEvent, handleCacheHeaders, isEvent } from "h3";\nimport { splitSetCookieString as splitCookiesString } from "cookie-es";'
  )

  fs.writeFileSync(nitropackCachePath, content)
  console.log('Fixed h3 import in nitropack cache')
}

if (fs.existsSync(nitropackUtilsPath)) {
  let content = fs.readFileSync(nitropackUtilsPath, 'utf8')

  content = content.replace(
    /^.*import \{ splitCookiesString \} from "h3";.*$/gm,
    'import { splitSetCookieString as splitCookiesString } from "cookie-es";'
  )

  fs.writeFileSync(nitropackUtilsPath, content)
  console.log('Fixed h3 import in nitropack utils')
}

if (fs.existsSync(nuxtNitroServerPath)) {
  let content = fs.readFileSync(nuxtNitroServerPath, 'utf8')

  content = content.replace(
    /import \{ appendResponseHeader, getRequestHeaders, send, setResponseHeader, setResponseHeaders, setResponseStatus \} from "h3";/,
    'import { appendResponseHeader, getRequestHeaders, setResponseHeader, setResponseHeaders, setResponseStatus } from "h3";'
  )

  fs.writeFileSync(nuxtNitroServerPath, content)
  console.log('Fixed h3 import in @nuxt/nitro-server')
}

function fixH3ImportsInDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return

  const files = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)

    if (file.isDirectory()) {
      fixH3ImportsInDirectory(fullPath)
    } else if (file.name.endsWith('.mjs') || file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8')

      if (content.includes('send') && content.includes('from "h3"')) {
        const originalContent = content
        content = content.replace(
          /import \{([^}]*)send,([^}]*)\} from "h3";/g,
          (match, before, after) => {
            const cleanBefore = before.replace(/\s*,\s*$/, '').trim()
            const cleanAfter = after.replace(/^\s*,\s*/, '').trim()
            const imports = [cleanBefore, cleanAfter].filter(Boolean).join(', ')
            return `import { ${imports} } from "h3";`
          }
        )

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content)
          console.log(`Fixed h3 import in ${fullPath}`)
        }
      }

      if (content.includes('createEvent') && content.includes('from "h3"')) {
        const originalContent = content
        content = content.replace(
          /import \{([^}]*)createEvent,([^}]*)\} from "h3";/g,
          (match, before, after) => {
            const cleanBefore = before.replace(/\s*,\s*$/, '').trim()
            const cleanAfter = after.replace(/^\s*,\s*/, '').trim()
            const imports = [cleanBefore, cleanAfter].filter(Boolean).join(', ')
            return `import { ${imports} } from "h3";`
          }
        )

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content)
          console.log(`Fixed createEvent import in ${fullPath}`)
        }
      }

      if (content.includes('splitCookiesString')) {
        const hasImport = content.includes(
          'import { splitSetCookieString as splitCookiesString } from "cookie-es"'
        )
        const hasDefinition =
          /\bfunction splitCookiesString\b/.test(content) ||
          /\bconst splitCookiesString\b/.test(content)

        if (!hasImport && !hasDefinition) {
          // Remove from h3 if it exists there (as an import)
          content = content.replace(
            /import \{([^}]*)splitCookiesString,([^}]*)\} from "h3";/g,
            'import { $1 $2 } from "h3";'
          )
          content = content
            .replace(/,\s*,/g, ',')
            .replace(/\{\s*,/g, '{')
            .replace(/,\s*\}/g, '}')
            .replace(/import \{\s*\} from "h3";\n?/g, '')

          // Add to cookie-es
          content =
            `import { splitSetCookieString as splitCookiesString } from "cookie-es";\n` + content
        } else if (hasImport && hasDefinition) {
          // Remove redundant import
          content = content.replace(
            'import { splitSetCookieString as splitCookiesString } from "cookie-es";\n',
            ''
          )
          console.log(`Removed redundant splitCookiesString import from ${fullPath}`)
        }
      }

      if (
        content.includes('createEvent') &&
        !content.includes('import { createEvent } from "h3"')
      ) {
        const hasDefinition =
          /\bfunction createEvent\b/.test(content) || /\bconst createEvent\b/.test(content)
        const hasPolyfill = content.includes(
          'const createEvent = (req, res) => new H3Event(req, res);'
        )

        if (!hasDefinition && !hasPolyfill) {
          content = content.replace(/import \{([^}]*)\} from "h3";/g, (match, imports) => {
            if (!imports.includes('H3Event')) {
              return `import { ${imports.trim()}, H3Event } from "h3";`
            }
            return match
          })
          content = content + '\nconst createEvent = (req, res) => new H3Event(req, res);\n'
        } else if (hasDefinition && hasPolyfill) {
          // Remove redundant polyfill
          content = content.replace(
            '\nconst createEvent = (req, res) => new H3Event(req, res);\n',
            ''
          )
          console.log(`Removed redundant createEvent polyfill from ${fullPath}`)
        }
      }

      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content)
        console.log(`Updated ${fullPath}`)
      }
    }
  }
}

fixH3ImportsInDirectory(path.join(__dirname, '../node_modules/nitropack'))
fixH3ImportsInDirectory(path.join(__dirname, '../node_modules/@nuxt/nitro-server'))

if (isCI) {
  console.log('Skipping nuxt prepare in CI')
} else {
  console.log('Running nuxt prepare...')
  try {
    execSync('npx nuxt prepare', { stdio: 'inherit' })
    console.log('Nuxt prepare completed successfully')
  } catch (error) {
    console.error('Nuxt prepare failed:', error.message)
    process.exit(1)
  }
}
