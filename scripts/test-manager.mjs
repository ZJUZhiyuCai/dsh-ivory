// Native plugin-manager layout regressions using installed CSS and synthetic
// package names only. Never touches a live plugin, profile or install action.
import fs from 'node:fs';
import path from 'node:path';
import { indexHostModules } from './host-contract.mjs';
import { expandHostSelectors } from './host-selectors.mjs';

const skin = expandHostSelectors(fs.readFileSync(new URL('../src/skin.css', import.meta.url), 'utf8'));
const icon = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="9" y="9" width="18" height="18" rx="4"/><path d="M13 15h10M13 20h7"/></svg>';
const longName = '@example/a-very-long-package-name-for-workspace-document-preview';
const description = 'Preview workspace documents and keep related files together. 在工作区中预览文档，整理相关文件。';

export function managerFixture(host, dark = false, css = skin) {
  const modules = indexHostModules(host.sources);
  const m = modules.get('@deepseek-ai/dsh-client-ui-plugin-manager/PluginManagerPage.module.css');
  const primitive = (family, member) => host.frontendCss.match(new RegExp(`\\._${member}_${family}_\\d+`))[0].slice(1);
  const switchFamily = host.frontendCss.match(/\._switch_(\w+)_\d+/)[1];
  const dialogFamily = host.frontendCss.match(/\._dialog_(\w+)_\d+/)[1];
  const buttonFamily = host.frontendCss.match(/\._button_(\w+)_\d+/)[1];
  const s = name => primitive(switchFamily, name), d = name => primitive(dialogFamily, name);
  const button = `${primitive(buttonFamily, 'button')} ${primitive(buttonFamily, 'sm')}`;
  const toggle = (label, checked = true) => `<button class="${s('switch')}" role="switch" aria-label="${label}" aria-checked="${checked}"><span class="${s('thumb')}"></span></button>`;
  const names = ['文档预览', '工作区导航', longName, '命令工具'];
  const cards = names.map((name, i) => `<li class="${m.card} ${m.cardLink}" data-plugin-item="fixture-${i}"><div class="${m.cardHead}"><span class="${m.cardIcon}">${icon}</span><div class="${m.cardMain}"><div class="${m.titleRow}"><button class="${m.cardTitle} ${m.cardOpen}" aria-label="查看 ${name}">${name}</button></div><span class="${m.cardDesc}">${description}</span></div><div class="${m.cardEnd}">${toggle('启用 '+name, i!==1)}</div></div></li>`).join('');
  const component = (state = 'done') => `<li class="${m.row}" data-state="${state}"><div class="${m.rowLine}"><span class="${m.rowIcon}">${icon}</span><div class="${m.rowMain}"><span class="${m.rowId}">${longName}</span><span class="${m.rowModule}">${description}</span><code class="${m.rowModule}">document-preview/client</code></div><span class="${m.rowState}">${state==='done'?'运行中':'加载失败'}</span>${toggle('启用组件 '+state)}</div>${state==='failed'?`<p class="${m.rowFailure}">未找到测试组件。请检查安装来源。</p>`:''}</li>`;
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Ivory · 插件管理布局测试</title><style>${host.css}\n${css}\nhtml,body{margin:0;height:100%}body{background:var(--cl-page);font-family:var(--cl-sans)}[hidden]{display:none!important}#workspace{height:100%;width:100%}#installer{padding:20px;box-sizing:border-box}</style><body class="dsh-ivory" ${dark?'data-ds-dark-theme':''}>
  <main id="workspace"><div id="manager" class="${m.page}">
    <header id="list-head" class="${m.pageHead}" data-window-drag="true"><div class="${m.pageHeading}"><h1 class="${m.pageTitle}">插件</h1><div class="${m.pageIntro}"><span>安装、启用和配置插件</span><button class="${button} ${primitive(buttonFamily,'ghost')} ${m.infoButton}" aria-label="插件说明">ⓘ</button></div></div><div class="${m.toolbar}"><button class="${m.iconButton}" aria-label="刷新">↻</button><span class="${m.addGroup}"><button class="${button} ${primitive(buttonFamily,'primary')} ${m.addPrimary}">＋ 添加插件</button><span><button class="${button} ${primitive(buttonFamily,'primary')} ${m.addMore}" aria-label="选择添加插件方式">⌄</button></span></span></div></header>
    <section id="list" class="${m.group}"><div class="${m.groupHead}"><h3 class="${m.groupTitle}">已安装插件</h3></div><ul class="${m.cards}">${cards}</ul></section>
    <div id="detail" class="${m.detail}" data-plugin-detail="fixture" hidden><div class="${m.detailTop}" data-window-drag="true"><button class="${m.crumb}" aria-label="返回插件">‹ 插件</button><div class="${m.detailHead}"><span class="${m.cardIcon}">${icon}</span><div class="${m.detailActions}"><button class="${button} ${m.danger}">卸载</button>${toggle('启用插件')}</div></div></div><div class="${m.detailMain}"><div class="${m.titleRow}"><h3 class="${m.detailTitle}">${longName}</h3><span class="${m.versionTag}">v1.0.0</span></div><p class="${m.detailName}"><code>${longName}</code></p><p class="${m.detailDesc}">${description}</p></div><div class="${m.detailSections}"><section class="${m.detailSection}"><div class="${m.sectionHead}"><h4 class="${m.sectionTitle}">包含的组件</h4><span class="${m.sectionCount}">共 2 个 · 1 运行中</span></div><ul class="${m.rows}">${component()}${component('failed')}</ul></section><section class="${m.detailSection}"><h4 class="${m.sectionTitle}">来源信息</h4><dl class="${m.facts}"><div><dt>代码来源</dt><dd><code>${longName}@1.0.0</code></dd></div><div><dt>当前版本</dt><dd>1.0.0</dd></div></dl></section></div></div>
  </div></main>
  <div id="installer" class="${d('root')}" hidden><div class="${d('mask')}"></div><div class="${d('dialog')} ${m.installDialog}" role="dialog" aria-label="添加插件"><div class="${d('content')} ${m.installContent}"><header class="${d('header')}"><h2 class="${d('title')}">添加插件</h2><button class="${d('close')}" aria-label="关闭">×</button></header><div class="${d('body')} ${m.installBody}"><label class="${m.installField}">包名<input type="text" placeholder="例如 dsh-ivory" aria-label="包名"></label><p class="${m.inputError}" id="input-error" hidden>请输入有效的包名。</p><div class="${m.optionsRow}"><button class="${m.guideToggle}">支持哪些来源？</button><button class="${m.registryToggle}" aria-expanded="false">npm 官方源⌄</button></div><p class="${m.installSafety}">请确认插件来源可信；插件可能访问本地文件。</p></div></div><footer class="${d('footer')}"><button class="${button}">取消</button><button class="${button} ${primitive(buttonFamily,'primary')}">安装</button></footer></div></div>
  <script>for(const e of document.querySelectorAll('[role=switch]'))e.addEventListener('click',()=>e.setAttribute('aria-checked',e.getAttribute('aria-checked')!=='true'));for(const e of document.querySelectorAll('.${m.cardOpen}'))e.addEventListener('click',()=>document.body.dataset.opened='true');</script>
  </body></html>`;
}

export async function testManager(browser, hosts, check, shotsDir) {
  for (const [side, host] of Object.entries(hosts)) for (const dark of [false, true]) {
    const page = await browser.newPage({viewport:{width:1040,height:740}});
    const prefix = `${side} ${dark?'dark':'light'} plugin manager`;
    await page.setContent(managerFixture(host, dark));
    const m = indexHostModules(host.sources).get('@deepseek-ai/dsh-client-ui-plugin-manager/PluginManagerPage.module.css');
    const overflow = () => page.locator('#manager').evaluate(e=>e.scrollWidth>e.clientWidth||document.documentElement.scrollWidth>innerWidth);
    check(`${prefix}: long list labels stay within the page`,!(await overflow()));
    const firstSwitch = page.getByRole('switch').first();
    const thumbContrast = () => firstSwitch.evaluate(async e=>{
      await Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished));
      const rgb = el=>getComputedStyle(el).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance = c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const a=luminance(rgb(e)),b=luminance(rgb(e.firstElementChild));
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3;
    });
    check(`${prefix}: enabled thumb has 3:1 contrast`,await thumbContrast());
    await firstSwitch.click();
    check(`${prefix}: toggling does not open the row`,await firstSwitch.getAttribute('aria-checked')==='false'&&!(await page.getAttribute('body','data-opened')));
    check(`${prefix}: switches keep a 24px target`,await firstSwitch.evaluate(e=>e.getBoundingClientRect().height>=24));
    check(`${prefix}: off-state thumb has 3:1 contrast`,await thumbContrast());
    await page.getByRole('button',{name:'查看 文档预览',exact:true}).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    check(`${prefix}: row focus stays inside its hit area without a second frame`,await page.locator('.'+m.cardOpen).first().evaluate(e=>getComputedStyle(e).outlineStyle==='none'&&getComputedStyle(e).boxShadow==='none'&&getComputedStyle(e,'::after').outlineStyle==='solid'&&parseFloat(getComputedStyle(e,'::after').outlineOffset)<0));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-manager-${dark?'dark':'light'}.png`)});
    await page.evaluate(()=>{const native=document.querySelector('[role=switch]').cloneNode(true);native.id='extension-switch';const slot=document.createElement('div');slot.dataset.slot='plugins.detail.section';slot.appendChild(native);document.getElementById('manager').appendChild(slot);});
    check(`${prefix}: extension-provided switches keep their own geometry`,await page.locator('#extension-switch').evaluate(e=>e.getBoundingClientRect().height===20));
    await page.locator('#extension-switch').evaluate(e=>e.parentElement.remove());
    await page.evaluate(()=>{document.getElementById('list').hidden=true;document.getElementById('list-head').hidden=true;document.getElementById('detail').hidden=false;});
    check(`${prefix}: component prose differs from code typography`,await page.locator('span.'+m.rowModule).first().evaluate((e,cls)=>getComputedStyle(e).fontFamily!==getComputedStyle(document.querySelector('code.'+cls)).fontFamily,m.rowModule));
    for (const width of [520,375,320]) {
      // Keep a wide viewport: layout must respond to a narrow *panel*, too.
      await page.locator('#workspace').evaluate((e,w)=>e.style.width=w+'px',width);
      check(`${prefix}: ${width}px detail has no horizontal overflow`,!(await overflow()));
      check(`${prefix}: ${width}px description keeps reading space`,await page.locator('span.'+m.rowModule).first().evaluate(e=>e.getBoundingClientRect().width>=140));
      check(`${prefix}: ${width}px status sits below the description`,await page.locator('.'+m.rowState).first().evaluate((e,cls)=>e.getBoundingClientRect().top>=e.parentElement.querySelector('.'+cls).getBoundingClientRect().bottom,m.rowMain));
      check(`${prefix}: ${width}px source uses the available line width`,await page.locator('.'+m.facts+' dd').first().evaluate(e=>e.getBoundingClientRect().left===e.previousElementSibling.getBoundingClientRect().left&&e.scrollWidth<=e.clientWidth));
    }
    await page.setViewportSize({width:375,height:800});
    await page.locator('#workspace').evaluate(e=>e.style.width='100%');
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-manager-detail-${dark?'dark':'light'}-narrow.png`)});
    await page.evaluate(()=>{document.getElementById('detail').hidden=true;document.getElementById('list').hidden=false;document.getElementById('list-head').hidden=false;});
    check(`${prefix}: narrow list toolbar remains reachable`,await page.locator('.'+m.toolbar+' button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})));
    await page.evaluate(()=>{document.getElementById('workspace').hidden=true;document.getElementById('installer').hidden=false;});
    await page.getByRole('textbox',{name:'包名'}).focus();
    check(`${prefix}: install field has one focus frame`,await page.getByRole('textbox',{name:'包名'}).evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&getComputedStyle(e).boxShadow==='none'));
    await page.getByRole('textbox',{name:'包名'}).evaluate(e=>e.setAttribute('aria-invalid','true'));
    check(`${prefix}: invalid input retains its error border`,await page.getByRole('textbox',{name:'包名'}).evaluate(e=>getComputedStyle(e).borderTopColor!==getComputedStyle(e).outlineColor));
    check(`${prefix}: install warning and actions remain visible`,await page.locator('.'+m.installSafety).isVisible()&&await page.getByRole('button',{name:'安装',exact:true}).isVisible());
    await page.emulateMedia({forcedColors:'active'});
    check(`${prefix}: forced colors keeps the input boundary`,await page.getByRole('textbox',{name:'包名'}).evaluate(e=>getComputedStyle(e).borderTopStyle==='solid'&&getComputedStyle(e).outlineStyle==='solid'));
    await page.emulateMedia({forcedColors:'none'});
    await page.evaluate(()=>{document.getElementById('installer').hidden=true;document.getElementById('workspace').hidden=false;document.body.classList.add('dshcs-contract-mismatch');});
    check(`${prefix}: drift fallback releases the manager layout`,await page.locator('#manager').evaluate(e=>getComputedStyle(e).containerType==='normal'));
    await page.evaluate(()=>document.body.classList.remove('dshcs-contract-mismatch'));
    await page.emulateMedia({reducedMotion:'reduce'});
    check(`${prefix}: reduced motion stops switch travel`,await firstSwitch.evaluate(e=>getComputedStyle(e.firstElementChild).transitionDuration.split(',').every(t=>parseFloat(t)<.001)));
    await page.close();
  }
}
