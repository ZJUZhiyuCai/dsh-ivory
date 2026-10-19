// Isolated document/attachment fixtures with each installed host's complete CSS.
// No files are uploaded, no live conversation is modified, and no provider runs.
import fs from 'node:fs';
import path from 'node:path';
import {indexHostModules} from './host-contract.mjs';
import {expandHostSelectors} from './host-selectors.mjs';

const skin=expandHostSelectors(fs.readFileSync(new URL('../src/skin.css',import.meta.url),'utf8'));
const icon='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M4 2h5l3 3v9H4zM8 2v4h4M6 9h4M6 11h3"/></svg>';
const sampleImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520"><rect width="800" height="520" fill="#eaeae6"/><rect x="80" y="70" width="640" height="380" rx="16" fill="#fff"/><path d="M140 160h360M140 210h520M140 260h440M140 310h480" stroke="#696862" stroke-width="12"/></svg>');

function fixture(host,dark){
  const modules=indexHostModules(host.sources);
  const mod=(pkg,file)=>modules.get(`@deepseek-ai/dsh-client-ui-${pkg}/${file}.module.css`);
  const v=mod('sidebar-documentpreview','TextPreview'), md=mod('sidebar-documentpreview','MarkdownBody'), code=mod('sidebar-documentpreview','CodeBody');
  const img=mod('sidebar-documentpreview','ImageBody'), zoom=mod('sidebar-documentpreview','ZoomControls'), viewport=mod('sidebar-documentpreview','ZoomViewport');
  const rail=mod('attachment','AttachmentRail'), file=mod('attachment','FileCard'), composer=mod('attachment','ComposerAttachments'), message=mod('attachment','MessageImage');
  const deliver=mod('deliverables','Deliverables'), side=mod('sidebar-right','SidebarRight'), input=mod('conversation','InputBar');
  const familyFor=signature=>[...host.frontendCss.matchAll(/\._\w+_(\w+)_\d+\{([^}]+)\}/g)].find(m=>m[2].includes(signature))[1];
  const primitive=(family,name)=>host.frontendCss.match(new RegExp(`\\._${name}_${family}_\\d+`))[0].slice(1);
  const dockFamily=host.frontendCss.match(/\._tabStrip_(\w+)_\d+/)[1];
  const d=name=>primitive(dockFamily,name), c=name=>primitive(familyFor('--dsl-code-block-banner-background-color:'),name);
  const b=name=>primitive(familyFor('padding:10px 18px 8px 22px'),name);
  const markdown=primitive(familyFor('overflow-wrap:anywhere;font:var(--dsw-font-markdown-base)'),'markdown');
  const card=(id,state='ready')=>`<div class="${rail.item}"><div id="${id}" class="${file.card} ${state==='error'?file.failed:''}"><span class="${file.icon}">${icon}</span><${state==='error'?'button':'span'} class="${file.body} ${state==='error'?file.retry:''}" ${state==='error'?'aria-label="重试上传"':''}><span class="${file.name}">设计说明与交互细节_非常长的文件名称_v12.pdf</span><span class="${file.meta} ${state==='error'?file.metaFailed:''}">${state==='ready'?'PDF · 248 KB':state==='error'?'上传失败，点击重试':'正在上传 · 42%'}</span></${state==='error'?'button':'span'}><button class="${file.remove} ${state==='error'?file.removeFailed:''}" aria-label="移除${id}">×</button>${state==='uploading'?`<span class="${file.progressTrack}"><span class="${file.progressBar}" style="width:42%"></span></span>`:''}</div></div>`;
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Ivory · 文件与附件 · 本地测试示例</title><style>${host.css}\n${skin}\n
  /* Observed file-library plugin layout contract; the native dock CSS comes from the host. */
  .dsh-files-entry{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px}.dsh-files-dock{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;padding:8px 12px;border:.5px solid;border-radius:12px;overflow:hidden}.dsh-files-dock-tools{display:flex;gap:6px}.dsh-files-dock-search{flex:1;min-width:0}.dsh-files-dock-refresh{flex:none}.dsh-files-dock-list{display:flex;flex-direction:column;max-height:220px;overflow-y:auto}
  html,body{margin:0;height:100%;font-family:var(--cl-sans);background:var(--cl-page);color:var(--cl-ink)}[hidden]{display:none!important}
  .sample{box-sizing:border-box;max-width:560px;padding:32px 24px}.sample h1{font:600 22px/30px var(--cl-sans)}.sample p{font:14px/24px var(--cl-serif)}.label{margin:28px 0 10px;font:12px/18px var(--cl-sans);color:var(--cl-muted)}
  #dock{position:absolute;width:400px;top:0;right:0;bottom:0;--dsh-sidebar-width:400px}#dock [data-dockkit-surface]{height:100%}#dock [data-dockkit-host]{pointer-events:auto}#dock [data-dockkit-strip-tabs]{display:flex;flex:1;min-width:0}
  #dock [data-dockkit-strip-fill]{flex:1}.path-sample{display:block;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  @media(max-width:800px){.sample{display:none}#dock{width:100%;--dsh-sidebar-width:100vw}}
  </style><body class="dsh-ivory" ${dark?'data-ds-dark-theme':''}>
  <main class="sample"><div id="library-check" class="${input.dock}" style="width:280px"><div class="dsh-files-entry"><button aria-expanded="true">附件库</button><div class="dsh-files-dock"><div class="dsh-files-dock-tools"><input class="dsh-files-dock-search" type="search" placeholder="按文件名搜索…"><button class="dsh-files-dock-refresh" aria-label="刷新附件">↻</button></div><div class="dsh-files-dock-list"><div class="dsh-files-dock-empty">暂无附件</div></div></div></div><span id="sibling-stat" style="display:block;width:120px">会话状态 · 128K</span><span style="display:block;width:100px">附件 · 248 KB</span></div><h1>文件，就在手边</h1><p>正文、附件与阅读面板沿用同一套层次。以下均为本地验证示例。</p><div class="label">对话中的文件</div>
  <div class="${deliver.root}" id="delivered"><div class="${deliver.presented}">${['设计说明.md','交互原型.html'].map((name,i)=>`<div class="${deliver.file}"><button class="${deliver.cardPreview}" aria-label="预览${name}"></button><span class="${deliver.fileIcon}">${icon}</span><div class="${deliver.fileBody}"><div class="${deliver.details}"><span class="${deliver.fileName}">${name}</span><span class="${deliver.description}">文件预览与附件的视觉规范</span></div><div class="${deliver.actions}"><button aria-label="打开${name}" style="height:26px">↗</button></div></div></div>`).join('')}</div></div>
  <div class="label">待发送附件 · 本地示例</div><div class="${rail.root}" id="attachments"><div class="${rail.rail}" id="rail">${card('ready')}${card('upload','uploading')}${card('failed','error')}<div class="${composer.imageItem}"><button class="${composer.thumbnail}" aria-label="预览图片"><img src="${sampleImage}" alt="示例文档"></button><button class="${composer.remove}" aria-label="移除图片">×</button></div></div></div>
  <div class="label">已发送图片</div><div class="${message.gallery}"><button class="${message.frame}" data-variant="tile"><img src="${sampleImage}" alt="文件预览示例"></button><button class="${message.error}" data-variant="tile">重新加载</button></div></main>
  <aside id="dock" class="${side.panel}" data-sidebar-right-panel="push" data-sidebar-right-open="true"><div class="${side.panelBody}"><div class="${d('surface')}" data-dockkit-surface><section class="${d('tabHost')} ${d('pane')}" data-dockkit-host="dock" data-dockkit-pane-active="true" data-dockkit-column="0">
  <div class="${d('tabHostHeader')}"><div class="${d('tabStrip')}" role="tablist" data-dockkit-strip="fixture"><div class="${d('stripTabs')}" data-dockkit-strip-tabs><div id="tab" class="${d('tab')} ${d('tabActive')}" role="tab" tabindex="0" aria-selected="true" data-dockkit-tab="preview"><span class="${d('tabTitle')}">设计说明.md</span><button class="${d('tabClose')}" aria-label="关闭文件">×</button></div></div><button class="${d('iconButton')}" aria-label="新标签页">+</button><button class="${d('iconButton')}" data-dockkit-split-button disabled aria-label="分栏">⊞</button><div data-dockkit-strip-chrome><button class="${side.iconButton}" aria-label="全屏">↗</button></div></div></div>
  <div class="${d('tabHostBody')} ${d('paneBody')}"><div class="${side.tabBody}"><div class="${v.preview}" id="viewer"><header class="${v.header}" id="toolbar"><span class="${v.path} path-sample">项目/设计规范/很长的文档名称_设计说明.md</span><button class="${v.tool} ${v.viewerTool}">Markdown⌄</button><button class="${v.tool}" aria-label="刷新预览">↻</button><button class="${v.tool}" aria-label="自动刷新" aria-pressed="true">↺</button></header>
  <div class="${v.body}" id="body"><div class="${md.document}" id="markdown"><div class="${markdown}"><h1>让阅读更从容</h1><p>文件预览是对话的延伸。清楚的标题、舒展的留白，让长文档也容易定位。</p><h2 id="preview-heading">细节保持一致</h2><ul><li>文件名与说明有清楚层次</li><li>键盘操作、缩放与滚动保持可用</li></ul><table><thead><tr><th>文件</th><th>说明</th></tr></thead><tbody><tr><td>${'long_filename_'.repeat(14)}</td><td>保留横向阅读</td></tr></tbody></table>${'<p>以中性的表面承载内容，用轻盈的边线组织操作。</p>'.repeat(12)}</div></div>
  <div hidden id="code-reader" class="${code.renderer}" data-wrap="false"><div id="file-code" class="${c('block')} ${c('card')} md-code-block ${code.code}" data-code-wrap="false"><div class="${c('bannerWrap')}"><div class="${b('header')}" data-code-block-banner><span class="${b('language')}">typescript</span><div class="${b('actions')}"><button class="${b('action')}" aria-label="代码换行">↵</button></div></div></div><div class="${c('content')}" data-code-block-content><pre class="${c('plain')}"><code>${Array.from({length:42},(_,i)=>`const path${i} = "${'long_path/'.repeat(20)}";`).join('\n')}</code></pre></div></div></div>
  <div hidden id="image-reader" class="${viewport.frame}" data-document-zoom-mode="fixed" style="--document-zoom-width:800px;--document-zoom:1.5"><div class="${viewport.scrollport}"><div class="${img.frame}"><div class="${viewport.surface} ${img.surface}"><img class="${img.image}" src="${sampleImage}" alt="放大文档"></div></div></div><div id="zoom" class="${zoom.panel} ${zoom.visible}"><button class="${v.tool} ${zoom.zoomButton}" aria-label="缩小">−</button><button class="${v.tool} ${zoom.percent}" aria-label="缩放比例">150%</button><button class="${v.tool} ${zoom.zoomButton}" aria-label="放大">+</button></div></div>
  <div hidden id="empty" class="${v.empty}"><span class="${v.emptyIcon}">${icon}</span><span class="${v.emptyLine}">无法预览此文件</span><button class="${v.retry}">重试</button></div>
  </div></div></div></div></section></div></div></aside></body></html>`.replace(/>\s+</g,'><');
}

export async function testFiles(browser,hosts,check,shotsDir){
  for(const[side,host]of Object.entries(hosts))for(const dark of[false,true]){
    const label=`${side} ${dark?'dark':'light'} files`;
    const page=await browser.newPage({viewport:{width:1080,height:820}});
    const html=fixture(host,dark);await page.setContent(html);
    const test=(name,result)=>check(`${label}: ${name}`,result);
    test('expanded library owns a complete dock row',await page.locator('#library-check').evaluate(e=>{const library=e.querySelector('.dsh-files-entry').getBoundingClientRect(),stat=e.querySelector('#sibling-stat').getBoundingClientRect();return library.width===e.clientWidth&&stat.top>=library.bottom;}));
    test('library search and status fit a 280px dock',await page.locator('#library-check').evaluate(e=>e.scrollWidth<=e.clientWidth&&e.querySelector('#sibling-stat').getBoundingClientRect().width===120&&e.querySelector('input').getBoundingClientRect().width>140));
    await page.locator('.dsh-files-dock').evaluate(e=>e.remove());
    test('collapsed library lets sibling controls wrap naturally',await page.locator('#library-check').evaluate(e=>e.scrollWidth<=e.clientWidth&&e.querySelector('.dsh-files-entry').getBoundingClientRect().width<140));
    await page.locator('#library-check').evaluate(e=>e.remove());
    test('document scrolls without moving the toolbar',await page.locator('#body').evaluate(e=>{const bar=document.getElementById('toolbar'),y=bar.getBoundingClientRect().top;e.scrollTop=160;return e.scrollTop===160&&bar.getBoundingClientRect().top===y&&getComputedStyle(e).overflowY==='auto';}));
    test('document headings use the conversation scale',await page.locator('#preview-heading').evaluate(e=>getComputedStyle(e).fontSize==='22px'&&getComputedStyle(e).lineHeight==='30px'));
    test('long table remains within the document pane',await page.locator('#markdown').evaluate(e=>e.scrollWidth<=e.clientWidth&&document.documentElement.scrollWidth<=innerWidth));
    test('selected tab remains distinct',await page.locator('#tab').evaluate(e=>getComputedStyle(e).backgroundColor!==getComputedStyle(e.closest('[data-dockkit-strip]')).backgroundColor));
    test('all header actions retain usable hit areas',await page.locator('#toolbar button,[data-dockkit-strip] button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().width>=24&&e.getBoundingClientRect().height>=24)));
    test('blocked split remains disabled',await page.getByRole('button',{name:'分栏',exact:true}).isDisabled());
    test('attachment rail overflows inside its bounds',await page.locator('#rail').evaluate(e=>e.scrollWidth>e.clientWidth&&getComputedStyle(e).overflowX==='auto'));
    const name=page.locator('#ready [class$="_name"]');const before=await name.boundingBox();await page.locator('#ready').hover();
    test('filename does not jump on hover',JSON.stringify(before)===JSON.stringify(await name.boundingBox()));
    test('remove button never covers a long filename',await page.locator('#ready').evaluate(e=>{const text=e.querySelector('[class$="_name"]').getBoundingClientRect(),button=e.querySelector('button').getBoundingClientRect();return text.right<button.left&&button.width>=24&&button.height>=24;}));
    test('upload progress remains proportional',await page.locator('#upload [class$="_progressBar"]').evaluate(e=>Math.abs(e.getBoundingClientRect().width/e.parentElement.getBoundingClientRect().width-.42)<.01));
    await page.getByRole('button',{name:'重试上传',exact:true}).focus();
    test('keyboard reaches the offscreen retry action',await page.locator('#rail').evaluate(e=>e.scrollLeft>0&&getComputedStyle(document.activeElement).outlineStyle==='solid'));
    test('failure metadata retains a distinct tone',await page.evaluate(()=>getComputedStyle(document.querySelector('#failed [class$="_metaFailed"]')).color!==getComputedStyle(document.querySelector('#ready [class*="_meta"]')).color));
    test('delivered-file actions stay above the preview hit area',await page.getByRole('button',{name:'打开设计说明.md',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;}));
    await page.getByRole('button',{name:'预览设计说明.md',exact:true}).focus();
    test('file-card focus stays within its clipped boundary',await page.locator('#delivered [class$="_cardPreview"]').first().evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&parseFloat(getComputedStyle(e).outlineOffset)<0));
    await page.locator('#rail').evaluate(e=>e.scrollLeft=0);await page.locator('#body').evaluate(e=>e.scrollTop=0);
    if(shotsDir){fs.writeFileSync(path.join(shotsDir,`${side}-files-${dark?'dark':'light'}.html`),html);await page.screenshot({path:path.join(shotsDir,`${side}-files-${dark?'dark':'light'}.png`)});}
    await page.setViewportSize({width:320,height:640});
    test('narrow document and toolbar fit the pane',await page.locator('#toolbar').evaluate(e=>e.scrollWidth<=e.clientWidth&&document.documentElement.scrollWidth<=innerWidth));
    await page.getByRole('button',{name:'关闭文件',exact:true}).focus();
    test('tab close has an unclipped keyboard focus ring',await page.getByRole('button',{name:'关闭文件',exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&getComputedStyle(e).outlineOffset==='-2px'));
    await page.evaluate(()=>{document.getElementById('markdown').hidden=true;document.getElementById('code-reader').hidden=false;document.getElementById('code-reader').setAttribute('data-code-preview','');});
    test('full-file code has one continuous surface',await page.locator('#file-code').evaluate(e=>getComputedStyle(e).borderTopWidth==='0px'&&getComputedStyle(e).borderRadius==='0px'));
    test('code scrolls on both axes inside its reader',await page.locator('[data-code-block-content]').evaluate(e=>e.scrollWidth>e.clientWidth&&e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflow==='auto'&&document.documentElement.scrollWidth<=innerWidth));
    await page.locator('[data-code-block-content]').evaluate(e=>{e.scrollLeft=160;e.scrollTop=100;});
    test('horizontal scroll preserves the code toolbar',await page.locator('[data-code-block-banner]').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0;}));
    await page.evaluate(()=>{document.getElementById('code-reader').dataset.wrap='true';document.getElementById('file-code').dataset.codeWrap='true';});
    test('native wrapping still removes horizontal overflow',await page.locator('[data-code-block-content]').evaluate(e=>e.scrollWidth<=e.clientWidth&&getComputedStyle(e.querySelector('pre')).whiteSpace==='pre-wrap'));
    await page.evaluate(()=>{document.body.style.setProperty('--dsh-content-font-size-secondary','17px');document.body.style.setProperty('--dsh-content-font-delta-secondary','4px');});
    test('file code respects the host font preference',await page.locator('#file-code pre').evaluate(e=>getComputedStyle(e).fontSize==='17px'));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-code-${dark?'dark':'light'}-narrow.png`)});
    await page.evaluate(()=>{document.getElementById('code-reader').hidden=true;document.getElementById('code-reader').removeAttribute('data-code-preview');document.getElementById('image-reader').hidden=false;});
    test('image zoom retains the original aspect ratio',await page.locator('#image-reader img').evaluate(e=>Math.abs(e.width/e.height-800/520)<.01&&e.width===1200));
    test('zoom controls stay inside the narrow viewport',await page.locator('#zoom button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=24&&r.height>=24&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})));
    await page.getByRole('button',{name:'缩放比例',exact:true}).focus();
    test('zoom controls retain keyboard focus visibility',await page.getByRole('button',{name:'缩放比例',exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle==='solid'));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-image-${dark?'dark':'light'}-narrow.png`)});
    await page.evaluate(()=>{document.getElementById('image-reader').hidden=true;document.getElementById('empty').hidden=false;});
    test('unavailable-file retry stays usable',await page.getByRole('button',{name:'重试',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=24&&r.height>=24&&r.bottom<innerHeight;}));
    await page.setViewportSize({width:1080,height:820});
    await page.emulateMedia({reducedMotion:'reduce'});
    test('reduced motion removes decorative attachment transitions',await page.locator('#ready button,#delivered [data-presented-file],#delivered [class$="_file"]').evaluateAll(es=>es.length>0&&es.every(e=>getComputedStyle(e).transitionDuration.split(',').every(v=>parseFloat(v)<.001))));
    await page.emulateMedia({forcedColors:'active'});
    test('forced colors keep file boundaries and selected tabs',await page.locator('#tab').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&getComputedStyle(document.getElementById('ready')).borderTopStyle==='solid'));
    await page.close();
  }
}
