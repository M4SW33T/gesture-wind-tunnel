# AeroFlow: Virtual Wind Tunnel

> 🌐 **在线 Demo：[m4sw33t.github.io/gesture-wind-tunnel](https://m4sw33t.github.io/gesture-wind-tunnel)**

手势驱动的虚拟风洞交互原型。用手掌开合控制气流扩散、左右移动旋转赛车，观察 F1 赛车周围的气流粒子运动。

---

## Before / After

| 阶段 | 做了什么 |
|------|----------|
| 🧪 **AI Studio 初版** | 在 Google AI Studio 中用 Build 快速搭建原型 —— 基础手势识别 + 3D 粒子风洞 |
| 🔧 **修复部署** | 清理 AI Studio CDN 残留，适配 GitHub Pages 子目录路径，修复资源 404 |
| ✋ **手势优化** | 添加 lerp 平滑、旋转死区、手部丢失渐隐；4 指距离归一化替代 3 指 |
| 🎨 **作品集展示版** | 状态机 UI（加载→追踪→丢失）、HUD 重构、粒子精炼、错误处理完善 |

---

## About

这是一个设计学作品集项目，不是真正的 CFD 求解器。用手势交互让观众直观"感受"空气动力学概念 —— 扩散、聚焦、湍流尾流。

**技术栈**：React 19 + Three.js (React Three Fiber) + MediaPipe 手势识别 + Tailwind CSS

**使用方式**：

1. 打开 [在线 Demo](https://m4sw33t.github.io/gesture-wind-tunnel)
2. 点击 **INITIALIZE SYSTEM** 按钮
3. 允许浏览器使用摄像头
4. ✋ **张开手掌** → 气流扩散变宽
5. ✊ **握拳** → 气流聚焦收缩
6. ↔️ **左右移动手** → 旋转赛车
7. 🚫 **手离开画面** → 赛车自动缓慢旋转

---

## Run Locally

**需要 Node.js**

```bash
npm install
npm run dev
```

浏览器打开后点击 Initialize System 并允许摄像头即可。
