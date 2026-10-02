// Read installed host assets for development checks without booting the host.
import fs from 'node:fs';
import path from 'node:path';

export function embeddedStyles(sources) {
  return sources.flatMap((source) => [...source.matchAll(/(?:const css(?:\$\d+)?|var \w+_css_default(?:\$\d+)?) = ("(?:\\.|[^"\\])*");/g)]
    .map((match) => JSON.parse(match[1]))).join('\n');
}

export function readDesktopHost() {
  const dir = process.env.DSH_DESKTOP_CLIENT_DIR;
  if (dir) {
    const files = fs.readdirSync(dir);
    const sources = files.filter((name) => name.endsWith('.js')).map((name) => fs.readFileSync(path.join(dir, name), 'utf8'));
    const frontendCss = files.filter((name) => /^index-.*\.css$/.test(name)).map((name) => fs.readFileSync(path.join(dir, name), 'utf8')).join('\n');
    return { sources, css: embeddedStyles(sources) + '\n' + frontendCss, frontendCss };
  }
  const archive = '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar';
  if (!fs.existsSync(archive)) throw new Error('Install DSH desktop or set DSH_DESKTOP_CLIENT_DIR to extracted client bundles and frontend index-*.css.');
  const fd = fs.openSync(archive, 'r');
  try {
    const prefix = Buffer.alloc(16);
    fs.readSync(fd, prefix, 0, prefix.length, 0);
    const header = Buffer.alloc(prefix.readUInt32LE(12));
    fs.readSync(fd, header, 0, header.length, 16);
    const base = 8 + prefix.readUInt32LE(4);
    const sources = [], styles = [], versions = {};
    const walk = (node, name = '') => {
      for (const [part, entry] of Object.entries(node.files || {})) {
        const full = `${name}/${part}`;
        if (entry.files) { walk(entry, full); continue; }
        const client = /\/@deepseek-ai\/dsh-client-[^/]+\/lib\/client\.js$/.test(full);
        const stylesheet = /\/dsh-web-frontend\/dist\/assets\/index-[^/]+\.css$/.test(full);
        const manifest = full.match(/\/(@deepseek-ai\/dsh-client-[^/]+)\/package\.json$/);
        if (!client && !stylesheet && !manifest) continue;
        const data = Buffer.alloc(entry.size);
        fs.readSync(fd, data, 0, data.length, base + Number(entry.offset));
        const content = data.toString('utf8');
        if (client) sources.push(content);
        if (stylesheet) styles.push(content);
        if (manifest) versions[manifest[1]] = JSON.parse(content).version;
      }
    };
    walk(JSON.parse(header.toString('utf8')));
    const frontendCss = styles.join('\n');
    return { sources, css: embeddedStyles(sources) + '\n' + frontendCss, frontendCss, versions };
  } finally { fs.closeSync(fd); }
}

export function readWebHost() {
  const candidates = [process.env.DSH_WEB_PACKAGE_DIR, '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh', '/usr/local/lib/node_modules/@deepseek-ai/dsh', '/usr/lib/node_modules/@deepseek-ai/dsh'].filter(Boolean);
  const root = candidates.find((dir) => fs.existsSync(path.join(dir, 'node_modules/@deepseek-ai/dsh-web-frontend')));
  if (!root) throw new Error('Set DSH_WEB_PACKAGE_DIR to the installed @deepseek-ai/dsh package for Web regressions.');
  const packages = path.join(root, 'node_modules/@deepseek-ai');
  const sources = fs.readdirSync(packages).filter((name) => name.startsWith('dsh-client-'))
    .map((name) => path.join(packages, name, 'lib/client.js')).filter((file) => fs.existsSync(file))
    .map((file) => fs.readFileSync(file, 'utf8'));
  const assets = path.join(packages, 'dsh-web-frontend/dist/assets');
  const frontendCss = fs.readdirSync(assets).filter((name) => /^index-.*\.css$/.test(name))
    .map((name) => fs.readFileSync(path.join(assets, name), 'utf8')).join('\n');
  return { sources, css: embeddedStyles(sources) + '\n' + frontendCss, frontendCss, version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version };
}
