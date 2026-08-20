<h1 align="center">Ivory for DSH</h1>

<p align="center">
  <strong>一套克制、温暖的 DeepSeek Harness 界面主题</strong><br>
  明暗双主题，兼顾桌面与移动端，支持中英文，全程无遥测。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-ivory"><img alt="npm 版本" src="https://img.shields.io/npm/v/dsh-ivory?style=flat-square&color=383835"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/actions/workflows/ci.yml"><img alt="CI 状态" src="https://img.shields.io/github/actions/workflow/status/ZJUZhiyuCai/dsh-ivory/ci.yml?branch=main&style=flat-square&label=CI"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/releases/latest"><img alt="最新版本" src="https://img.shields.io/github/v/release/ZJUZhiyuCai/dsh-ivory?style=flat-square&color=6f6d68"></a>
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/LICENSE"><img alt="MIT 许可证" src="https://img.shields.io/badge/license-MIT-111111?style=flat-square"></a>
  <img alt="无遥测" src="https://img.shields.io/badge/telemetry-none-2f855a?style=flat-square">
</p>

<p align="center">
  <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/README.md">English</a>
  · <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/SECURITY.md">安全说明</a>
  · <a href="https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/CHANGELOG.md">更新记录</a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/hero-dark.png">
  <img alt="Ivory for DSH 首页" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/hero-light.png" width="1440">
</picture>

Ivory 把 DSH Web 调成更耐看的暖中性界面。长回复有了更舒服的阅读节奏，
会话区在窄屏手机和宽屏桌面上都能正常使用。DeepSeek 品牌和 DSH 原有能力
保持不变，主题只处理浏览器里的视觉与交互细节。

## 快速安装

```sh
dsh plugin --profile web add dsh-ivory
dsh web
```

安装后使用 `Cmd/Ctrl + Shift + R` 硬刷新页面，再打开
**设置 → Ivory 主题**。主题默认开启，专注模式默认关闭，按需要选择即可。

<details>
<summary><strong>固定版本与卸载</strong></summary>

绕过 npm，安装确切的 GitHub 标签版本。

```sh
dsh plugin --profile web add github:ZJUZhiyuCai/dsh-ivory#v0.2.5
```

移除 Ivory，恢复 DSH 原生界面。

```sh
dsh plugin --profile web remove dsh-ivory
```

</details>

## 每天都用得上的改动

| 范围 | Ivory 做了什么 |
| --- | --- |
| **界面外观** | 暖中性色明暗主题，搭配克制的阴影、圆角和更适合长文阅读的字体。 |
| **响应式布局** | 会话区会随视口伸缩，已覆盖 375、768、1,440 和 1,920 像素。 |
| **阅读与复制** | 正文、用户气泡和代码块都有独立复制按钮，回复结尾带有轻量鲸鱼标记。 |
| **Markdown 文档** | `.md` 输出可在安全预览与源码之间切换，只允许 HTTP(S) 链接，并限制极端输入规模。 |
| **可访问性** | 保留键盘焦点，支持 reduced-motion 与 forced-colors，弱化文字达到 WCAG AA 对比度。 |
| **兼容降级** | DSH 结构选择器变化时，Ivory 会退出结构样式，只保留稳定的主题 token。 |

## 看看实际界面

<table>
  <tr>
    <td width="72%"><img alt="Ivory 桌面端会话界面" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/conversation-light.png"></td>
    <td width="28%"><img alt="Ivory 移动端会话界面" src="https://raw.githubusercontent.com/ZJUZhiyuCai/dsh-ivory/main/assets/mobile-light.png"></td>
  </tr>
  <tr>
    <td align="center"><sub>桌面端专注会话</sub></td>
    <td align="center"><sub>390 像素移动端布局</sub></td>
  </tr>
</table>

## 安静，也有边界

Ivory 是纯浏览器视觉插件，宿主入口保持为空实现。

| 边界 | Ivory 的行为 |
| --- | --- |
| 捆绑的运行时依赖 | 无。DSH 客户端模块与 React 只声明为 peer。 |
| 文件系统与进程访问 | 无。 |
| 网络请求与遥测 | 无。 |
| 持久化数据 | 只在 `localStorage` 保存两个本地偏好标记。 |
| 用户内容 | 只在浏览器内呈现，明确点击复制后才写入本机剪贴板。 |
| 第三方品牌资产 | 不捆绑 Anthropic 字体、Logo、图标或应用代码。 |

npm 包固定为八个白名单文件，每次 CI 都会检查。完整边界可查看
[安全说明](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/SECURITY.md)、
[架构说明](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/docs/ARCHITECTURE.md)和
[第三方声明](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/THIRD_PARTY_NOTICES.md)。

> [!NOTE]
> DeepSeek Harness 仍处于开发者预览阶段，UI 可能发生破坏性变化。
> Ivory 0.2.x 已针对 DSH 0.1.0-rc.7 和当前 0.1.0-rc.8 Web 客户端模块完成验证。
> 无法确认当前结构契约时，Ivory 会保留 token 级主题，并把布局控制权交还给 DSH。

<details>
<summary><strong>质量与发布门禁</strong></summary>

```sh
npm ci
npm test          # 14 项静态、构建、publint 与包检查
npm run qa:r2     # 69 项浏览器回归，要求 DSH 运行于 127.0.0.1:3080
npm run qa:adversarial  # 29 项压测：宿主协调安全、开关/resize 风暴、降级模式
npm run qa:activity     # 16 项思考/工具调用行、图标与终端打磨检查
npm run qa:micro        # 28 项 Vision Toolkit/Ivory 微组件检查；若工具箱未安装在 DSH Web profile，请设置 DVT_CLIENT_JS
```

浏览器套件覆盖响应式布局、输入框焦点、深色模式、Markdown 注入尝试、
流式状态、生命周期清理、复制内容精度、插件共存、长表格、reduced-motion
和 forced-colors。

npm 发布使用 Trusted Publisher 与 GitHub OIDC。仓库不保存长期 npm 发布
令牌，后续 CI 版本会由 npm 自动生成 provenance。

</details>

<details>
<summary><strong>本地开发</strong></summary>

```sh
npm ci
npm run build

dsh plugin --profile web add link:$PWD
dsh web
```

修改 `src/skin.css` 或 `src/client.template.js` 后运行 `npm run build`。
生成的 `lib/client.js` 会提交到仓库，因此从 GitHub 安装不需要构建权限。

```text
src/skin.css             主题与兼容样式
src/client.template.js   客户端生命周期与可选增强
lib/client.js            确定性生成的浏览器包
lib/index.js             空宿主入口
cordis.patch.yml         DSH bundle 注册
scripts/                 构建与质量门禁
```

提交 PR 前请阅读
[CONTRIBUTING.md](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/CONTRIBUTING.md)。

</details>

## 独立社区项目

Ivory 是非官方社区项目，不隶属于 Anthropic 或 DeepSeek，也未获其背书或
赞助。Claude 是 Anthropic PBC 的商标。DeepSeek 与 DeepSeek Harness 可能是
其权利人的商标。

项目使用 [MIT License](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/LICENSE)。
