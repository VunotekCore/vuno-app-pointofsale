<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { BookOpen, ChevronRight, Loader2, FileText, List, X } from 'lucide-vue-next'

const loading = ref(true)
const content = ref('')
const error = ref('')
const showMobileToc = ref(false)

const route = useRoute()
const docPath = computed(() => route.query.path || 'USER.md')

const tocItems = ref([])
const activeId = ref('')

let observer = null

const docsMap = import.meta.glob('../../public/docs/wiki/*.md', { query: '?raw', import: 'default' })

async function loadDoc() {
  loading.value = true
  error.value = ''
  try {
    const filePath = `../../public/docs/wiki/${docPath.value}`
    
    if (!docsMap[filePath]) {
      throw new Error('Documento no encontrado')
    }
    
    content.value = await docsMap[filePath]()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadDoc)
watch(docPath, () => {
  loadDoc()
  showMobileToc.value = false
})

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

function formatContent(text) {
  let html = escapeHtml(text)
  
  tocItems.value = []
  
  const headingRegex = /^(#{1,4})\s+(.+)$/gm
  let match
  while ((match = headingRegex.exec(text)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const id = slugify(title)
    tocItems.value.push({ level, title, id })
  }
  
  html = html.replace(/^```(\w*)\n([\s\S]*?)```$/gm, (_, lang, code) => {
    return `<pre class="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>${code.trim()}</code></pre>`
  })
  
  html = html.replace(/^# (.+)$/gm, (_, title) => {
    const id = slugify(title)
    return `<h1 id="${id}" class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">${title}</h1>`
  })
  
  html = html.replace(/^## (.+)$/gm, (_, title) => {
    const id = slugify(title)
    return `<h2 id="${id}" class="text-xl font-semibold mt-8 mb-4 text-slate-800 dark:text-white">${title}</h2>`
  })
  
  html = html.replace(/^### (.+)$/gm, (_, title) => {
    const id = slugify(title)
    return `<h3 id="${id}" class="text-lg font-medium mt-6 mb-3 text-slate-800 dark:text-white">${title}</h3>`
  })
  
  html = html.replace(/^#### (.+)$/gm, (_, title) => {
    const id = slugify(title)
    return `<h4 id="${id}" class="text-base font-semibold mt-4 mb-2 text-slate-800 dark:text-white">${title}</h4>`
  })
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
  
  html = html.replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700 dark:text-slate-300">$1</code>')
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
    if (href.startsWith('#')) {
      return `<a href="${href}" class="toc-link text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline">${text}</a>`
    }
    return `<a href="${href}" class="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline">${text}</a>`
  })
  
  html = html.replace(/^(\s*)- (.+)$/gm, (match, space, text) => {
    const margin = space.length > 0 ? 'ml-8' : 'ml-4';
    return `<li class="${margin} mb-2 text-slate-700 dark:text-slate-300 list-disc">${text}</li>`
  })
  
  html = html.replace(/^(\s*)(\d+)\. (.+)$/gm, (match, space, num, text) => {
    const margin = space.length > 0 ? 'ml-8' : 'ml-4';
    return `<li class="${margin} mb-2 text-slate-700 dark:text-slate-300"><span class="inline-block w-6 text-slate-400 dark:text-slate-500 select-none">${num}.</span>${text}</li>`
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
  
  const blocks = html.split(/\n\n+/)
  html = blocks.map(block => {
    const trimmed = block.trim()
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<table') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
      return trimmed
    }
    if (trimmed.length > 0) {
      return `<p class="mb-4 text-slate-700 dark:text-slate-300">\n${trimmed}\n</p>`
    }
    return trimmed
  }).join('\n\n')
  
  return html
}

function scrollToSection(id) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showMobileToc.value = false
  }
}

function setupObserver() {
  if (observer) {
    observer.disconnect()
  }
  
  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting)
      if (visibleEntries.length > 0) {
        const topEntry = visibleEntries.reduce((prev, curr) => {
          return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
        })
        activeId.value = topEntry.target.id
      }
    },
    {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    }
  )
  
  setTimeout(() => {
    const headings = document.querySelectorAll('#wiki-content h1, #wiki-content h2, #wiki-content h3, #wiki-content h4')
    headings.forEach(heading => observer.observe(heading))
    
    if (tocItems.value.length > 0 && !activeId.value) {
      activeId.value = tocItems.value[0].id
    }
  }, 100)
}

watch(content, () => {
  if (!loading.value) {
    setupObserver()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

function getTocItemClass(item) {
  const base = 'block py-1.5 text-sm transition-colors duration-150 hover:text-brand-600 dark:hover:text-brand-400'
  const active = activeId.value === item.id
  
  if (item.level === 1) {
    return `${base} font-semibold text-slate-900 dark:text-white ${active ? 'text-brand-600 dark:text-brand-400' : ''}`
  }
  if (item.level === 2) {
    return `${base} ml-3 text-slate-700 dark:text-slate-300 ${active ? 'text-brand-600 dark:text-brand-400 border-l-2 border-brand-500 pl-3' : ''}`
  }
  return `${base} ml-6 text-slate-500 dark:text-slate-400 text-xs ${active ? 'text-brand-600 dark:text-brand-400 border-l-2 border-brand-500 pl-3' : ''}`
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <BookOpen class="w-4 h-4" />
        <span>Docs</span>
        <ChevronRight class="w-4 h-4" />
        <span class="text-slate-900 dark:text-white">{{ docPath.replace('.md', '') }}</span>
      </div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Documentación</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <div v-else-if="error" class="text-center py-12">
      <FileText class="w-12 h-12 mx-auto mb-4 text-slate-400" />
      <p class="text-red-500">{{ error }}</p>
    </div>

    <div v-else class="relative">
      <div class="lg:flex lg:gap-8">
        <div class="flex-1 min-w-0">
          <div id="wiki-content" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-700 dark:text-slate-300">
            <div class="prose dark:prose-invert max-w-none prose-a:text-brand-600 dark:prose-a:text-brand-400" v-html="formatContent(content)"></div>
          </div>
        </div>

        <aside class="hidden lg:block w-72 flex-shrink-0">
          <div class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <List class="w-4 h-4" />
                En esta página
              </h3>
              <nav class="space-y-0.5">
                <button
                  v-for="item in tocItems"
                  :key="item.id"
                  :class="getTocItemClass(item)"
                  @click="scrollToSection(item.id)"
                >
                  {{ item.title }}
                </button>
              </nav>
            </div>
          </div>
        </aside>
      </div>

      <button
        class="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        @click="showMobileToc = !showMobileToc"
        aria-label="Mostrar índice"
      >
        <X v-if="showMobileToc" class="w-5 h-5" />
        <List v-else class="w-5 h-5" />
      </button>

      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showMobileToc"
          class="lg:hidden fixed inset-0 z-40 bg-black/50"
          @click="showMobileToc = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-y-full"
        enter-to-class="translate-y-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-full"
      >
        <div
          v-if="showMobileToc"
          class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-700 max-h-[60vh] overflow-y-auto"
        >
          <div class="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <List class="w-4 h-4" />
              En esta página
            </h3>
            <button
              @click="showMobileToc = false"
              class="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <nav class="p-4 space-y-1">
            <button
              v-for="item in tocItems"
              :key="item.id"
              :class="getTocItemClass(item)"
              @click="scrollToSection(item.id)"
            >
              {{ item.title }}
            </button>
          </nav>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
.prose h1:first-child {
  margin-top: 0;
}
.prose table {
  border-collapse: collapse;
  width: 100%;
}
.prose th, .prose td {
  text-align: left;
}
.prose pre {
  margin: 1rem 0;
}
.prose code {
  background: #f1f5f9;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}
.dark .prose code {
  background: #1e293b;
}
.prose pre code {
  background: transparent;
  padding: 0;
}
</style>
