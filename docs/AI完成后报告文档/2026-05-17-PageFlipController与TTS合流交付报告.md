# 2026-05-17 — PageFlipController 与 TTS 合流交付报告

> 文档日期：2026-05-17
> 关联 spec：`.kiro/specs/wechat-jjwxc-parity-upgrade/`
> 关联任务：18.1、18.2、22.1、22.2、22.3、22.4

## 完成了什么

把 ReadingPage 阅读核心从两块"占位 + 真实"混杂逻辑收敛到两条干净的合流：

1. **翻页方式**（Requirements 3）：新增 `PageFlipController.vue` 包裹阅读区，
   - tap 模式渲染绝对定位的三段式 overlay（`data-pageflip-zone="prev|toggle|next"`）；
   - swipe 模式监听 touchstart / touchend，几何判定全部委托给已通过 PBT 的 `decideAction`；
   - 翻页过渡使用 200ms opacity-only Transition，不动 scrollTop；
   - 边缘 12px / 垂直分量 / 时长上限统一由 `decideAction` 守卫。
   ReadingPage 把原直接调用 `usePageFlip(...)` 的写法替换为 `<PageFlipController :mode="settings.pageFlipMode" @prev / @next / @toggle>`，SettingPanel 中的"翻页方式"下拉沿用既有 `useReadingSettings.pageFlipMode`，变更 < 200ms 内反映到正文渲染。

2. **TTS 听书**（Requirements 8）：新增 `useTTS` composable 把 `window.speechSynthesis` 的全部副作用收口：
   - `getVoices()` 为空 → `supported=false` / `onUnsupported` 触发一次 / `start()` no-op；
   - 每段 `SpeechSynthesisUtterance` 在 `onend` 推进 `currentIndex`，越界则触发 `onFinish`；
   - 自动 `visibilitychange=hidden` 暂停、`visible` 恢复（仅恢复"暂停前在播"的会话）；
   - `onBeforeUnmount` / `stop()` 调用 `speechSynthesis.cancel()`。
   `TTSControlBar.vue` 升级为纯展示组件，新增 0.5 / 0.75 / 1.0 / 1.25 / 1.5 / 1.75 / 2.0 速度下拉与音色下拉（≤ 0 个可用音色时音色下拉整体不渲染）。
   ReadingPage 通过 `useTTS({ paragraphs: content, onIndexChange, onFinish, onUnsupported })` 接入：
   - `onIndexChange(idx)` 触发段落 scrollIntoView 并通过 `data-tts-active` 属性 + `tts-active` class 高亮；
   - `onFinish()` 在还有下一章时调用 `loadNextChapterForTts()` 自动续读，否则关闭控制条（按 Requirement 8.5 处理"未读完任何一段"分支）。

3. **测试**：新增 `src/composables/__tests__/useTTS.test.js`，4 用例覆盖
   - 不支持分支（getVoices=空 → onUnsupported=1 / start=no-op）；
   - 正常 start(0) → 推入 utterance 0 / `onend` 推进 currentIndex 到 1；
   - 末段 `onend` → onFinish=1；
   - 卸载 → `speechSynthesis.cancel()` 被调用。

## 涉及的文件列表

新建：

- `ai-xsread-vue3/src/components/reading/PageFlipController.vue`
- `ai-xsread-vue3/src/composables/useTTS.js`
- `ai-xsread-vue3/src/composables/__tests__/useTTS.test.js`

修改：

- `ai-xsread-vue3/src/components/reading/TTSControlBar.vue`（新增速度 / 音色下拉、emits 扩展）
- `ai-xsread-vue3/src/views/ReadingPage.vue`（接入 PageFlipController 与 useTTS，移除内联 `tts.value = {}` 与 `speechSynthesis` 调用）
- `.kiro/specs/wechat-jjwxc-parity-upgrade/tasks.md`（18 / 18.1 / 18.2 / 22 / 22.1 / 22.2 / 22.3 / 22.4 全部标记为 `[x]`）

未改动（按约束）：

- `usePageFlip.js`（保持 `decideAction` 与 `usePageFlip(targetRef, settings, handlers)` 既有签名，PBT 测试继续通过）；
- `NoteSheet.vue` / `HotNotesSection.vue` / `FollowAuthorButton.vue` / `useFollowAuthor.js`；
- 所有 `backend/` 内代码 / `recommendationService` / `commentController` / `RegisterPage`。

## 测试结果

```
PS E:\...> npm run test

 Test Files  21 passed (21)
      Tests  96 passed (96)
   Duration  9.25s
```

新增的 useTTS 单测在隔离的 vitest 跑也是 4/4 绿（`Tests 4 passed`）。

`npm run build` 在 4.15s 内完成 176 个模块 transform，未出现编译告警。

## 已知问题

- `useTTS` 只在 `getVoices()` **同步**返回空数组时跳过启动；Chrome / Edge 在首次访问时需要异步等 `voiceschanged` 事件，这里通过 `synth.addEventListener('voiceschanged', refreshVoices)` 兜底，但首次 start 仍可能误判 unsupported；建议后续把"启动延迟到 voices 就绪"作为 follow-up（不在本次 spec 范围内）。
- `ttsHighlightTimer` 目前没有真正复位 `ttsHighlightIndex`，依赖 CSS 渐隐；在切到下一段时 `onIndexChange` 会立刻覆盖为新 index，行为正确，但后续如果想严格"高亮 ≤ 300ms 淡出"可以换 CSS animation。

## 后续建议

1. 在 `data-tts-active` 上叠加一个 300ms `@keyframes fadeOut`，把"高亮淡出"从代码 timer 改为 CSS。
2. 等管理后端 `recommendationService` 收尾后，把 `loadNextChapterForTts` 里的 `loadChapter` 调用改成走全局 router push，保留 `back/forward` 行为。
3. 把 `useTTS` 的 voiceschanged 监听挂在 composable 之外的全局单例上，避免多个 ReadingPage 实例（虽然不会同时存在）潜在重复绑定。
