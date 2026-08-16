# Ivory for DSH

> 一套克制、温暖的 Claude-inspired DeepSeek Harness 界面主题：响应式、可访问，并且不碰你的数据。

[English](README.md)

[![CI](https://github.com/ZJUZhiyuCai/dsh-ivory/actions/workflows/ci.yml/badge.svg)](https://github.com/ZJUZhiyuCai/dsh-ivory/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-111111.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-3c873a.svg)](package.json)
[![零运行时依赖](https://img.shields.io/badge/runtime_dependencies-0-111111.svg)](package.json)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img alt="Ivory for DSH 浅色界面" src="assets/hero-light.png" width="1440">
</picture>

Ivory 用暖中性色、编辑感字体、克制阴影和专注的对话布局重新组织 DSH
Web 界面，同时保留 DeepSeek 品牌和 DSH 的全部能力，并坚持无遥测。

## 安装

从 GitHub 安装当前版本：

```sh
dsh plugin --profile web add github:ZJUZhiyuCai/dsh-ivory
dsh web
```

npm 包上线后可使用更短的命令：

```sh
dsh plugin --profile web add dsh-ivory
```

安装后硬刷新浏览器（`Cmd/Ctrl + Shift + R`），再打开
**设置 → Ivory 主题**；可分别开启主题和默认关闭的专注模式。

卸载：

```sh
dsh plugin --profile web remove dsh-ivory
```

## 为什么不只是“换个颜色”

- **完整明暗主题**：自动跟随 DSH 当前外观。
- **响应式契约**：覆盖 375、768、1,440 和 1,920 像素视口。
- **可访问交互状态**：保留键盘焦点，移除输入卡片的蓝色外沿，并支持
  reduced-motion 与 forced-colors。
- **安全 Markdown 文档预览**：只构造 DOM 节点，不注入 HTML；仅允许
  HTTP(S) 链接，源码视图始终可达。
- **对称生命周期**：关闭主题时清除观察器、预览节点和墨色小鲸鱼回合标记。
- **宿主友好的兼容模式**：上游选择器变化时，结构增强自动降级，稳定设计
  token 仍会继续生效。

![Ivory 对话界面](assets/conversation-light.png)

<p align="center">
  <img alt="Ivory 在 390 像素移动端视口下的对话界面" src="assets/mobile-light.png" width="390">
</p>

## 信任模型

Ivory 是纯浏览器视觉插件，宿主入口刻意保持为空实现。

| 范围 | 行为 |
| --- | --- |
| 运行时依赖 | 无 |
| 宿主文件系统 / 进程访问 | 无 |
| 网络请求或遥测 | 无 |
| 持久化数据 | 两个本地 `localStorage` 偏好标记 |
| Anthropic 资产 | 不捆绑；只使用系统字体栈 |
| 用户内容处理 | 仅在浏览器内呈现，不离开 DSH |

npm 包采用八文件白名单，并由 CI 校验。具体边界见
[SECURITY.md](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/SECURITY.md) 和 [架构说明](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/docs/ARCHITECTURE.md)。

## 质量门禁

```sh
npm ci
npm test          # 可复现构建、静态安全检查、publint、包内容审计
npm run qa:r2     # 57 项浏览器回归；要求 127.0.0.1:3080 正在运行 DSH
```

浏览器套件覆盖布局契约、移动端溢出、输入框焦点、Markdown 注入尝试、
生命周期清理、流式状态、鲸鱼出现时机、深色模式、插件共存、长表格与
reduced-motion。

## 开发

```sh
npm ci
npm run build

dsh plugin --profile web add link:$PWD
dsh web
```

修改 `src/skin.css` 和 `src/client.template.js` 后运行 `npm run build`。
`lib/client.js` 会提交到仓库，因此 GitHub 安装无需执行构建脚本。

```text
src/skin.css             主题与兼容样式
src/client.template.js   客户端生命周期与可选增强
lib/client.js            确定性生成的浏览器包
lib/index.js             空宿主入口
cordis.patch.yml         DSH bundle 注册
scripts/                 构建与质量门禁
```

提交 PR 前请阅读 [CONTRIBUTING.md](https://github.com/ZJUZhiyuCai/dsh-ivory/blob/main/CONTRIBUTING.md)。

## 兼容性与限制

DeepSeek Harness 仍处于开发者预览阶段，UI 可能发生破坏性变化。Ivory 会在
运行时验证结构选择器；无法确认兼容性时退化为 token-only 样式。macOS、
Windows 和 Linux 的系统字体度量会略有不同。专注模式会临时隐藏已支持的
辅助面板，这是设计行为且默认关闭。

## 项目状态

首个版本刻意保持小而可审计。后续工作通过
[GitHub Issues](https://github.com/ZJUZhiyuCai/dsh-ivory/issues) 公开跟踪。
如果 Ivory 确实改善了你的 DSH 使用体验，一个 Star 会帮助更多人发现它。

## 独立性与商标

Ivory 是**非官方**、独立的社区项目，不隶属于 Anthropic 或 DeepSeek，也未获
其背书或赞助。Claude 是 Anthropic PBC 的商标；DeepSeek 与 DeepSeek Harness
可能是其权利人的商标。Ivory 不捆绑 Anthropic 字体、Logo、图标或代码。详见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

项目使用 [MIT License](LICENSE)。
