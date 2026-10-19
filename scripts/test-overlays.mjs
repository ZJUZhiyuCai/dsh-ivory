// Isolated host-CSS integration fixtures: no live profile, account or settings.
import fs from 'node:fs';
import path from 'node:path';
import { indexHostModules } from './host-contract.mjs';
import { expandHostSelectors } from './host-selectors.mjs';

const skin = expandHostSelectors(fs.readFileSync(new URL('../src/skin.css', import.meta.url), 'utf8'));
const template = fs.readFileSync(new URL('../src/client.template.js', import.meta.url), 'utf8');
const settingsCss = template.match(/const SETTINGS_CSS = `([\s\S]*?)`;/)[1];
const icon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="5"/><path d="M8 5v6M5 8h6"/></svg>';

function overlayFixture(host, dark) {
  const modules = indexHostModules(host.sources);
  const module = (suffix) => [...modules].find(([name]) => name.endsWith('/' + suffix))[1];
  const settings = module('SettingsRoot.module.css'), theme = module('AppearanceRow.module.css');
  const font = module('FontSizeRow.module.css'), language = module('LanguageRow.module.css');
  const workspace = module('WorkspaceBrowser.module.css');
  const shortcuts = modules.get('@deepseek-ai/dsh-client-ui-shortcuts/Reference.module.css');
  const primitive = (family, name) => host.frontendCss.match(new RegExp(`\\._${name}_${family}_\\d+`))[0].slice(1);
  const menuFamily = host.frontendCss.match(/\._itemWrap_(\w+)_\d+/)[1];
  const surfaceFamily = host.frontendCss.match(/\._surface_(\w+)_\d+/)[1];
  const dialogFamily = host.frontendCss.match(/\._dialog_(\w+)_\d+/)[1];
  const buttonFamily = host.frontendCss.match(/\._button_(\w+)_\d+/)[1];
  const m = (n) => primitive(menuFamily, n), s = (n) => primitive(surfaceFamily, n), d = (n) => primitive(dialogFamily, n);
  const row = `<div class="${language.row}"><div class="${language.rowText}"><div class="${language.title}">语言与界面 Language</div></div><span><button class="${language.selector}" aria-haspopup="menu">中文⌄</button></span></div>`;
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Ivory 设置与浮层 · 本地测试示例</title>
  <style>${host.css}\n${skin}\n${settingsCss}\nhtml,body{margin:0;height:100%}body{background:var(--cl-page,var(--dsw-alias-bg-base));font-family:var(--cl-sans)}[hidden]{display:none!important}</style>
  <body class="dsh-ivory" ${dark ? 'data-ds-dark-theme' : ''}>
  <div id="settings" class="${settings.overlay}"><div class="${settings.mask}"></div><div class="${settings.panel}" role="dialog" aria-label="设置">
  <nav class="${settings.nav}"><div class="${settings.navTitle}">设置</div><div id="nav" class="${settings.navList}">${['通用设置','模型','内置插件','Agent 预设','Ivory 主题','侧边卡片','Token Saver'].map((name,i)=>`<button class="${settings.navCell} ${i===0?settings.active:''}" ${i===0?'aria-current="true"':''}>${icon}<span class="${settings.navLabel}">${name}</span></button>`).join('')}</div></nav>
  <div class="${settings.content}"><div class="${settings.header}"><div class="${settings.actions}"><button>打开配置文件</button></div><button id="close" class="${settings.close}" aria-label="关闭">×</button></div>
  <div id="options" class="${settings.options}"><div data-slot="settings.section"><div data-slot="settings.general.item">${row}
  <div class="${theme.group}"><div class="${theme.title}">外观</div><div id="themes" class="${theme.cubeRow}">${['浅色','深色','跟随系统'].map((name,i)=>`<button role="checkbox" aria-checked="${i===0}" class="${theme.themeCube} ${i===0?theme.selected:''}">${icon}${name}</button>`).join('')}</div></div>
  <div class="${font.row}"><div class="${font.rowText}"><div class="${font.title}">字号大小</div><div class="${font.desc}">仅影响会话内容的字号</div></div><div class="${font.control}"><div class="${font.stepper}"><span class="${font.value}">14</span><span class="${font.arrows}"><button class="${font.arrow}" aria-label="增大字号">⌃</button><button class="${font.arrow}" aria-label="减小字号">⌄</button></span></div><span class="${font.unit}">px</span><button class="${font.expander}" aria-label="更多字体设置">⌄</button></div></div>
  </div><div class="dshcs-settings"><div class="dshcs-head"><div class="dshcs-title">Ivory 主题</div><div class="dshcs-desc">温暖、克制的明暗双主题，保留全部功能面板。</div></div><div class="dshcs-row"><div class="dshcs-text"><div class="dshcs-title">启用 Ivory 主题</div><div class="dshcs-desc">调整布局、配色、字体、圆角与阴影。</div></div><button id="switch" class="dshcs-switch dshcs-on" role="switch" aria-checked="true" aria-label="启用 Ivory 主题"><span class="dshcs-knob"></span></button></div><div class="dshcs-row dshcs-disabled"><div class="dshcs-text"><div class="dshcs-title">专注模式</div><div class="dshcs-desc">临时隐藏已支持的辅助面板，适合沉浸式对话。</div></div><button id="disabled" class="dshcs-switch" role="switch" aria-checked="false" disabled><span class="dshcs-knob"></span></button></div></div>
  <div data-slot="settings.general.item">${row.repeat(6)}</div></div></div></div></div></div>
  <div hidden id="menu" class="${s('surface')} ${m('list')} ${m('portal')}" data-menu-material="translucent" role="menu" style="top:40px;left:24px;width:220px;--dsh-menu-anchor:--fixture-menu"><div class="${s('material')}"></div><div class="${m('viewport')}">
  <div class="${m('itemWrap')}"><button id="selected" class="${m('item')} ${m('selected')}" role="menuitem"><span class="${m('itemIcon')}">${icon}</span><span class="${m('itemLabel')}">跟随系统</span><span class="${m('check')}">✓</span></button></div>
  <div class="${m('itemWrap')}"><button id="menu-focus" class="${m('item')}" role="menuitem"><span class="${m('itemLabel')}">重命名</span><span class="${m('shortcut')}">⌘ G</span></button></div>
  <div class="${m('itemWrap')}"><button class="${m('item')}" role="menuitem" disabled>暂不可用</button></div><div class="${m('separator')}"></div>
  <div class="${m('itemWrap')}"><button id="danger" class="${m('item')} ${m('danger')}" role="menuitem">移除</button></div>
  <div class="${m('itemWrap')}"><button class="${m('item')}" role="menuitem" aria-haspopup="menu">更多 ›</button><div id="submenu" class="${s('surface')} ${m('submenu')}" data-menu-material="translucent" role="menu"><div class="${s('material')}"></div><button class="${m('item')}" role="menuitem">打开文件位置</button></div></div></div></div>
  <div id="dialog-root" hidden class="${d('root')}"><div class="${d('mask')}"></div><div id="dialog" class="${d('dialog')}" role="dialog" aria-labelledby="dialog-title"><div class="${d('content')}"><header class="${d('header')}"><h2 id="dialog-title" class="${d('title')}">重命名会话</h2><button class="${d('close')}" aria-label="关闭">×</button></header><p class="${d('description')}">选择一个容易辨认的名称。</p><div class="${d('body')}"><input class="${workspace.renameInput}" aria-label="名称" value="界面设计笔记"></div></div><footer class="${d('footer')}"><button class="${primitive(buttonFamily,'button')}">取消</button><button class="${primitive(buttonFamily,'button')}">保存</button></footer></div></div>
  <div id="shortcuts-root" hidden class="${d('root')}"><div data-shortcut-modal="shortcuts" class="${d('dialog')} ${shortcuts.dialog}" role="dialog" aria-label="快捷键"><div class="${shortcuts.contents}"><div class="${shortcuts.searchRow}"><div class="${shortcuts.searchField}">${icon}<input class="${shortcuts.search}" type="search" aria-label="搜索快捷键"></div></div></div></div></div>
  </body></html>`;
}

export async function testOverlays(browser, hosts, check, shotsDir) {
  for (const [side,host] of Object.entries(hosts)) for (const dark of [false,true]) {
    const label=`${side} ${dark?'dark':'light'} overlays`;
    const page=await browser.newPage({viewport:{width:1080,height:800}});
    const html=overlayFixture(host,dark);
    await page.setContent(html);
    const thumbContrast = () => page.locator('#switch').evaluate(async e=>{
      await Promise.all(e.getAnimations().map(animation=>animation.finished));
      // Host fallback tracks are translucent: measure their composited color,
      // not the unpainted RGB channels of an rgba() token.
      const backgroundAt=node=>{const chain=[];for(;node;node=node.parentElement)chain.unshift(node);return chain.reduce((bg,el)=>{const c=getComputedStyle(el).backgroundColor.match(/[\d.]+/g).map(Number),alpha=c[3]??1;return bg.map((v,i)=>c[i]*alpha+v*(1-alpha));},[255,255,255]);};
      const luminance=color=>{const c=color.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
      const a=luminance(backgroundAt(e)),b=luminance(backgroundAt(e.firstElementChild));
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3;
    });
    await page.locator('#switch').evaluate(e=>e.classList.remove('dshcs-on'));
    check(`${label}: off-switch thumb meets 3:1 UI contrast`,await thumbContrast());
    await page.locator('#switch').evaluate(e=>e.classList.add('dshcs-on'));
    check(`${label}: settings content scrolls independently`,await page.locator('#options').evaluate(e=>e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto'));
    check(`${label}: selected navigation remains distinguishable`,await page.locator('[aria-current]').evaluate(e=>getComputedStyle(e).backgroundColor!==getComputedStyle(e.parentElement.parentElement).backgroundColor));
    check(`${label}: font stepper hit targets do not overlap`,await page.getByRole('button',{name:/[增减].*字号/}).evaluateAll(es=>es.length===2&&es.every(e=>e.getBoundingClientRect().width>=24&&e.getBoundingClientRect().height>=24)&&es[0].getBoundingClientRect().right<=es[1].getBoundingClientRect().left));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-settings-${dark?'dark':'light'}.png`)});
    await page.setViewportSize({width:375,height:640});
    check(`${label}: narrow settings and options fit without horizontal scroll`,await page.locator('#options').evaluate(e=>e.scrollWidth<=e.clientWidth&&document.documentElement.scrollWidth<=innerWidth));
    check(`${label}: theme choices stay side by side`,await page.locator('#themes button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().top===es[0].getBoundingClientRect().top&&e.getBoundingClientRect().width>60)));
    await page.locator('#nav button').last().focus();
    check(`${label}: all navigation entries remain keyboard reachable`,await page.locator('#nav').evaluate(e=>e.scrollLeft>0&&document.activeElement.getBoundingClientRect().right<=e.getBoundingClientRect().right+1));
    await page.locator('#options').evaluate(e=>e.scrollTop=e.scrollHeight);
    check(`${label}: close button stays visible when content scrolls`,await page.locator('#close').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.right<=innerWidth&&r.bottom<innerHeight&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;}));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-settings-${dark?'dark':'light'}-narrow.png`)});
    await page.evaluate(()=>{document.body.classList.remove('dsh-ivory');document.getElementById('switch').classList.remove('dshcs-on');});
    check(`${label}: theme-off switch keeps a visible track and thumb`,await thumbContrast()&&await page.locator('#switch').evaluate(e=>e.getBoundingClientRect().height>=24));
    check(`${label}: disabled switch remains disabled`,await page.locator('#disabled').isDisabled());
    await page.evaluate(()=>{document.body.classList.add('dsh-ivory');document.getElementById('settings').hidden=true;document.getElementById('menu').hidden=false;});
    await page.setViewportSize({width:760,height:600});
    check(`${label}: menu retains portal placement and an unclipped submenu`,await page.locator('#submenu').evaluate(e=>{let p=e.parentElement;while(p&&p!==document.body){if(['hidden','auto','scroll'].includes(getComputedStyle(p).overflowX))return false;p=p.parentElement;}return getComputedStyle(document.getElementById('menu')).position==='fixed'&&getComputedStyle(e).position==='absolute';}));
    check(`${label}: selected menu item differs from its surface`,await page.locator('#selected').evaluate(e=>getComputedStyle(e).backgroundColor!==getComputedStyle(document.querySelector('[data-menu-material] > [class*="_material_"]')).backgroundColor));
    await page.locator('#menu-focus').focus();
    await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
    check(`${label}: menu focus ring fits inside the row`,await page.locator('#menu-focus').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&parseFloat(getComputedStyle(e).outlineOffset)<0));
    check(`${label}: danger action keeps a distinct tone`,await page.locator('#danger').evaluate(e=>getComputedStyle(e).color!==getComputedStyle(document.getElementById('menu-focus')).color));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-menu-${dark?'dark':'light'}.png`)});
    await page.emulateMedia({reducedMotion:'reduce'});
    check(`${label}: reduced motion covers menus and theme switches`,await page.locator('#menu-focus,.dshcs-switch,.dshcs-knob').evaluateAll(es=>es.every(e=>getComputedStyle(e).transitionDuration.split(',').every(t=>parseFloat(t)<.001))));
    await page.emulateMedia({forcedColors:'active'});
    check(`${label}: forced colors preserve the menu boundary and focus`,await page.locator('#menu-focus').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&getComputedStyle(document.getElementById('menu')).borderTopStyle==='solid'));
    await page.emulateMedia({forcedColors:'none'});
    await page.evaluate(()=>{document.getElementById('menu').hidden=true;document.getElementById('dialog-root').hidden=false;});
    await page.setViewportSize({width:375,height:400});
    check(`${label}: small dialog retains usable footer actions`,await page.locator('#dialog button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.height>=32&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})));
    await page.getByRole('textbox',{name:'名称'}).focus();
    check(`${label}: dialog input has a single visible focus frame`,await page.getByRole('textbox',{name:'名称'}).evaluate(e=>getComputedStyle(e).outlineStyle==='solid'&&getComputedStyle(e).outlineOffset==='0px'&&getComputedStyle(e).boxShadow==='none'));
    if(shotsDir)await page.screenshot({path:path.join(shotsDir,`${side}-dialog-${dark?'dark':'light'}.png`)});
    await page.evaluate(()=>{document.getElementById('dialog-root').hidden=true;document.getElementById('shortcuts-root').hidden=false;});
    await page.getByRole('searchbox').focus();
    check(`${label}: shortcut search has one focus ring around icon and input`,await page.getByRole('searchbox').evaluate(e=>getComputedStyle(e).outlineStyle==='none'&&getComputedStyle(e.parentElement).outlineStyle==='solid'));
    await page.close();
  }
}
