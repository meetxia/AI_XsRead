# Requirements Document

> 中文标题：微信读书 / 晋江对标升级
> 文档日期：2026-05-17
> Spec 名称：wechat-jjwxc-parity-upgrade
> 类型：Feature（新功能 / 体验补全）

## Introduction

"文字之境"（AI-XsRead）目前已上线 v1.0：用户端基于 Vue 3 + Vite + TailwindCSS + Pinia，后端基于 Express + MySQL，已经实现了基础的小说浏览、章节阅读、书架、登录注册、评论、推荐位等能力。但作为一个面向**女性向重度小说读者**的迁移目标，与微信读书 / 晋江文学城仍存在显著体验差距：阅读页大量按钮"看上去能点但点了没反应"、详情页与个人中心存在大量原型期遗留的硬编码假数据、阅读进度仅同步到"章节 + 滚动百分比"精度、缺少划线 / 想法 / 段评 / 听书 / 段落锚点等核心差异化能力。

本次升级的目标是：在 4 周窗口内完成 **P0 急救 + P1（A/B/C）共 26 项任务**，让产品达到"晋江老粉、微信读书重度读者愿意把它作为主用阅读 App"的体验门槛。本次升级的目标用户画像为：女性向小说重度读者（晋江 / 微信读书使用 ≥ 2 年），日均阅读时长 ≥ 60 分钟，重度依赖书架、阅读进度同步、划线 / 想法 / 段评、关注作者更新等能力，对"阅读时被广告、卡顿、动效打断"零容忍。

详细的体验对标分析、任务清单、依赖关系与执行节奏，请参考 `docs/项目总文档/2026-05-17-用户体验对标微信读书晋江-优化计划清单.md`。本 spec 即是该计划清单的需求化结构化版本。

## 范围对照

本 spec 覆盖计划清单中的以下批次（P2 锦上添花部分**不在本 spec 范围内**）：

- **P0 急救批（8 项）**：修复"看上去能点但点了没反应"的所有按钮、清理硬编码假数据、章节抽屉接入、进度同步 TODO 补完。
- **P1-A 阅读体验补全（7 项）**：翻页方式、段落级位置同步、阅读时长心跳上报、屏幕常亮、阅读设置统一、TTS 听书、字体 / 段距 / 页边距 / 亮度。
- **P1-B 内容 & 社区差异化（6 项）**：划线、想法 / 笔记、段评、关注作者真落库 + 更新红点、勋章墙、作者其他作品 / 同标签好书。
- **P1-C 发现 & 推荐升级（5 项）**：首页分榜、搜索筛选面板、typeahead 实时建议、推荐算法升级、书架增强。

文中所有 Requirement 的 Acceptance Criteria 严格使用 EARS 句式（WHERE / WHILE / WHEN / IF / THEN / THE / SHALL 关键字大写）。

## Glossary

- **System / 系统**：在本文档中未做特别限定时，指"文字之境"前后端整体（Vue 用户前端 + Express 用户后端 + MySQL 数据库）。
- **Reader_Frontend / 阅读前端**：`ai-xsread-vue3/` 中的 Vue 3 用户前端。
- **Reader_Backend / 阅读后端**：`backend/` 中的 Express + MySQL2 用户后端。
- **Reading_Page / 阅读页**：`ai-xsread-vue3/src/views/ReadingPage.vue` 渲染的章节正文阅读页面。
- **Novel_Detail_Page / 详情页**：`ai-xsread-vue3/src/views/NovelDetailPage.vue` 渲染的小说详情页面。
- **Profile_Page / 个人中心**：`ai-xsread-vue3/src/views/ProfilePage.vue` 渲染的用户个人中心页面。
- **Bookshelf_Page / 书架页**：`ai-xsread-vue3/src/views/BookshelfPage.vue` 渲染的书架页面。
- **Home_Page / 首页**：`ai-xsread-vue3/src/views/HomePage.vue` 渲染的发现首页。
- **Search_Page / 搜索页**：`ai-xsread-vue3/src/views/SearchPage.vue` 渲染的搜索页。
- **段落锚点（Paragraph_Anchor）**：定位章节内某一段落的稳定坐标，由三元组 `(chapterId, paragraphIndex, paragraphHash)` 构成，其中 `paragraphHash` 为该段首 50 个字符的稳定 hash（推荐 SHA-1 前 16 位 hex）。当章节正文修订导致 `paragraphIndex` 漂移时，系统通过 `paragraphHash` 在新的章节正文中回找最近匹配的段落以恢复定位。
- **续读章节（Continue_Chapter）**：当前用户在某本小说上一次阅读到的章节，由 `reading_progress.chapter_id` 解析得到，对应章节标题用于 Home_Page 与 Novel_Detail_Page 的"续读 · {chapter_title}"按钮。
- **划线（Highlight）**：用户在章节正文中使用 Selection API 选中一段文字后，通过工具菜单选择颜色（黄 / 绿 / 红）保存的标记，其位置由 `(chapterId, paragraphIndex, paragraphHash, startOffset, endOffset)` 五元组确定。
- **想法（Note）**：用户在创建划线时附带的文字内容，与划线共用同一条记录的 `note` 字段；可单独在"我的想法"列表中按时间倒序查看。
- **段评（Paragraph_Comment）**：用户对章节内某一段落发表的评论，与划线 / 想法解耦但共用 Paragraph_Anchor 定位；段评气泡显示在该段落右侧，点击后展开评论抽屉。
- **书签（Bookmark）**：用户在阅读时主动保存的位置标记，由 Paragraph_Anchor + 可选 `note` 文字构成，与划线的区别在于"书签是位置标记，划线是文字标记"。
- **关注作者（Follow_Author）**：用户对某作者建立的关注关系，落库到 `user_follow_authors` 表，关注后该作者的新章节会触发"关注更新红点"。
- **关注更新红点（Unread_Update_Badge）**：当用户关注的作者发布新章节、且新章节的 `chapter_id > bookshelf.last_seen_chapter_id` 时，在 Bookshelf_Page 中该作品封面右上角显示的红点提示。
- **冷启动（Cold_Start）**：新注册用户在没有任何历史阅读、点赞、收藏行为时，推荐系统通过用户在注册流程中选择的"3 个兴趣标签"为其生成首批推荐。
- **心跳上报（Heartbeat）**：阅读页在用户活跃阅读期间，每 60 秒向后端发送一次 `POST /api/user/reading-progress`（携带 `duration: 60`）以累加阅读时长；当页面 `visibilitychange` 进入隐藏态或窗口失焦时立即停止心跳，恢复活跃后重新启动。
- **互动质量分（Interaction_Quality_Score）**：评论 / 想法 / 段评的默认排序分值，由 `点赞数 + 回复数 × 2 + min(content_length / 50, 5)` 加权得到，用以替代纯赞数排序，避免争议性热度被过度放大。
- **EARS 句式**：六种结构化需求模式（Ubiquitous / Event-driven / State-driven / Unwanted-event / Optional / Complex），见 README 与 INCOSE。本文档所有 Acceptance Criteria 严格遵循。

## 用户角色与场景

本 spec 主要服务以下 4 类用户角色：

1. **普通读者（Casual_Reader）**：每日打开 1 ~ 2 次 App，每次阅读 15 ~ 30 分钟，主要场景为"通勤期间断点续读"。核心诉求：续读按钮显示真实章节名、跨设备进度同步、阅读页所有按钮"点了有反应"。覆盖 P0 全部、P1-A-1/2/3/4。
2. **深度笔记型读者（Note_Taker）**：习惯在阅读时大量划线、写想法、看段评，把阅读笔记当作"长期资产"，是从微信读书迁移过来时阻力最大的一类。核心诉求：划线、想法、段评、个人中心"我的想法"列表。覆盖 P1-B-1/2/3。
3. **追更型读者（Follow_Reader）**：关注若干作者，等待新章节更新，习惯性查看书架红点。核心诉求：关注作者落库、书架封面红点、作者其他作品 / 同标签好书推荐、勋章墙仪式感。覆盖 P1-B-4/5/6、P1-C-5。
4. **新用户冷启动（New_User）**：首次注册，没有历史行为，需要被快速带入兴趣分发循环。核心诉求：注册时选 3 个标签、首页分榜、搜索筛选与 typeahead、推荐算法基于标签 + 时长 + 协同过滤。覆盖 P1-C-1/2/3/4 与 Cold_Start。

## Requirements

需求按 9 个业务模块组织（模块一 ~ 模块九），每个 Requirement 在全文中编号连续（1 ~ 37），可在后续 design / tasks 阶段直接以 "Requirement N" 形式引用。

### 模块一：阅读器核心体验

涵盖阅读页（Reading_Page）从"占位 UI"升级到"真正可用"所需的所有需求：书签、章节抽屉、翻页方式、段落级位置同步、心跳上报、屏幕常亮、阅读设置统一、TTS 听书、字体 / 段距 / 页边距 / 亮度。

### Requirement 1: 阅读页书签的创建、查看与删除

**User Story:** As a 普通读者, I want 在阅读时把当前段落保存为书签并能在切设备 / 重启后恢复, so that 我能随时回到任意一处停读位置而不只依赖一个进度。

#### Acceptance Criteria

1. WHEN 用户在 Reading_Page 点击底部工具栏的"书签"按钮，THE Reader_Frontend SHALL 以当前屏幕中心可视段落的 Paragraph_Anchor 创建一条书签，并在 200ms 内显示"已加书签"toast。
2. WHEN 用户长按 Reading_Page 底部工具栏的"书签"按钮 ≥ 500ms，THE Reader_Frontend SHALL 弹出"我的书签"列表抽屉，按 `created_at DESC` 显示该用户在当前小说下的全部书签条目，每条包含章节标题、段首前 30 字预览、创建时间。
3. WHEN 用户在"我的书签"抽屉中点击任一条目，THE Reader_Frontend SHALL 跳转到该书签所在章节并将页面滚动到对应段落（误差 ≤ 一行行高）。
4. WHEN 用户在"我的书签"抽屉中点击某条目右侧的删除按钮并确认，THE Reader_Backend SHALL 物理删除该条 `user_bookmarks` 记录，并在响应成功后从前端列表移除。
5. IF 当前用户未登录，THEN THE Reader_Frontend SHALL 在用户点击"书签"按钮时跳转到登录页并将 `returnUrl` 设为当前阅读页 URL。
6. WHEN 当前段落已存在书签，THE Reader_Frontend SHALL 在工具栏的书签图标上显示"已加"激活态（实色填充），点击则改为"删除当前段落书签"行为。

### Requirement 2: 章节抽屉接入与按需分页加载

**User Story:** As a 追更型读者, I want 在阅读 2000 章长文时打开目录不卡顿、能搜章节, so that 我能快速跳到"大结局"或某个关键剧情章。

#### Acceptance Criteria

1. WHEN 用户在 Reading_Page 点击底部工具栏"目录"按钮，THE Reader_Frontend SHALL 打开 ChapterDrawer 组件而非跳转回 Novel_Detail_Page。
2. THE ChapterDrawer SHALL 按需分页拉取章节列表，单页大小为 50，初次打开仅请求第 1 页。
3. WHILE 用户在 ChapterDrawer 内向下滚动至距底部 ≤ 200px，THE ChapterDrawer SHALL 自动加载下一页章节，加载期间显示骨架占位。
4. THE ChapterDrawer SHALL 在顶部提供章节搜索输入框，输入后按章节标题前缀匹配，匹配过程在前端已加载范围内本地执行，未加载范围由 `GET /api/novels/:novelId/chapters?keyword=` 后端兜底搜索。
5. WHEN 用户在 ChapterDrawer 中点击任一章节，THE Reader_Frontend SHALL 关闭抽屉、更新路由 `?chapter=` 参数，并在不刷新整页的前提下加载新章节内容。
6. IF 小说总章节数 ≥ 1000，THEN THE ChapterDrawer 在初次打开到首屏可交互的耗时 SHALL ≤ 800ms（在 Chrome DevTools "Fast 3G + 4× CPU 节流"下测量）。

### Requirement 3: 翻页方式（滚动 / 点击 / 滑动）

**User Story:** As a 普通读者, I want 选择我习惯的翻页方式（滚动 / 点击 / 滑动）, so that 阅读节奏与微信读书 / 晋江保持一致。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 在阅读设置面板提供"翻页方式"选项，可选值为 `scroll`（滚动）、`tap`（点击翻页）、`swipe`（左右滑动）。
2. WHERE `pageFlipMode = scroll`，THE Reader_Frontend SHALL 保持当前的纵向滚动行为；屏幕中央 1/3 区域单击切换工具栏显隐。
3. WHERE `pageFlipMode = tap`，THE Reader_Frontend SHALL 把屏幕宽度分为左 1/3、中 1/3、右 1/3 三个点击区，点击左区上一页、点击右区下一页、点击中区切换工具栏显隐；翻页时使用渐隐过渡（≤ 200ms）。
4. WHERE `pageFlipMode = swipe`，THE Reader_Frontend SHALL 接入 `useGestures` 的 `swipeLeft / swipeRight`，水平滑动距离 ≥ 50px 且时长 ≤ 300ms 时分别触发下一页 / 上一页；垂直方向滑动不应触发翻页。IF 单次手势的垂直位移绝对值 > 0px，THEN THE Reader_Frontend SHALL 不触发翻页（整个手势被忽略）。
5. WHERE `pageFlipMode ∈ {scroll, tap}`，THE Reader_Frontend SHALL 仍然识别水平滑动手势作为便捷翻页（行为与 swipe 模式一致），但中区单击的工具栏切换行为保持不变。
6. THE Reader_Frontend SHALL 把用户的 `pageFlipMode` 选择持久化到 `localStorage` 并在 ≤ 300ms 内立刻生效，无需刷新页面。
7. WHEN 翻页方式为 `tap` 或 `swipe`，THE Reader_Frontend SHALL 在翻页时不改变浏览器原生滚动条位置（避免与系统手势 / 浏览器后退手势冲突）。

### Requirement 4: 段落级阅读位置同步

**User Story:** As a 普通读者, I want 在 A 设备读到第 3 章第 17 段第 42 字, B 设备打开自动定位到这一段而不只是章, so that 跨设备阅读不丢上下文。

#### Acceptance Criteria

1. WHILE 用户在 Reading_Page 滚动阅读，THE Reader_Frontend SHALL 通过 IntersectionObserver 持续追踪当前屏幕中心可视段落，得到 Paragraph_Anchor。
2. WHEN 当前可视段落发生变化（新段落进入屏幕中心持续 ≥ 1s），THE Reader_Frontend SHALL 把 `(novelId, chapterId, paragraphIndex, charOffset, paragraphHash, progress)` 节流（≤ 1 次 / 5s）上报到 `POST /api/user/reading-progress`。
3. THE Reader_Backend SHALL 在 `reading_progress` 表中存储 `paragraph_index INT, char_offset INT` 字段，并保留旧的 `progress`（章内滚动百分比）字段用于过渡期兼容。
4. WHEN 用户重新打开同一本小说，THE Reader_Frontend SHALL 调用 `GET /api/user/reading-progress/:novelId` 拉取最新进度，并在章节加载完成后通过 `scrollIntoView` 把对应段落滚动到屏幕中央。
5. IF 服务器返回的 `paragraphIndex` 在新章节正文中越界或对应段落的 `paragraphHash` 不匹配，THEN THE Reader_Frontend SHALL 按 `paragraphHash` 在新正文中线性回找首个匹配段落作为最终定位点；若仍未命中则回退到章节起始处。
6. WHEN 同时存在本地 `localStorage` 进度与服务器进度，THE Reader_Frontend SHALL 取 `updatedAt` 较新者作为最终生效进度，并把另一侧覆盖更新（保证两端最终一致）。
7. THE Reader_Frontend SHALL 在 Reading_Page 卸载（`onUnmounted`）时立即调用一次 `POST /api/user/reading-progress`，确保最后位置不丢失。

### Requirement 5: 阅读时长心跳上报

**User Story:** As a 普通读者, I want 我每天真实读了多久能被准确统计, so that 个人中心的"今日阅读 / 连读天数"是真实数字而不是占位。

#### Acceptance Criteria

1. WHILE 用户在 Reading_Page 处于活跃阅读态（页面 `document.visibilityState === 'visible'` 且窗口处于 focus），THE Reader_Frontend SHALL 每 60 秒触发一次 Heartbeat，向 `POST /api/user/reading-progress` 上报 `duration: 60`（单位：秒）。
2. WHEN 页面发生 `visibilitychange` 切换到隐藏态、或窗口 `blur`、或用户连续 ≥ 60 秒无任何 scroll / touch / click 输入，THE Reader_Frontend SHALL 立即停止心跳计时器。
3. WHEN 页面恢复 `visible` 且窗口重新 focus 且用户产生输入，THE Reader_Frontend SHALL 在 ≤ 5 秒内重新启动心跳。
4. THE Reader_Backend SHALL 在收到 `duration > 0` 的进度上报时，在 `reading_history.duration` 字段上做累加（`UPDATE reading_history SET duration = duration + ?`），单条 `reading_history` 的 `duration` 上限为 86400（防异常累加）。
5. IF 一次心跳的 `duration` 超过 120 秒（异常值，可能客户端时钟错乱），THEN THE Reader_Backend SHALL 把该次累加值限制为 60 秒并在服务端日志中记录 `WARN`。
6. THE Reader_Frontend SHALL 在 Reading_Page 卸载时把当前未上报的累计 `duration`（不足 60 秒的尾巴）一次性发出。

### Requirement 6: 屏幕常亮与沉浸阅读

**User Story:** As a 深度笔记型读者, I want 阅读期间屏幕不自动锁屏, so that 长段阅读不被打断。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 在阅读设置面板提供"阅读时保持屏幕常亮"开关，默认关闭。
2. WHERE 用户开启"屏幕常亮"且当前浏览器支持 `navigator.wakeLock`，WHEN 用户进入 Reading_Page，THE Reader_Frontend SHALL 调用 `navigator.wakeLock.request('screen')` 申请屏幕唤醒锁。
3. WHEN 用户离开 Reading_Page（路由切换 / 关闭页面 / 切换 Tab 隐藏），THE Reader_Frontend SHALL 调用 `wakeLock.release()` 释放唤醒锁。
4. IF 当前浏览器不支持 `navigator.wakeLock`，THEN THE Reader_Frontend SHALL 在设置面板的开关下方显示一行灰色文案 "当前浏览器不支持，建议使用最新版 Chrome / Edge / Safari"，并禁用该开关。
5. WHEN `wakeLock` 因系统原因被自动释放（`wakeLock.onrelease` 触发），THE Reader_Frontend SHALL 在用户回到页面焦点时尝试一次自动重新申请。

### Requirement 7: 阅读设置统一与字号 / 行距 / 段距 / 页边距 / 亮度

**User Story:** As a 普通读者, I want 字号、行距、段距、页边距、字体、亮度一处设置全局生效, so that 不再有"两套设置互相覆盖"的怪异行为。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 删除 Reading_Page 内部 `xs-reading-prefs-v2` 的临时本地存储实现，统一使用 `useReadingSettings` composable 作为唯一阅读偏好来源。
2. THE Reader_Frontend SHALL 在阅读设置面板提供以下连续 / 离散控件，每项变更后在 ≤ 200ms 内反映到正文渲染：
   - 字号：12 ~ 28px，步长 1px，滑块控件；
   - 行距：1.4 / 1.6 / 1.8 / 2.0 / 2.2 五档；
   - 段距：紧凑 / 标准 / 疏朗 三档（对应段落 `margin-bottom` 0.5em / 1em / 1.5em）；
   - 页边距：窄 / 标准 / 宽 三档（对应正文容器 `padding-inline` 16 / 24 / 40px）；
   - 字体：默认 / 宋体 / 黑体 / 楷体 / 微软雅黑 五档；
   - 亮度：50% ~ 100%，步长 5%，通过覆盖一层半透明黑色蒙层模拟。
3. THE Reader_Frontend SHALL 把所有阅读偏好持久化到 `localStorage` 的 `reading-settings` key 下，并在登录用户场景下额外通过 `PUT /api/user/profile` 同步偏好（设计阶段可决定是否拆为独立接口）。
4. WHEN 用户在阅读设置面板点击"恢复默认"，THE Reader_Frontend SHALL 在 200ms 内重置所有偏好为出厂默认值，并立刻反映在正文渲染上。
5. THE Reader_Frontend SHALL 在阅读设置面板移除任何"占位但不工作"的开关（包括但不限于双套字体选项 / 重复的字号档位）。

### Requirement 8: TTS 朗读（听书）

**User Story:** As a 通勤场景下的读者, I want 在地铁 / 走路时让 App 朗读当前章节, so that 不需要盯着屏幕也能消化内容。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 在 Reading_Page 底部工具栏新增"听书"按钮，点击后启动基于 `window.speechSynthesis` 的朗读。
2. WHILE 朗读处于播放态，THE Reader_Frontend SHALL 在屏幕底部显示一条悬浮控制条，包含暂停 / 继续、上一段、下一段、关闭按钮，以及当前正在朗读段落的文字（最多 60 字省略）。
3. THE Reader_Frontend SHALL 在听书设置中提供朗读速度（0.5 / 0.75 / 1.0 / 1.25 / 1.5 / 1.75 / 2.0 倍）与朗读音色（男声 / 女声，根据 `speechSynthesis.getVoices()` 实际可用列表筛选）选项，变更后在下一段开始时生效。
4. WHILE 朗读进行中，THE Reader_Frontend SHALL 把当前朗读段落滚动到屏幕中央并以浅黄色背景临时高亮（一段朗读结束后高亮淡出 ≤ 300ms）。
5. WHEN 朗读读完当前章节最后一段，IF 该小说存在下一章，THEN THE Reader_Frontend SHALL 自动加载下一章并继续朗读；ELSE WHERE 用户在本次会话中至少已完成一段文字朗读，THE Reader_Frontend SHALL 关闭朗读控制条并显示"已读完全本"toast；IF 用户尚未完成任何一段文字朗读，THEN THE Reader_Frontend SHALL 仅关闭朗读控制条而不弹出"已读完全本"toast。
6. WHEN 用户切换路由离开 Reading_Page，THE Reader_Frontend SHALL 调用 `speechSynthesis.cancel()` 立即停止朗读。
7. IF 当前浏览器不支持 `window.speechSynthesis` 或 `getVoices()` 返回空数组，THEN THE Reader_Frontend SHALL 在用户点击"听书"按钮时显示兼容性 toast "当前浏览器暂不支持听书" 后立即结束本次启动流程，不显示控制条，且 SHALL 不再触发任何其他 toast（包括"已读完全本"toast）。


### 模块二：内容详情与续读

涵盖 Novel_Detail_Page 与 Home_Page 的"加书架 / 点赞 / 续读 / 假数据清理 / 同作者 / 同标签"等需求。

### Requirement 9: 详情页"加书架 / 点赞"按钮接通

**User Story:** As a 普通读者, I want 详情页的"加书架"和"点赞"按钮真的能用, so that 收藏的书在书架里能找到、点过的书能在"我的喜欢"里看到。

#### Acceptance Criteria

1. WHEN 用户在 Novel_Detail_Page 进入页面，THE Reader_Frontend SHALL 调用 `GET /api/novels/:id/status` 拉取当前用户对该小说的 `inBookshelf / liked` 初始状态，并在 ≤ 500ms 内反映到底部 CTA 条上的图标激活态。
2. WHEN 已登录用户点击"加书架"按钮且该书未在书架中，THE Reader_Frontend SHALL 调用 `POST /api/user/bookshelf` 添加，成功后图标切换为已加入态并显示 "已加入书架" toast。
3. WHEN 已登录用户点击"加书架"按钮且该书已在书架中，THE Reader_Frontend SHALL 调用 `DELETE /api/user/bookshelf/:novelId` 移除，成功后图标恢复未加入态并显示 "已从书架移除" toast。
4. WHEN 已登录用户点击"点赞"按钮且未点赞，THE Reader_Frontend SHALL 调用 `POST /api/novels/:id/like`，成功后心形图标切换为实色填充并把按钮上显示的点赞数 +1。
5. WHEN 已登录用户点击"点赞"按钮且已点赞，THE Reader_Frontend SHALL 调用 `DELETE /api/novels/:id/like`，成功后心形图标恢复线框并把点赞数 -1。
6. WHILE 任一接口请求处于 in-flight 状态，THE Reader_Frontend SHALL 在对应按钮上显示 loading 旋转图标并禁用重复点击。
7. IF 用户未登录，THEN THE Reader_Frontend SHALL 在用户点击"加书架"或"点赞"按钮时跳转到登录页，且 `returnUrl` 设为当前 Novel_Detail_Page URL。
8. IF 接口请求失败（HTTP 非 2xx 或 `code !== 200`），THEN THE Reader_Frontend SHALL 把按钮恢复到操作前的状态并显示 "操作失败，请稍后再试" toast。

### Requirement 10: 续读按钮显示真实章节名

**User Story:** As a 普通读者, I want 详情页和首页的"续读"按钮显示我真正读到的章节名, so that 我一眼能确认上次读到哪。

#### Acceptance Criteria

1. WHEN 用户在 Novel_Detail_Page 进入页面，THE Reader_Frontend SHALL 调用 `GET /api/user/reading-progress/:novelId` 获取该用户在该书的最新进度记录。
2. IF 进度记录存在且包含 `chapter_id`，THEN THE Reader_Frontend SHALL 解析对应章节标题，并把底部 CTA 按钮文案设为 "续读 · {chapter_title}"。
3. IF 进度记录不存在或 `chapter_id` 为 `null`，THEN THE Reader_Frontend SHALL 把底部 CTA 按钮文案设为 "开始阅读"。
4. WHEN 用户在 Home_Page 看到"继续你的故事"卡片，THE Reader_Frontend SHALL 在卡片中显示真实的 `chapter_title` 而非占位字符串，并在副文案中显示"已读 X%"以及预计剩余阅读时长（按 350 字 / 分钟估算）。
5. WHEN 用户点击 Novel_Detail_Page 的"续读"按钮，THE Reader_Frontend SHALL 跳转到 `/reading/:novelId?chapter={chapter_id}`，并在跳转后由 Reading_Page 按 Requirement 4 的段落级定位逻辑回到上次段落。

### Requirement 11: 详情页假数据清理与空态展示

**User Story:** As a 产品方, I want 详情页所有"3,421 人评分""12.4 万在读""2.1k 点赞"等数字都来自真实接口, so that 用户不会发现"换一本书数字一模一样"的尴尬。

#### Acceptance Criteria

1. THE Novel_Detail_Page SHALL 移除以下硬编码字段：`authorFans = '12.3k'`、`readers = '12.4 万'`、`distribution = [78, 15, 5, 1, 1]`、底部 CTA 上的 "2.1k" 点赞数、"3,421 人评分"。
2. WHEN 用户进入 Novel_Detail_Page，THE Reader_Frontend SHALL 调用 `GET /api/novels/:id/rating` 获取真实评分分布（包括 `ratingCount` 与 5 / 4 / 3 / 2 / 1 星各档百分比）；接口返回的字段 SHALL 直接渲染。
3. IF 评分分布接口返回 `ratingCount === 0`，THEN THE Reader_Frontend SHALL 在评分模块同时显示空态文案 "本书暂无评分，成为第一个评分的人 →" 与五颗灰色未填充星星 + 五条 0% 占位条（用于呈现"星条 UI"骨架），且 THE 空态按钮 SHALL 跳转至评分入口。
4. THE Novel_Detail_Page SHALL 在显示在读人数 / 关注作者粉丝数 / 点赞数等字段时优先使用接口返回值；WHILE 接口响应尚未到达，THE 对应 UI 元素 SHALL 不渲染（不显示骨架屏占位、不显示"--"）；THE 对应 UI 元素 SHALL 仅在响应到达且字段非 `null` 时才出现；IF 响应到达但字段为 `null` 或未返回，THEN 该字段对应的 UI 元素 SHALL 仍不渲染（不显示硬编码值）。
5. WHEN 用户进入 Novel_Detail_Page，THE Reader_Frontend SHALL 通过 `GET /api/novels/:novelId/comments?page=1&pageSize=5` 拉取评论；IF 接口返回空列表，THEN 评论模块 SHALL 显示空态 "暂无书评，写下第一条想法"，并提供"写书评"按钮。

### Requirement 12: 作者其他作品与同标签好书

**User Story:** As a 追更型读者, I want 详情页能看到这位作者的其他作品和同标签的好书, so that 一本看完不用费劲找下一本。

#### Acceptance Criteria

1. WHEN 用户在 Novel_Detail_Page 滚动到底部相关推荐区，THE Reader_Frontend SHALL 调用 `GET /api/authors/:authorId/novels?pageSize=6` 获取该作者其他作品（不含当前书），并以横向滑动卡片列表展示。
2. THE Reader_Backend `GET /api/novels` 接口 SHALL 增加 `tags` 查询参数，支持按主标签精确匹配（多个标签以逗号分隔，命中任一即返回）。
3. WHEN 当前书的 `tags` 字段非空，THE Reader_Frontend SHALL 调用 `GET /api/novels?tags={tags[0]}&pageSize=6&excludeId={当前 novelId}` 获取同标签好书，以横向滑动卡片列表展示在"同标签好书"区。
4. IF 当前书的 `author_id` 为 `null` 或作者只有当前一部作品，THEN "作者其他作品"区块 SHALL 整体不渲染。
5. IF 当前书的 `tags` 字段为空，THEN "同标签好书"区块 SHALL 整体不渲染。
6. WHEN 用户点击任一相关推荐卡片，THE Reader_Frontend SHALL 跳转到对应小说的 Novel_Detail_Page，并在跳转后重新触发本 Requirement 的所有数据拉取。

### Requirement 13: 首页"继续阅读"卡片接真实数据

**User Story:** As a 普通读者, I want 首页第一眼就能看到"我上次读到第 X 章 · 章节名 · 还剩 Y 分钟", so that 一打开 App 就能立刻续读。

#### Acceptance Criteria

1. WHEN 已登录用户进入 Home_Page，THE Reader_Frontend SHALL 调用 `GET /api/user/reading-history?page=1&pageSize=1` 获取最近一次的阅读记录。
2. IF 接口返回有效记录，THEN THE Home_Page "继续你的故事"卡片 SHALL 显示：
   - 小说标题、作者、分类（来自 join 出的 `novel`）；
   - "上次读到 第 N 章 · {chapter_title}"（chapter_title 来自 join 出的 `chapter`）；
   - 已读百分比；
   - 预计剩余阅读时长（按全书剩余字数 / 350 字每分钟计算）。
3. IF 接口返回空列表（用户尚未阅读任何小说），THEN THE Home_Page SHALL 不渲染"继续你的故事"卡片，改为显示"故事入境，杂念自消"欢迎区。
4. WHEN 用户未登录，THE Home_Page SHALL 不调用 `GET /api/user/reading-history`，直接渲染欢迎区与登录引导。


### 模块三：个人中心与统计

涵盖 Profile_Page 上书架数 / 连读 / 阅读时长 / 周柱图 / 勋章墙的真实化。

### Requirement 14: 个人中心阅读统计接真实接口

**User Story:** As a 普通读者, I want 个人中心顶部的"书架 32 / 连读 14 天 / 阅读 287h"是我自己的真实数据, so that 我能在数字上看到自己的成长。

#### Acceptance Criteria

1. THE Profile_Page SHALL 移除以下硬编码字段：`shelf: 32`、`streak: 14`、`hours: 287`、`joinDays: 287`、`weekData` 占位数组。
2. WHEN 已登录用户进入 Profile_Page，THE Reader_Frontend SHALL 调用 `GET /api/user/statistics` 获取统计数据，并把响应中的 `bookshelf.total / reading.readingStreak / readTime.total（秒）` 分别渲染到"书架 / 连读 / 阅读时长"三栏。
3. THE Reader_Frontend SHALL 把 `readTime.total`（秒）格式化为：< 60 分钟显示 `${分钟}m`；≥ 60 分钟显示 `${小时}h`（向下取整）。
4. THE Reader_Frontend SHALL 把 `readingTrend` 数组（最近 7 天阅读趋势）渲染为周柱状图，每根柱子高度按当周 `readTime` 的最大值归一化为百分比；柱子上方显示星期名（一 / 二 / … / 日），当天柱子用主色高亮。
5. IF `readingTrend` 为空数组，OR `readingTrend` 中所有 `readTime` 字段之和等于 0，THEN THE 周柱图区 SHALL 显示空态 "本周还没有阅读记录，去打开一本书吧 →"，按钮跳转到 Home_Page。
6. THE Reader_Frontend SHALL 把 `users.created_at` 与今天的天数差作为 "加入 N 天" 文案，而非硬编码 287。

### Requirement 15: 勋章墙

**User Story:** As a 追更型读者, I want 看到我已经解锁了哪些勋章、还有哪些可解锁, so that 阅读这件事变得有目标感。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 新建 `views/AchievementsPage.vue` 页面，并在 Profile_Page 提供入口"我的勋章"；THE 入口 SHALL 在功能上线后对所有登录用户无条件可见，不依赖任何系统状态（如成就解锁数量、阅读天数、设备类型等）。
2. WHEN 用户进入 AchievementsPage，THE Reader_Frontend SHALL 调用 `GET /api/user/achievements` 拉取全部 16 条成就规则的当前进度，并按响应中的 `category`（reading / bookshelf / habit / milestone）分组渲染。
3. THE AchievementsPage SHALL 把成就分为"已解锁"和"未解锁"两区，已解锁区按 `unlockedAt DESC` 排序，未解锁区按完成度（`currentValue / threshold`）降序排序。
4. THE AchievementsPage SHALL 为每个未解锁成就显示一条进度条（`min(currentValue / threshold, 1) × 100%`）以及 "X / Y" 数字标签。
5. WHEN 用户在阅读 / 加书架 / 完结一本书等行为后再次进入 AchievementsPage 且检测到新解锁成就，THE Reader_Frontend SHALL 在 ≤ 1.5s 内播放一次"撒花 + 短 toast"动效（动画总时长 ≤ 1.5s，仅播放一次后淡出）。
6. WHILE 用户处于 Reading_Page，THE Reader_Frontend SHALL 不主动检查或弹出勋章解锁动画（避免打断阅读）；仅在用户离开 Reading_Page 后或下次进入 AchievementsPage 时回放。
7. THE 勋章解锁动效 SHALL 不阻塞页面交互（动画期间用户依然可以点击其他按钮）。


### 模块四：首页与发现

涵盖首页分榜、搜索筛选面板、typeahead 实时建议、推荐算法升级、冷启动。

### Requirement 16: 首页分榜（按分类切换 Top 10）

**User Story:** As a 新用户冷启动, I want 在首页看到古言 / 现言 / 纯爱 / 悬疑 / 治愈 / 完结分别的 Top 10, so that 不需要先注册就能感受到内容池子。

#### Acceptance Criteria

1. THE Home_Page SHALL 在 Hero 区下方新增"分榜"区块，包含横向 Tab：古言、现言、纯爱、悬疑、治愈、完结。
2. WHEN 用户首次进入 Home_Page，THE Reader_Frontend SHALL 默认选中第一个 Tab 并调用 `GET /api/novels?categoryId={id}&sortBy=views&order=DESC&pageSize=10` 拉取该榜 Top 10。
3. WHEN 用户点击其它 Tab，THE Reader_Frontend SHALL 在 ≤ 300ms 内切换内容并触发对应分类的请求；同一会话内已加载的 Tab 数据 SHALL 命中前端缓存（5 分钟内不重复请求）。
4. THE 分榜区块 SHALL 在每个榜单底部提供 "完整榜单 →" 链接，跳转到 `/recommend?categoryId={id}&sortBy=views`。
5. WHERE Tab 为"完结"，THE Reader_Frontend SHALL 在请求参数中仅追加 `status=finished`，不附带 `categoryId`，使该榜横跨所有分类的完结作品；WHERE Tab 为非完结分类（古言 / 现言 / 纯爱 / 悬疑 / 治愈），THE Reader_Frontend SHALL 在请求参数中使用 `categoryId` 而不附带 `status=finished`。
6. IF 某个分类的 Top 10 接口返回空列表，THEN 该 Tab 内容区 SHALL 显示 "本榜单暂无内容" 空态。

### Requirement 17: 搜索筛选面板

**User Story:** As a 追更型读者, I want 搜索时能按状态、字数、评分、排序方式筛选, so that 我能精确找到"完结 + 100 万字 + 评分 ≥ 9"这种长文。

#### Acceptance Criteria

1. THE Search_Page SHALL 在搜索结果列表上方新增筛选条，包含：状态（全部 / 连载中 / 完结）、字数（全部 / 10 万 + / 50 万 + / 100 万 +）、评分（全部 / ≥ 8 / ≥ 9）、排序（综合 / 最新更新 / 字数）。
2. THE Reader_Backend `GET /api/novels` 与 `GET /api/novels/search` SHALL 增加查询参数：`wordCountMin INT, wordCountMax INT, ratingMin DECIMAL(2,1), hasFinished BOOLEAN, sortBy ENUM('default','updated_at','word_count')`。
3. WHEN 用户在筛选条上变更任一项，THE Search_Page SHALL 在 ≤ 300ms 内重新拉取数据，且 URL `query` 参数同步更新（便于复制链接 / 回退）。
4. THE Search_Page SHALL 在筛选条右侧显示 "重置" 按钮，点击后把所有筛选项恢复为 "全部 / 综合"。
5. IF 当前筛选组合在数据库中无任何匹配，THEN THE Search_Page SHALL 显示空态 "没有符合条件的小说，试试放宽筛选 →"，并提供一键"重置筛选"按钮。
6. THE Search_Page SHALL 把筛选条视为已生效，无论筛选项是否处于默认值（即筛选条 UI 出现即视为满足"已提供筛选"的条件，不要求用户必须先选中非默认值才算生效）。

### Requirement 18: typeahead 实时搜索建议

**User Story:** As a 普通读者, I want 在搜索框打"山"时立刻看到"山有木兮""山月不知心底事"这样的下拉提示, so that 我不用打完整本书名。

#### Acceptance Criteria

1. THE Search_Page SHALL 把当前的纯 input 替换为 `EnhancedSearchBar` 组件，提供下拉建议层。
2. WHILE 用户在搜索框输入字符，THE Search_Page SHALL 以 200ms debounce 触发 `GET /api/novels/search/suggestions?keyword=` 请求，并把响应作为下拉建议渲染。
3. THE 下拉建议层 SHALL 在每条建议中把命中关键词以主色高亮（`<mark>` 或 CSS class）。
4. WHILE 下拉建议层处于打开状态，THE Search_Page SHALL 支持键盘 ↑ / ↓ 导航高亮项、Enter 直接进入对应小说详情、Esc 关闭下拉。
5. THE 下拉建议层 SHALL 一次最多显示 8 条建议，超出部分由后端按热度截断。
6. IF 关键词长度 < 1 或当前请求 in-flight，THEN 下拉建议层 SHALL 不显示新数据（避免闪烁）。
7. WHEN 用户清空输入框，THE 下拉建议层 SHALL 立即关闭。

### Requirement 19: 推荐算法升级（标签 + 时长 + 协同过滤 + 冷启动）

**User Story:** As a 新用户冷启动, I want 我选了 3 个标签后，首页给我的推荐就是这些标签下评分最高的小说; 老用户希望"看过 X 的人也看了"也能命中, so that 找文不再依赖纯热度榜。

#### Acceptance Criteria

1. THE Reader_Backend `novelService.getRecommendNovels` SHALL 接收 `userId`（来自认证态）作为可选参数，并在响应中按以下加权打分排序：
   - **标签相似度（权重 0.4）**：候选书的 `tags` 与该用户最近 30 天 `bookshelf + reading_history` 中所有书的 tag 集合的 Jaccard 相似度；
   - **阅读时长权重（权重 0.3）**：候选书所属分类，在该用户 `reading_history.duration` 上的累计占比越高，得分越高；
   - **协同过滤（权重 0.2）**：找出"也读过用户最近一本书的"其他用户集合，统计这些用户在过去 30 天内最常读的 Top N（取交集前 50 名）；
   - **新鲜度（权重 0.1）**：`updated_at` 越近得分越高（时间衰减半衰期 30 天）。
2. WHEN 用户为新注册（`reading_history` 与 `bookshelf` 均为空），THE 推荐 SHALL 退化为冷启动模式：仅按用户在注册流程中选择的 `user_interest_tags` 与该 tag 下评分降序拉取前 20 本。
3. THE 注册流程（前端 `RegisterPage` 或注册成功后引导步骤）SHALL 提供"选择 3 个你感兴趣的标签"步骤，标签来自 `categories` 与全站高频 tag 词汇表，用户选择 ≥ 1 个即可继续。
4. WHEN 用户在冷启动选择标签后，THE Reader_Backend SHALL 把选择写入 `user_interest_tags(user_id, tag, weight, created_at)` 表（每条记录的 `weight` 默认为 1.0）。
5. THE Reader_Backend `getRecommendNovels` 接口 SHALL 在 ≤ 500ms 内返回（在 35 部种子书规模下，使用 SQL + 内存计算即可达成；超过 5000 部时 SHALL 引入离线计算 / 缓存，由 design 阶段定）。
6. WHERE 用户已登录但当月活跃度低（30 天内 `reading_history` 记录 < 3 条），THE 推荐 SHALL 把"协同过滤"权重降为 0、"标签相似度"权重提升为 0.6，避免老数据失真。
7. IF 候选集去重后不足 10 本，THEN THE Reader_Backend SHALL 用全站评分 Top N 兜底补足到 10 本。

### Requirement 20: 冷启动兴趣标签选择步骤

**User Story:** As a 新用户冷启动, I want 注册成功后被引导选 3 个我感兴趣的标签, so that 第一屏推荐就贴合我的口味。

#### Acceptance Criteria

1. WHEN 用户完成注册（`POST /api/auth/register` 返回 200），THE Reader_Frontend SHALL 跳转到 `/onboarding/interests` 而非直接跳到 Home_Page。
2. THE OnboardingInterestsPage SHALL 展示至少 30 个候选标签（包含 categories 表中的全部分类 + 至少 20 个高频 tag），以矩形 chip 形式显示，每个 chip 在选中时显示主色背景。
3. THE OnboardingInterestsPage SHALL 在用户选中第 1 个 chip 后启用底部"开启阅读"按钮，并实时显示 "已选 N / 建议 ≥ 3"。
4. WHEN 用户点击"开启阅读"，THE Reader_Frontend SHALL 调用 `POST /api/user/interest-tags`（body 为选中 tag 数组）写入后端，成功后跳转到 Home_Page。
5. WHILE 用户仍在 OnboardingInterestsPage，THE 页面 SHALL 提供"跳过"链接，点击后直接跳到 Home_Page 但不写入任何标签（推荐降级为全站 Top）。
6. WHEN 用户已写入兴趣标签，THE Reader_Frontend SHALL 在下次登录后不再跳转到 OnboardingInterestsPage（基于 `users` 是否存在 `user_interest_tags` 记录判断）。


### 模块五：书架管理

涵盖想读 Tab、分组、批量、排序、置顶、关注作者更新红点。

### Requirement 21: 书架"想读"Tab 与状态枚举扩展

**User Story:** As a 追更型读者, I want 把"暂时不开读但想留着"的书放到独立的"想读"Tab, so that 不与"在读 / 已读"混在一起。

#### Acceptance Criteria

1. THE `bookshelf.type` 枚举字段 SHALL 在现有 `reading / finished / collected` 基础上新增取值 `wishlist`（想读）。
2. THE Bookshelf_Page SHALL 在 Tabs 中新增"想读"项，位置位于"已读"右侧，counter 显示该 Tab 下书籍数量。
3. WHEN 用户在 Novel_Detail_Page 的"加书架"按钮上长按（或在加书架弹层中选择"加入想读"），THE Reader_Frontend SHALL 调用 `POST /api/user/bookshelf` 时传入 `type: 'wishlist'`。
4. WHEN 用户在 Bookshelf_Page 选中"想读"Tab 下任一书并点击"开始阅读"，THE Reader_Backend SHALL 自动把该 `bookshelf.type` 从 `wishlist` 切换为 `reading`。
5. THE Bookshelf_Page 的"在读 / 已读"统计 SHALL 把 `wishlist` 排除在外。

### Requirement 22: 书架分组、批量与排序

**User Story:** As a 深度笔记型读者, I want 把我书架里的书按"古言 / 玄幻 / 经典"分组并批量管理, so that 200 本书的书架不至于一团乱。

#### Acceptance Criteria

1. THE `bookshelf` 表 SHALL 新增字段 `group_name VARCHAR(50) NULL` 与 `is_top TINYINT(1) NOT NULL DEFAULT 0`。
2. THE Bookshelf_Page SHALL 在顶部提供"分组"下拉，包含 "全部 / 默认 / 已建组名 / + 新建分组" 选项；选择某分组后仅显示 `group_name = ?` 的书。
3. WHEN 用户在 Bookshelf_Page 进入"批量管理"模式，THE 视图 SHALL 在每本书封面左上角显示选择框，底部显示批量操作条："移动到分组 / 删除 / 取消置顶 / 置顶"。
4. WHEN 用户在批量管理模式下选中 ≥ 1 本并点击"删除"，THE Reader_Frontend SHALL 调用 `POST /api/user/bookshelf/batch`（`{ action: 'delete', ids: [...] }`），成功后从列表中移除并退出批量模式。
5. WHEN 用户在批量管理模式下选中 ≥ 1 本并点击"移动到分组"，THE Reader_Frontend SHALL 调用 `POST /api/user/bookshelf/batch`（`{ action: 'group', ids: [...], groupName: 'X' }`），成功后刷新列表。
6. THE Reader_Backend `POST /api/user/bookshelf/batch` SHALL 至少支持 `action ∈ {'delete', 'group', 'top', 'untop'}` 四种操作。
7. THE Bookshelf_Page SHALL 提供排序下拉："最近阅读 / 最近更新 / 加入时间 / 标题字母序"。排序请求 SHALL 由前端拼装到 `GET /api/user/bookshelf?sortBy=` 中。
8. WHERE `is_top = 1` 的书，THE Bookshelf_Page SHALL 在排序结果之前固定显示，并在封面右上角显示置顶图标。

### Requirement 23: 关注作者真落库

**User Story:** As a 追更型读者, I want 我点"关注作者"真的落进数据库, so that 跨设备和重新登录后还在关注列表里。

#### Acceptance Criteria

1. THE `user_follow_authors` 表 SHALL 至少包含字段 `(id, user_id, author_id, created_at, UNIQUE KEY (user_id, author_id))`，已有迁移文件中的同名表 SHALL 启用并加入启动 migrate。
2. WHEN 已登录用户在 Novel_Detail_Page 或作者主页点击"关注作者"按钮且尚未关注，THE Reader_Backend `POST /api/authors/:authorId/follow` SHALL 在 `user_follow_authors` 中插入一条记录并返回 `{ following: true }`。
3. WHEN 已登录用户点击"已关注"按钮，THE Reader_Backend `DELETE /api/authors/:authorId/follow` SHALL 从 `user_follow_authors` 中删除对应记录并返回 `{ following: false }`。
4. WHEN 用户进入 Novel_Detail_Page 或作者主页，THE Reader_Frontend SHALL 通过 `GET /api/authors/:authorId`（响应中包含 `isFollowing` 字段）确定按钮初始状态。
5. THE Profile_Page SHALL 新增"我关注的作者"区块，调用 `GET /api/user/following-authors` 拉取该用户关注的作者列表，每张作者卡片显示作者名、头像、最新作品标题、"X 天前更新"。
6. IF 用户未登录，THEN THE Reader_Frontend SHALL 在用户点击"关注作者"按钮时跳转到登录页并带 `returnUrl`。

### Requirement 24: 书架封面"关注更新"红点

**User Story:** As a 追更型读者, I want 书架里那本《山有木兮》出新章了，封面右上角立刻冒出红点, so that 我一眼就知道有新内容。

#### Acceptance Criteria

1. THE `bookshelf` 表 SHALL 新增字段 `last_seen_chapter_id INT NULL`，用于记录用户最近一次在 Reading_Page 阅读到的章节 id。
2. WHEN 用户在 Reading_Page 切换章节或保存进度，THE Reader_Backend SHALL 同步把 `bookshelf.last_seen_chapter_id` 更新为当前章节 id。
3. THE Reader_Backend `GET /api/user/bookshelf` 响应 SHALL 在每本书上附加 `hasUnreadUpdate: BOOLEAN` 字段，计算规则为：`novels.latest_chapter_id > bookshelf.last_seen_chapter_id`（其中 `latest_chapter_id` 由 `MAX(chapters.id) WHERE chapters.novel_id = novels.id` 实时聚合或在 `novels` 表上维护）。
4. WHERE `hasUnreadUpdate = true`，THE Bookshelf_Page SHALL 在该书封面右上角渲染一个直径 8px 的红色实心圆点（与"已读完"对勾互斥）。
5. WHEN 用户点击该书并进入 Reading_Page 浏览到新章节后，THE 红点 SHALL 在用户下次进入 Bookshelf_Page 时消失（基于刷新后的 `hasUnreadUpdate`）。
6. WHEN 用户为该书的作者已通过 `user_follow_authors` 关注，且该作者发布新作品，THE Profile_Page "我关注的作者" 区块对应作者卡片右上角 SHALL 同样显示红点。


### 模块六：划线 / 想法 / 段评（差异化战役）

涵盖 P1-B-1/2/3。本模块是迁移壁垒最高的一组功能，需求条目数量较多，关键 Requirement 包含 ≥ 5 条 Acceptance Criteria。

### Requirement 25: 划线（Highlight）

**User Story:** As a 深度笔记型读者, I want 选中正文中的一段文字标黄 / 标绿 / 标红, so that 这些段落变成我的长期笔记资产。

#### Acceptance Criteria

1. WHEN 用户在 Reading_Page 通过手势 / 鼠标选中一段文字（Selection 长度 ≥ 1 字），THE Reader_Frontend SHALL 在选区下方弹出工具菜单，菜单包含黄 / 绿 / 红三色按钮、"复制"、"写想法"、"段评"。
2. WHEN 用户点击工具菜单中任一颜色按钮，THE Reader_Frontend SHALL 调用 `POST /api/highlights`，请求体包含 `(novelId, chapterId, paragraphIndex, paragraphHash, startOffset, endOffset, content, color)`，并在 200ms 内把选区文字渲染为对应颜色的背景高亮。
3. WHEN 用户进入任一已划线章节，THE Reader_Frontend SHALL 调用 `GET /api/highlights?novelId=&chapterId=` 拉取该章全部划线，并在正文渲染后通过 `(paragraphIndex, paragraphHash, startOffset, endOffset)` 重新定位为带背景色的 `<mark>` 包装；定位失败的划线 SHALL 回退到该段段首并以更浅的颜色渲染（提示用户"原文已修订"）。
4. WHEN 用户长按或右键已划线段落上的高亮文字，THE Reader_Frontend SHALL 弹出菜单 "改色 / 删除 / 写想法"；点击"删除"调用 `DELETE /api/highlights/:id` 并在响应成功后从渲染中移除背景。
5. THE Reader_Frontend SHALL 在 Profile_Page 新增"我的划线"入口，进入后调用 `GET /api/user/highlights?page=&pageSize=` 按时间倒序展示用户全部划线，每条显示书名、章节、原文片段、颜色、创建时间。
6. IF 用户未登录，THEN THE Reader_Frontend SHALL 在用户点击工具菜单中任一颜色按钮时跳转到登录页（带 `returnUrl`）。
7. THE 工具菜单 SHALL 在用户点击页面其他位置或释放选区时自动关闭。
8. THE Reader_Frontend SHALL 在 360px 宽度移动端把工具菜单显示为单行水平按钮组（颜色 + 复制 + 想法 + 段评），按钮间距 ≥ 4px、可点击区 ≥ 32×32px，避免误触相邻段落。

### Requirement 26: 想法（Note）

**User Story:** As a 深度笔记型读者, I want 在划线时给这段文字附一段自己的想法, so that 我能复盘并发现自己当年的解读。

#### Acceptance Criteria

1. WHEN 用户在划线工具菜单点击"写想法"，THE Reader_Frontend SHALL 弹出底部抽屉，包含原文预览、≥ 4 行的多行输入框、"取消 / 保存"按钮。
2. WHEN 用户在抽屉中输入内容并点击"保存"，THE Reader_Frontend SHALL 调用 `POST /api/highlights` （或 `PATCH /api/highlights/:id` 若已存在划线），请求体包含 `note` 字段，颜色默认为黄。
3. THE 想法内容 SHALL 限长 500 字；超出长度时输入框右下角实时显示 "已输入 N / 500"，超出时禁用"保存"按钮。
4. WHEN 用户进入 Profile_Page 的"我的想法"列表，THE Reader_Frontend SHALL 调用 `GET /api/user/notes?page=&pageSize=` 拉取该用户全部带 `note` 的划线条目（即想法），按 `created_at DESC` 排序。
5. WHEN 用户在 Novel_Detail_Page 进入"读者想法"区块，THE Reader_Frontend SHALL 调用 `GET /api/novels/:novelId/notes/hot?limit=5`，按 Interaction_Quality_Score 降序展示前 5 条公开想法，每条显示作者昵称、原文片段、想法正文、点赞数。
6. IF 想法的原文片段对应章节已被作者删除，THEN THE 列表 SHALL 仍渲染该想法但不提供"跳转到原文"链接，并在原文片段处显示灰色文案"原文已被作者删除"。

### Requirement 27: 段评（Paragraph_Comment）

**User Story:** As a 深度笔记型读者, I want 看到这一段大家的吐槽和分析, so that 阅读不再是孤单的事。

#### Acceptance Criteria

1. THE 数据库 SHALL 新增 `paragraph_comments` 表，至少包含字段 `(id, user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, content, likes, parent_id, created_at, deleted_at)`，并建立索引 `(novel_id, chapter_id, paragraph_index)`。
2. WHEN 用户进入任一章节的 Reading_Page，THE Reader_Frontend SHALL 调用 `GET /api/paragraph-comments?novelId=&chapterId=` 拉取该章每个 `paragraph_index` 对应的段评数量聚合，并在每个段落右侧显示一个气泡图标，图标内显示数字 N（N=0 时不显示气泡）。
3. WHEN 用户点击某段右侧的段评气泡，THE Reader_Frontend SHALL 弹出底部抽屉，调用 `GET /api/paragraph-comments?novelId=&chapterId=&paragraphIndex=&page=&pageSize=` 分页加载该段评论，按 Interaction_Quality_Score 降序排列。
4. WHEN 已登录用户在段评抽屉中输入内容并点击"发送"，THE Reader_Frontend SHALL 调用 `POST /api/paragraph-comments`（请求体含 `paragraphHash` 用于服务端校验段落锚点），成功后把新评论插入抽屉首位并把对应气泡数 +1。
5. WHEN 已登录用户对段评点击点赞 / 取消点赞，THE Reader_Frontend SHALL 调用 `POST/DELETE /api/paragraph-comments/:id/like`，成功后切换图标态并把点赞数 ±1。
6. WHEN 已登录用户在自己的段评上点击删除，THE Reader_Backend SHALL 进行软删除（设置 `deleted_at`）；THE Reader_Frontend 收到响应后从抽屉中移除并把气泡数 -1。
7. THE 段评抽屉 SHALL 支持楼中楼 1 层回复（回复 = 设置 `parent_id`），但不支持二级以上嵌套，避免移动端可读性下降。
8. THE 段评内容 SHALL 限长 500 字；超长时禁用发送按钮。
9. IF 用户未登录，THEN THE Reader_Frontend SHALL 在用户点击"发送 / 点赞 / 回复"时跳转到登录页（带 `returnUrl`）。
10. WHEN 段评数量统计接口在前端缓存 5 分钟内已存在，THE Reader_Frontend SHALL 直接读缓存而不重复发请求（避免章节内反复滚动产生抖动）。
11. THE 段评气泡图标 SHALL 在 360px 宽度下大小 ≥ 24×24px，距离正文段落右边距 ≥ 8px，避免与系统右滑返回手势冲突。


### 模块七：关注作者与社交关系

本模块的"关注作者落库"已并入 Requirement 23、"红点"已并入 Requirement 24。本模块仅补充作者主页与社交呈现部分。

### Requirement 28: 作者主页与"我关注的作者"

**User Story:** As a 追更型读者, I want 在作者主页看到这位作者的全部作品和最近更新, so that 我能快速判断要不要关注。

#### Acceptance Criteria

1. THE Reader_Backend `GET /api/authors/:authorId` 响应 SHALL 包含字段 `(id, name, avatar, worksCount, totalWords, averageRating, latestUpdateAt, isFollowing, followerCount)`；其中 `isFollowing` 仅在请求带认证态时计算。
2. WHEN 已登录用户进入作者主页，THE Reader_Frontend SHALL 在右上角显示 "关注 / 已关注" 按钮，初始态来自 `isFollowing`；点击行为按 Requirement 23 处理。
3. THE 作者主页 SHALL 调用 `GET /api/authors/:authorId/novels` 拉取该作者全部作品，按 `updated_at DESC` 排序，每张卡片显示标题、封面、字数、评分、最近更新时间。
4. THE Profile_Page "我关注的作者" 区块 SHALL 调用 `GET /api/user/following-authors?page=1&pageSize=10`，每张作者卡片包含：作者名、头像、最新作品标题与封面、"X 天前更新"，"查看全部"链接跳转到 `/profile/following-authors`。
5. WHERE 作者最新作品的 `updated_at` 距今 ≤ 7 天，THE 作者卡片 SHALL 在右上角显示"NEW"小标签。
6. IF 用户已关注 ≥ 1 个作者，THEN THE Profile_Page SHALL 渲染"我关注的作者"区块，并隐藏快捷功能区中的"关注的作者"图标入口（避免功能重复）；ELSE THE Profile_Page SHALL 不渲染该区块，并在快捷功能中保留"关注的作者"入口（点击后跳转到全站作者列表 / 推荐作者页）。


### 模块八：数据模型与基础设施

本模块把跨业务的数据库变更、运行时建表迁移、向后兼容、段落锚点方案等基础约束作为独立 Requirement 落地。design / tasks 阶段必须以本模块为单一事实来源（Single Source of Truth）。

### Requirement 29: 段落锚点方案统一

**User Story:** As a 后端工程师, I want 进度同步、书签、划线、段评共用同一段落锚点定义, so that 不会因为四个功能各自实现而产生数据漂移。

#### Acceptance Criteria

1. THE System SHALL 把段落锚点定义为三元组 `(chapterId INT, paragraphIndex INT, paragraphHash CHAR(16))`，其中 `paragraphHash` 为段首 50 字符的 SHA-1 前 16 位 hex（不足 50 字符时取全部内容计算）。
2. THE 数据库表 `reading_progress / user_bookmarks / highlights / paragraph_comments` SHALL 全部包含 `paragraph_index INT NULL` 与 `paragraph_hash CHAR(16) NULL` 字段。
3. WHEN 后端 `chapters.content` 字段被更新，THE Reader_Backend SHALL 在同一事务中重新计算并刷新该章节内所有段落的 `paragraphHash` 索引（可在 `chapters` 表维护一份 `paragraph_hashes JSON` 字段或独立 `chapter_paragraphs` 索引表，由 design 阶段决定）。
4. THE Reader_Backend SHALL 在所有 4 类相关接口（progress / bookmarks / highlights / paragraph-comments）的"按锚点回找"逻辑中复用同一个 helper 函数 `resolveParagraphAnchor(chapterId, paragraphIndex, paragraphHash)`，返回最终 `(paragraphIndex, status)`，`status ∈ {'exact', 'rehashed', 'fallback'}`。
5. WHEN `paragraphHash` 在新章节正文中找到唯一匹配，THE helper SHALL 返回 `status = 'rehashed'` 与新的 `paragraphIndex`。
6. WHEN `paragraphHash` 在新章节正文中找到 0 个或 ≥ 2 个匹配，THE helper SHALL 返回 `status = 'fallback'` 并把 `paragraphIndex` 限制到合法范围（min 0、max `paragraphCount-1`）。
7. THE Reader_Frontend SHALL 在书签 / 划线 / 段评创建时一并把 `paragraphHash` 上传，禁止仅依赖 `paragraphIndex`。

### Requirement 30: 数据库 schema 变更与 migration 化

**User Story:** As a 后端工程师, I want 所有 schema 变更通过 migration 文件管理, so that 不再有"运行时 ensureXxxTables 副作用"。

#### Acceptance Criteria

1. THE Reader_Backend SHALL 在 `backend/database/migrations/` 目录下提供以下 migration 文件（命名格式 `YYYYMMDDHHmm__description.sql`）：
   - `reading_progress` 增加 `paragraph_index INT NULL, char_offset INT NULL, paragraph_hash CHAR(16) NULL`；
   - 确保 `reading_history.duration INT NOT NULL DEFAULT 0` 存在（已存在则跳过）；
   - 新增表 `user_bookmarks(id, user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, char_offset, note VARCHAR(500), created_at, INDEX (user_id, novel_id))`；
   - 新增表 `highlights(id, user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, start_offset, end_offset, content TEXT, color ENUM('yellow','green','red'), note VARCHAR(500) NULL, created_at, deleted_at, INDEX (user_id, novel_id, chapter_id))`；
   - 新增表 `paragraph_comments(id, user_id, novel_id, chapter_id, paragraph_index, paragraph_hash, content TEXT, likes INT DEFAULT 0, parent_id INT NULL, created_at, deleted_at, INDEX (novel_id, chapter_id, paragraph_index))`；
   - 启用表 `user_follow_authors(id, user_id, author_id, created_at, UNIQUE (user_id, author_id))`；
   - 可选表 `user_interest_tags(id, user_id, tag VARCHAR(50), weight DECIMAL(3,2) DEFAULT 1.00, created_at, UNIQUE (user_id, tag))`；
   - `bookshelf` 增加 `last_seen_chapter_id INT NULL, group_name VARCHAR(50) NULL, is_top TINYINT(1) NOT NULL DEFAULT 0`；
   - `bookshelf.type` 枚举追加值 `wishlist`。
2. THE Reader_Backend SHALL 在应用启动时一次性按文件名顺序执行未应用的 migration，并在 `migrations` 元数据表中记录已执行版本（已存在则跳过），禁止在请求 handler 内做 `CREATE TABLE IF NOT EXISTS` 类副作用。
3. THE `commentController.ensureCommentTables` 中的内嵌 `CREATE TABLE` 逻辑 SHALL 被迁移到 migration 文件并从代码中移除；同名旧 schema 与 `init_step1.sql` 的差异 SHALL 在 migration 中处理，避免应用启动时与已存在表冲突。
4. WHEN migration 执行失败（语法错误 / 字段冲突），THE Reader_Backend SHALL 在启动时输出明确错误日志、停止启动 HTTP 服务（避免运行在不一致 schema 下）。
5. THE migration 文件 SHALL 全部使用 `utf8mb4` 字符集与 `utf8mb4_unicode_ci` 排序规则，保持与 `init_step1.sql` 一致。
6. THE migration 框架 SHALL 支持"幂等重跑"——已执行的 migration 在重启后跳过，未执行的按顺序执行。

### Requirement 31: 向后兼容与字段过渡期

**User Story:** As a 用户, I want 升级期间老客户端依旧能用, so that 没装到最新版本的设备不至于打开就崩。

#### Acceptance Criteria

1. THE Reader_Backend SHALL 在响应 `GET /api/user/reading-progress/:novelId` 时同时返回旧字段 `progress`（章内滚动百分比）与新字段 `paragraph_index, char_offset, paragraph_hash`，保证旧版前端依然可用。
2. THE Reader_Backend SHALL 在 `POST /api/user/reading-progress` 接收请求时容忍缺失 `paragraph_index / char_offset / paragraph_hash` 字段（缺失时不更新对应列），仅强制要求 `novelId`。
3. WHEN 老版本前端拉取 `GET /api/user/bookshelf`，THE Reader_Backend 响应 SHALL 包含老字段（`type, novel_id, …`）与新增字段（`group_name, is_top, last_seen_chapter_id, hasUnreadUpdate`）；老前端遇到未知字段 SHALL 不能因 JSON 字段增多而崩溃（这是一个对前端解码层的反向约束）。
4. THE 旧字段 `reading_progress.progress` SHALL 至少保留 6 个月过渡期，期间不被弃用；THE 新版前端 SHALL 在过渡期内每次写入新字段时同步刷新 `progress` 字段（按 `paragraphIndex / paragraphCount × 100` 估算）；WHEN Reader_Backend 在最近 30 天内未从任何老版本客户端收到仅含 `progress` 的写入请求，THEN 系统 SHALL 停止该同步计算并把 `progress` 字段视为可冻结（不再由新版前端主动写入，仅保留历史值供查询）。
5. THE 数据库 migration SHALL 全部使用 `ADD COLUMN ... NULL`（而非 `NOT NULL`）以保证旧记录不会因为新增列而违反约束。
6. THE Reader_Backend SHALL 在 schema 过渡期（默认 6 个月，由配置项控制）结束后启动一次回填 job，把 `reading_progress / user_bookmarks / highlights / paragraph_comments` 中的 `paragraph_index / paragraph_hash` 等可空字段在已有上下文允许时回填为合理值（缺失上下文时保留 NULL 并记录待人工处理）。
7. WHEN 用户从未升级的客户端发起 `POST /api/highlights / /api/paragraph-comments` 请求（这些是新接口），THE Reader_Backend SHALL 返回 HTTP 404 而非 500，便于前端做"功能不可用"的优雅降级。


### 模块九：非功能性需求

涵盖性能、安全、未登录跳转、女性向产品调性、移动端 / 响应式、可观测性等横切约束。所有具体业务 Requirement 都隐含遵守本模块。

### Requirement 32: 未登录态与登录跳转统一行为

**User Story:** As a 普通读者, I want 我点了"加书架 / 点赞 / 划线"等任意需登录操作时被引导登录后能回到原页面, so that 我不必登录后再找回原来读到的位置。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 在所有需要登录的操作（加书架、点赞、收藏、书签、划线、想法、段评、关注作者、批量管理、勋章页等）入口前进行登录态检查。
2. IF 用户未登录，THEN THE Reader_Frontend SHALL 跳转到 `/login?returnUrl={encodeURIComponent(currentFullPath)}`，登录成功后路由解析 `returnUrl` 并跳回。
3. THE Reader_Frontend SHALL 在 `returnUrl` 解析时校验目标必须是同源相对路径（以 `/` 开头），否则忽略 `returnUrl` 跳转到首页（防开放重定向）。
4. THE Reader_Backend SHALL 对所有需要登录的接口在缺失或错误 token 时返回 HTTP 401 与统一响应体 `{ code: 401, message: '请先登录' }`，前端 SHALL 拦截 401 并执行登录跳转。
5. WHILE 登录态检查接口 in-flight，THE Reader_Frontend SHALL 显示按钮 loading 占位，避免双击产生重复跳转。

### Requirement 33: 性能与服务端响应时间

**User Story:** As a 产品方, I want 关键接口在 35 部种子书规模下毫秒级响应, so that 用户体验不被后端拖慢。

#### Acceptance Criteria

1. THE Reader_Backend `GET /api/user/reading-progress/:novelId / POST /api/user/reading-progress / GET /api/user/bookshelf / GET /api/novels/:id / GET /api/novels/:novelId/chapters` 在 P95 SHALL ≤ 300ms（在本地开发环境 / 35 部种子书规模下测量）。
2. THE Reader_Backend `GET /api/novels/recommend / GET /api/highlights / GET /api/paragraph-comments` 在 P95 SHALL ≤ 500ms。
3. THE Reader_Frontend 首屏（Home_Page）的 LCP SHALL ≤ 2.5s（在本地构建产物 + Lighthouse Mobile 模式下测量）。
4. THE Reader_Frontend Reading_Page 在切章过程中 SHALL 不出现 ≥ 200ms 的长任务（Long Task），保证滚动流畅度。
5. THE Reader_Backend SHALL 对 `GET /api/novels/recommend` 与 `GET /api/novels/search/suggestions` 的响应启用 ≥ 60 秒的内存缓存（key 含 `userId / keyword` 维度）。

### Requirement 34: 安全与输入校验

**User Story:** As a 产品方, I want 用户提交的想法 / 段评 / 评论不会让我的页面被 XSS, so that 风险可控。

#### Acceptance Criteria

1. THE Reader_Backend SHALL 对所有用户输入文本字段（划线 `note`、想法、段评、评论、书签 `note`）调用 `sanitizeComment` 清洗，移除危险 HTML / `<script>` / `javascript:` / `on*=` 属性。
2. THE Reader_Backend SHALL 对所有写接口（书签 / 划线 / 想法 / 段评 / 关注 / 批量操作）施加 1 分钟内最多 30 次 / 每分钟最多 3 次相同内容的提交频次限制（具体阈值由 design 阶段量化），超出返回 HTTP 429。
3. THE Reader_Backend SHALL 对所有 `userId / novelId / chapterId / authorId` 类参数做整数校验，非法参数返回 HTTP 400。
4. THE Reader_Frontend SHALL 在渲染所有用户文本时使用 Vue `{{ }}` 插值（自动 escape）或 `v-text`，禁止使用 `v-html` 渲染未经服务端清洗的用户内容。
5. WHEN 用户提交想法 / 段评 / 评论的内容长度 > 500 字，THE Reader_Backend SHALL 返回 HTTP 400 与 `code: COMMENT_TOO_LONG`。

### Requirement 35: 女性向产品调性

**User Story:** As a 产品方, I want 评论 / 想法 / 段评的默认排序避免争议性热度爆款, so that 阅读社区氛围保持温和。

#### Acceptance Criteria

1. THE Reader_Backend SHALL 把评论、想法、段评的默认排序统一为 Interaction_Quality_Score 降序，公式为 `likes + replyCount × 2 + min(content_length / 50, 5)`。
2. THE Reader_Frontend SHALL 在评论 / 想法 / 段评列表的顶部提供排序切换："互动质量 / 最新"，默认选中"互动质量"。
3. THE Reader_Frontend SHALL 把所有"获得新勋章 / 加入新书签"动效时长限制为 ≤ 1.5s，且仅在用户离开 Reading_Page 后或显式进入对应入口时播放，不在阅读期间打断阅读。
4. THE Reader_Frontend SHALL 使用低饱和度动效色（与设计系统中的 clay / moss / cream 调色板一致），避免红色 / 闪烁色块大面积出现。
5. WHERE 用户开启"减少动效"系统偏好（`prefers-reduced-motion: reduce`），THE Reader_Frontend SHALL 用淡入淡出 / 不移动的方式替代撒花、抖动、缩放等动画。

### Requirement 36: 响应式与移动端适配

**User Story:** As a 移动端用户, I want 所有新增交互在 360px 宽度下都能舒服使用, so that 我在小屏手机上不被卡。

#### Acceptance Criteria

1. THE Reader_Frontend SHALL 把所有新增 UI（划线工具菜单、段评气泡、设置面板抽屉、ChapterDrawer、想法抽屉、批量管理条、筛选面板）在 viewport 宽度 = 360px 下布局完整、无横向滚动条。
2. THE Reader_Frontend SHALL 把所有可点击元素的最小可点击区设为 ≥ 32×32px，相邻元素间距 ≥ 4px，按钮 hit area 不依赖 `:hover` 才能命中。
3. WHERE 用户在 iOS Safari 边缘左滑（系统返回手势）区域内，THE Reading_Page SHALL 不在该区域内绑定自定义 swipe 翻页处理（避免冲突）；具体安全区由 design 阶段量化（建议屏幕左 / 右各 12px）。
4. THE Reader_Frontend SHALL 在 360px、412px、768px、1024px、1440px 五档断点下分别通过手动验证主流程（首页 / 详情 / 阅读 / 书架 / 个人中心）无明显错位。
5. THE Reader_Frontend SHALL 在 ChapterDrawer 与设置面板抽屉关闭按钮上设置 `aria-label`，键盘 Esc 与点击遮罩两种方式都可关闭。

### Requirement 37: 可观测性与回归保障

**User Story:** As a 工程团队, I want 上线后能快速发现哪个功能挂了, so that 不靠用户报障来发现回归。

#### Acceptance Criteria

1. THE Reader_Backend SHALL 在划线、段评、想法、关注、心跳上报五类核心写接口被实际调用时（每次请求被路由 handler 处理时）分别记录 INFO 级请求日志（包含 `userId, novelId, chapterId, latency, status`），保留至少 7 天；THE Reader_Backend SHALL 不为这些接口做空轮询或定时打点（无调用即无 INFO 日志）。
2. THE 项目 SHALL 至少为以下三条核心链路添加 e2e（Playwright）回归用例，每条用例运行时间 ≤ 60s：
   - 阅读进度同步（A 客户端读到第 5 章 → B 客户端打开自动定位第 5 章对应段落）；
   - 划线创建 → 退出 Reading_Page → 重新进入后划线仍可见；
   - 段评气泡数 +1 → 抽屉显示新段评 → 软删除后气泡数 -1。
3. THE Reader_Backend SHALL 在 `/api/health` 健康检查接口的响应中暴露 migration 已执行版本号，便于运维确认 schema 状态。
4. WHEN 任一写接口连续 5 次返回 5xx 错误，THE Reader_Backend SHALL 在日志中输出 ERROR 级告警（具体外部告警通道由后续 ops 决定）。

---

## 范围外（Out of Scope）

为避免歧义，以下能力**明确不在本 spec 范围内**，由后续 P2 / 其他 spec 处理：

- PWA 离线缓存与 Service Worker 注册；
- 阅读年度 / 周报告 H5 分享卡；
- 评论举报 / 折叠 / 黑名单 / 楼中楼 ≥ 2 层嵌套；
- 营养液 / 推荐票 / 月票（轻量打赏）；
- 防爬：水印 + `user-select` 控制；
- PC 阅读快捷键（← / → / Space）；
- 段落点击查词 / 翻译；
- 推送 / 站内信通知中心；
- 新增内容审核与作者激励规则。

## 与计划清单的对照（供追溯）

| 计划清单条目 | 对应 Requirement |
|---|---|
| P0-1 书签接通 | Requirement 1 |
| P0-2 加书架 / 点赞 | Requirement 9 |
| P0-3 续读章节名 | Requirement 10 |
| P0-4 详情页假数据清理 | Requirement 11 |
| P0-5 个人中心阅读时长 / 连读 / 书架数 | Requirement 14 |
| P0-6 首页"继续阅读"卡 | Requirement 13 |
| P0-7 章节抽屉接入 | Requirement 2 |
| P0-8 进度同步 TODO | Requirement 4（含 Requirement 31 的兼容） |
| P1-A-1 翻页方式 | Requirement 3 |
| P1-A-2 段落级位置同步 | Requirement 4、Requirement 29 |
| P1-A-3 阅读时长心跳 | Requirement 5 |
| P1-A-4 屏幕常亮 | Requirement 6 |
| P1-A-5 阅读设置统一 | Requirement 7 |
| P1-A-6 TTS 听书 | Requirement 8 |
| P1-A-7 字体 / 段距 / 页边距 / 亮度 | Requirement 7 |
| P1-B-1 划线 | Requirement 25、Requirement 29、Requirement 30 |
| P1-B-2 想法 | Requirement 26、Requirement 35 |
| P1-B-3 段评 | Requirement 27、Requirement 29 |
| P1-B-4 关注作者落库 + 红点 | Requirement 23、Requirement 24 |
| P1-B-5 勋章墙 | Requirement 15 |
| P1-B-6 作者其他作品 / 同标签好书 | Requirement 12、Requirement 28 |
| P1-C-1 首页分榜 | Requirement 16 |
| P1-C-2 搜索筛选面板 | Requirement 17 |
| P1-C-3 typeahead 实时建议 | Requirement 18 |
| P1-C-4 推荐算法升级 | Requirement 19、Requirement 20 |
| P1-C-5 书架增强 | Requirement 21、Requirement 22 |
| 关键设计约束（运行时建表迁移） | Requirement 30 |
| 关键设计约束（向后兼容） | Requirement 31 |
| 关键设计约束（女性向调性） | Requirement 35 |
| 关键设计约束（响应式 / 移动） | Requirement 36 |
