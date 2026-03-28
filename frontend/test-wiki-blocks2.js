import fs from 'fs';

function formatContent(text) {
  let html = text
  
  // Basic escapes first
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  html = html.replace(/[&<>"']/g, m => map[m])
  
  html = html.replace(/^```(\w*)\n([\s\S]*?)```$/gm, (_, lang, code) => {
    return `<pre class="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>${code.trim()}</code></pre>`
  })
  
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">$1</h1>')
  
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-4 text-slate-800 dark:text-white">$1</h2>')
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-6 mb-3 text-slate-800 dark:text-white">$1</h3>')
  
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2 text-slate-800 dark:text-white">$1</h4>')
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
  
  html = html.replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700 dark:text-slate-300">$1</code>')
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline">$1</a>')
  
  html = html.replace(/^(\s*)- (.+)$/gm, (match, space, text) => {
    const margin = space.length > 0 ? 'ml-8' : 'ml-4';
    return `<li class="${margin} mb-2 text-slate-700 dark:text-slate-300 list-disc">${text}</li>`
  })
  
  html = html.replace(/^(\s*)(\d+)\. (.+)$/gm, (match, space, num, text) => {
    const margin = space.length > 0 ? 'ml-8' : 'ml-4';
    return `<li class="${margin} mb-2 text-slate-700 dark:text-slate-300 list-decimal">${text}</li>`
  })
  
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '')
    if (cells.length === 0) return ''
    
    const isHeader = cells.every(c => c.match(/^[-:]+$/))
    if (isHeader) return ''
    
    const isFirstRow = !match.includes('<tr>')
    let rowClass = isFirstRow ? 'bg-slate-50 dark:bg-slate-800/50' : ''
    let cellTag = isFirstRow ? 'th' : 'td'
    
    let cellsHtml = cells.map(c => {
      const isHeaderCell = isFirstRow
      const tag = isHeaderCell ? 'th' : 'td'
      return `<${tag} class="border border-slate-200 dark:border-slate-700 px-3 py-2 ${isHeaderCell ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}">${c.trim()}</${tag}>`
    }).join('')
    
    return `<tr class="${rowClass}">${cellsHtml}</tr>`
  })
  
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (match) => {
    return `<table class="w-full border-collapse my-4 text-sm">${match}</table>`
  })
  
  html = html.replace(/^---$/gm, '<hr class="my-8 border-slate-200 dark:border-slate-700" />')
  
  html = html.replace(/^(&#149;|•) (.+)$/gm, '<li class="ml-4 mb-1 text-slate-700 dark:text-slate-300 list-disc">$2</li>')
  
  // New Block handling instead of regex cleanup!
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    // If the block contains any html tags like headers, tables, pre, lists at the start or it's just tags, we skip <p> 
    // Actually, a block might be just <li>...</li> lines.
    const trimmed = block.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<table') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
       // if it contains ONLY lists, we shouldn't wrap with <p>. But it might be mixed.
       return block; // The formatting above already put the tags on them.
    }
    // But what if it's normal text with bold tags? Then wrap it.
    if (trimmed.length > 0) {
       return `<p class="mb-4 text-slate-700 dark:text-slate-300">${block}</p>`;
    }
    return block;
  }).join('\n');
  
  return html
}

const md = fs.readFileSync('/home/dail/developer/vuno-app-pointofsale/frontend/public/docs/wiki/USER.md', 'utf8');
const result = formatContent(md);
console.log('Result length:', result.length);
console.log('Original length:', md.length);
console.log(result.slice(-1000));
