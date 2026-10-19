// Privacy-safe conversation fixtures using the installed hosts' actual renderer
// styles. No provider calls, account state, or live conversation mutations.
import fs from 'node:fs';
import path from 'node:path';
import { expandHostSelectors } from './host-selectors.mjs';
import { indexHostModules } from './host-contract.mjs';

const skin = expandHostSelectors(fs.readFileSync(new URL('../src/skin.css', import.meta.url), 'utf8'));
const icon = (content = '<path d="M4 6l4 4 4-4"/>') => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">${content}</svg>`;

export function conversationFixture(host, table, dark = false) {
  const modules = indexHostModules(host.sources);
  const member = (prefix) => { const id = table.modules[prefix]; return modules.get(`${id.package}/${id.module}`); };
  const familyFor = (signature) => {
    const match = [...host.frontendCss.matchAll(/\._\w+_(\w+)_\d+\{([^}]+)\}/g)].find((m) => m[2].includes(signature));
    if (!match) throw new Error(`Missing primitive: ${signature}`);
    return match[1];
  };
  const primitive = (family, name) => {
    const cls = host.frontendCss.match(new RegExp(`\\._${name}_${family}_\\d+`))?.[0].slice(1);
    if (!cls) throw new Error(`Missing ${family}.${name}`);
    return cls;
  };
  const codeFamily = familyFor('--dsl-code-block-banner-background-color:');
  const terminalFamily = familyFor('--dsl-terminal-radius:');
  const bannerFamily = familyFor('padding:10px 18px 8px 22px');
  const disclosureFamily = host.frontendCss.match(/\._chevronHover_(\w+)_\d+/)[1];
  const c = (name) => primitive(codeFamily, name), t = (name) => primitive(terminalFamily, name);
  const b = (name) => primitive(bannerFamily, name), d = (name) => primitive(disclosureFamily, name);
  const markdownFamily = familyFor('overflow-wrap:anywhere;font:var(--dsw-font-markdown-base)');
  const markdown = primitive(markdownFamily, 'markdown');
  const fileMention = primitive(markdown.match(/_markdown_(\w+)_/)[1], 'fileMention');
  const assistant = member('hWmORq'), reasoning = member('lcKema'), tool = member('o3BgMG'), bash = member('CY-8Ka');
  const row = (id, css, label, summary, state = 'ok', expanded = false) => `<section class="${css.root}" data-tool="read_file" data-variant="read" data-state="${state}"><div id="${id}" class="${d('row')} ${css.row}" data-disclosure-row role="button" tabindex="0" aria-expanded="${expanded}"><span class="${d('leading')} ${css.leading}">${expanded ? icon() : `<span class="${d('iconIdle')}">${icon()}</span>${icon().replace('<svg ', `<svg class="${d('chevronHover')}" `)}`}</span><span class="${css.title}">${label}</span><span class="${css.sep || css.separator}"></span><span class="${css.summary}">${summary}</span></div></section>`;
  const code = `const theme = {\n  surface: 'ivory',\n  typography: 'quiet & readable',\n};\n\nexport const describe = () => theme;`;
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Ivory · 对话排版预览</title><style>${host.css}\n${skin}\n
  html,body{margin:0;min-height:100%;background:var(--cl-page)}
  body{--dsh-content-font-size:14px;--dsh-content-font-size-secondary:13px;--dsh-content-font-delta:0px;--dsh-content-font-delta-secondary:0px}
  .demo{box-sizing:border-box;max-width:728px;margin:auto;padding:32px 24px 56px;color:var(--cl-ink);font-family:var(--cl-sans)}
  .demo-header{font:12px/20px var(--cl-sans);color:var(--cl-muted);border-bottom:.5px solid var(--cl-border);padding-bottom:16px;margin-bottom:28px;display:flex;justify-content:space-between}
  .demo-user{margin:0 0 32px auto;padding:12px 16px;max-width:380px;border-radius:16px;background:var(--cl-user-bubble);font:14px/22px var(--cl-sans)}
  .demo-activity{margin:20px 0 24px;min-width:0}.demo-mark{color:var(--cl-muted);font:11px/18px var(--cl-sans);margin-bottom:8px}
  .demo-extra{margin-top:32px}.demo-extra table{border-collapse:collapse;font:13px/22px var(--cl-sans)}.demo-extra td,.demo-extra th{padding:8px;border-bottom:.5px solid var(--cl-border);text-align:left}
  </style><body class="dsh-ivory" ${dark ? 'data-ds-dark-theme' : ''}><main class="demo"><header class="demo-header"><span>Ivory / 对话阅读</span><span>本地样式预览 · 示例内容</span></header>
  <div class="demo-user">把界面打磨得更安静一些，让内容更好读。</div>
  <article class="${assistant.root}"><div class="${assistant.body}"><div class="${markdown}" id="prose">
  <h2 id="heading">让注意力，回到内容本身</h2>
  <p id="paragraph">好的对话界面，应该让阅读自然发生。用清楚的标题、舒展的行距和克制的色彩，给每一段想法留下空间。中文与 English 混排时，也保持连贯的节奏。</p>
  <ul><li><strong>正文有层次。</strong>标题帮助定位，段落让阅读停顿。</li><li><strong>细节有秩序。</strong>用 <code id="inline">font-size</code> 保持文字比例，<a id="link" href="#details">了解实现细节</a>，查看 <button id="filelink" class="${fileMention}">skin.css</button>。</li></ul>
  <div id="code" class="${c('block')} md-code-block ${c('card')}" data-code-wrap="false"><div class="${c('bannerWrap')}"><div class="${b('header')}" data-code-block-banner><div class="${b('heading')}"><span class="${b('language')}">typescript</span></div><div class="${b('actions')}"><button id="wrap" class="${b('action')}" aria-label="自动换行" aria-pressed="false">${icon('<path d="M2 4h12M2 8h9a2 2 0 0 1 0 4H8m2-2-2 2 2 2M2 12h3"/>')}</button><button class="${b('action')}" aria-label="复制代码">${icon('<rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10H2V2h8v1"/>')}</button></div></div></div><div class="${c('content')}" data-code-block-content><pre class="${c('plain')}"><code>${code}</code></pre></div></div>
  <div class="demo-activity">
  ${row('thinking', reasoning, '已思考', '梳理正文、代码与工具调用的阅读层次')}
  ${row('read', tool, '读取文件', 'src/skin.css · 已完成')}
  <section class="${bash.card}"><div id="bash" class="${bash.root}" data-sample="bash" data-state="ok" data-expandable role="button" tabindex="0" aria-expanded="true"><span class="${bash.leading}">${icon().replace('<svg ', `<svg class="${bash.chevron}" `)}</span><span class="${bash.title}">运行命令</span><span class="${bash.sep}"></span><span class="${bash.summary}">检查样式与构建</span></div><div class="${bash.bodyWrap}"><div id="terminal" class="${t('block')} ${bash.terminal}" data-terminal><div class="${t('header')}"><div class="${t('prompt')}"><div class="${t('promptLine')}"><span class="${t('command')}">npm run build</span></div></div><button class="${t('copyButton')}" aria-label="复制命令">复制</button></div><div class="${t('output')}"><div class="${t('line')}">Build completed.</div><div class="${t('line')}">Ready for review.</div></div></div></div></section>
  </div>
  <blockquote><p>让界面退后一步，让想法更清晰。</p></blockquote>
  </div></div></article>
  <section class="demo-extra" id="details"><div class="dshcs-md" id="document"><h2>文档预览</h2><p>预览与正文共享排版，<code>long_inline_identifier_without_spaces</code> 也能自然换行。</p><ol><li><p>第一步</p><ol><li><p>保留嵌套顺序</p></li></ol></li></ol><pre><code>preview code</code></pre></div>
  ${row('error', tool, '读取文件', '文件不存在 · 请检查路径', 'error')}
  <div class="${tool.bodyWrap}"><div class="${tool.ioCard}" id="io"><div class="${tool.ioSection}"><span class="${tool.ioLabel}">输入</span><span class="${tool.ioText}">src/styles/conversation.css</span></div><div class="${tool.ioDivider}"></div><div class="${tool.ioSection}"><span class="${tool.ioLabel}">结果</span><span class="${tool.ioText}" data-error>文件不存在</span></div></div><button class="${tool.inspectButton}" id="inspect">查看详情</button></div>
  </section></main><script>
  document.getElementById('wrap').addEventListener('click',function(){const value=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',value);document.getElementById('code').dataset.codeWrap=value;});
  </script></body></html>`;
}

export async function testConversation(browser, hosts, table, check, shotsDir) {
  for (const [side, host] of Object.entries(hosts)) {
    for (const dark of [false, true]) {
      const label = `${side} ${dark ? 'dark' : 'light'} conversation`;
      const page = await browser.newPage({viewport:{width:1080,height:900}});
      const html = conversationFixture(host, table, dark);
      await page.setContent(html);
      check(`${label}: readable heading and body hierarchy`, await page.evaluate(() => {
        const h=getComputedStyle(document.getElementById('heading')),p=getComputedStyle(document.getElementById('paragraph'));
        return h.fontSize==='22px' && h.lineHeight==='30px' && p.fontSize==='14px' && p.lineHeight==='26px' && h.marginTop==='0px';
      }));
      check(`${label}: inline code keeps the prose baseline`, await page.locator('#inline').evaluate(el=>getComputedStyle(el).display==='inline' && getComputedStyle(el).lineHeight==='26px'));
      check(`${label}: body and document use one type scale`, await page.evaluate(()=>getComputedStyle(document.querySelector('#document h2')).font===getComputedStyle(document.getElementById('heading')).font));
      check(`${label}: native banner is not clipped by a scroll ancestor`, await page.locator('#code').evaluate(el=>!['hidden','auto','scroll'].includes(getComputedStyle(el).overflow)));
      check(`${label}: code and toolbar share an inset`, await page.evaluate(()=>getComputedStyle(document.querySelector('[data-code-block-banner]')).paddingLeft===getComputedStyle(document.querySelector('#code pre')).paddingLeft));
      check(`${label}: readable code without losing line breaks`, await page.locator('#code pre').evaluate(el=>getComputedStyle(el).fontSize==='13px' && getComputedStyle(el).lineHeight==='22px' && getComputedStyle(el).whiteSpace==='pre'));
      check(`${label}: controls have adequate hit areas`, await page.locator('[data-code-block-banner] button,#terminal button,#inspect').evaluateAll(nodes=>nodes.every(el=>el.getBoundingClientRect().height>=24)));
      check(`${label}: all tool rows share one baseline`, await page.locator('#thinking,#read,#bash').evaluateAll(nodes=>nodes.every(el=>el.getBoundingClientRect().height===28 && getComputedStyle(el).fontSize==='13px')));
      check(`${label}: expanded Bash stays in the tool icon column`, await page.locator('#bash').evaluate(el=>getComputedStyle(el.firstElementChild).width==='16px' && getComputedStyle(el.firstElementChild,'::after').content==='none'));
      check(`${label}: terminal uses readable secondary type`, await page.locator('#terminal [class*="_output_"]').evaluate(el=>getComputedStyle(el).fontSize==='13px' && getComputedStyle(el).lineHeight==='22px'));
      check(`${label}: errors retain a distinct color`, await page.evaluate(()=>getComputedStyle(document.querySelector('#error [class*="_title"]')).color!==getComputedStyle(document.querySelector('#read [class*="_title"]')).color && getComputedStyle(document.querySelector('#io [data-error]')).color===getComputedStyle(document.querySelector('#error [class*="_title"]')).color));
      check(`${label}: links use the theme accent`, await page.locator('#link,#filelink').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).color===(document.body.hasAttribute('data-ds-dark-theme')?'rgb(255, 158, 94)':'rgb(138, 74, 21)'))));
      if(shotsDir){fs.writeFileSync(path.join(shotsDir,`${side}-conversation-${dark?'dark':'light'}.html`),html);await page.screenshot({path:path.join(shotsDir,`${side}-conversation-${dark?'dark':'light'}.png`)});}
      await page.setViewportSize({width:375,height:800});
      await page.locator('#code pre code').evaluate(el=>el.textContent='const path = "'+ 'long-path/'.repeat(30)+'";');
      check(`${label}: long code scrolls within a narrow pane`, await page.locator('#code pre').evaluate(el=>el.scrollWidth>el.clientWidth && document.documentElement.scrollWidth<=innerWidth));
      await page.locator('#wrap').click();
      check(`${label}: native wrap toggle still works`, await page.locator('#code pre').evaluate(el=>getComputedStyle(el).whiteSpace==='pre-wrap' && el.scrollWidth<=el.clientWidth));
      check(`${label}: nested lists keep outside numbering`, await page.locator('#document ol ol').evaluate(el=>getComputedStyle(el).listStylePosition==='outside' && getComputedStyle(el).paddingLeft==='24px'));
      await page.locator('#wrap').focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      check(`${label}: keyboard focus stays visible`, await page.locator('#wrap').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
      await page.evaluate(()=>{let s=document.body.style;s.setProperty('--dsh-content-font-size','18px');s.setProperty('--dsh-content-font-size-secondary','17px');s.setProperty('--dsh-content-font-delta','4px');s.setProperty('--dsh-content-font-delta-secondary','4px');});
      check(`${label}: font preferences scale prose, code and tools`, await page.evaluate(()=>[['#paragraph','18px'],['#code pre','17px'],['#read','17px']].every(([s,size])=>getComputedStyle(document.querySelector(s)).fontSize===size) && document.documentElement.scrollWidth<=innerWidth));
      await page.emulateMedia({reducedMotion:'reduce'});
      check(`${label}: reduced motion silences row transitions`, await page.locator('#read,#bash').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).transitionDuration.split(',').every(d=>parseFloat(d)<0.001))));
      await page.emulateMedia({forcedColors:'active'});
      check(`${label}: forced-colors keeps keyboard focus`, await page.locator('#wrap').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
      if(shotsDir){await page.emulateMedia({forcedColors:'none'});await page.screenshot({path:path.join(shotsDir,`${side}-conversation-${dark?'dark':'light'}-narrow.png`),fullPage:true});}
      await page.close();
    }
  }
}
