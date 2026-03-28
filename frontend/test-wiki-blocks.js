import fs from 'fs';

function formatContent(text) {
  let html = text
  
  // Replace code blocks and escape
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg">$1</h3>')
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  
  // Wrap li in ul? The original didn't even do that. It just left <li> elements loose.
  
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    if (/^\s*<(h[1-6]|pre|table|ul|ol|li|hr)/i.test(block)) {
      return block;
    }
    return `<p class="mb-4 text-slate-700 dark:text-slate-300">\n${block}\n</p>`;
  }).join('\n\n');
  
  return html
}

const md = `### ¿Cómo funciona el control de stock?

- Cada producto tiene stock por ubicación
- Todo queda registrado en movimientos
- Algo mas aqui

### ¿Necesito internet para usar el sistema?`;
console.log(formatContent(md));
