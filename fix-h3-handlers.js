const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('server');
let patchedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const hasEventHandler = content.includes('eventHandler');
    const hasDefineEventHandler = content.includes('defineEventHandler');
    const hasFromNodeMiddleware = content.includes('fromNodeMiddleware');

    if (hasDefineEventHandler || hasFromNodeMiddleware) {
        // Assume already wrapped or handles it
        // Wait, what if it imports it but doesn't use it? We'll rely on Regex.
    }

    // Capture: export default async (event) => ...
    content = content.replace(/^export\s+default\s+(async\s+)?\(\s*(event\b[^)]*)\s*\)\s*=>\s*\{/gm, (match, asyncKw, eventArg) => {
        changed = true;
        return `export default defineEventHandler(${asyncKw || ''}(${eventArg}) => {`;
    });

    // Capture: export default async function (event) ...
    content = content.replace(/^export\s+default\s+(async\s+)?function\s*\(\s*(event\b[^)]*)\s*\)\s*\{/gm, (match, asyncKw, eventArg) => {
        changed = true;
        return `export default defineEventHandler(${asyncKw || ''}function(${eventArg}) {`;
    });

    // Note: the above regex doesn't match single-line implicit return or ending brackets, it only wraps the opening.
    // Let's do a full replacement using AST or just a simple regex for the whole block?
    // Regex for block is tricky. Better to do simple regex that matches the opening and appends a closing brace at the end of the file. No, that breaks if there are trailing things.
    // Instead of messing up syntax, let's just find the files and log them, and I'll use replace_file_content!
}

files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    // If it has "export default function(event" or "export default async function(event" or "export default (event" or "export default async (event"
    // BUT NOT explicitly wrapped in eventHandler/defineEventHandler
    if (/^export\s+default\s+(async\s+)?(function\s*)?\(\s*(?:event|req,)\b[^)]*\)/m.test(code)) {
        console.log("NEEDS_FIXING:", f);
    }
});
