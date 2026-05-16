#### 6.1.4 色彩应用示例

```
【按钮色彩】
主按钮(Primary):     背景#8B7FD9  文字#FFFFFF
次按钮(Secondary):   背景#FFFFFF  文字#8B7FD9  边框#8B7FD9
文字按钮(Text):      背景透明     文字#8B7FD9
禁用按钮(Disabled):  背景#F5F5F5  文字#CCCCCC

【卡片色彩】
标题卡片:            紫色渐变背景  白色文字
内容卡片:            白色背景  黑色文字  #E8E8E8边框
强调卡片:            #F3F1FF背景  黑色文字
警告卡片:            #FFF7E6背景  #FAAD14边框

【进度条色彩】
完成部分:            #8B7FD9渐变
未完成部分:          #F0F0F0
等级进度条:          绿色→黄色→橙色→红色(根据分数)

【文字链接】
默认:                #1890FF
hover:               #40A9FF
visited:             #8B7FD9
```

---

### 6.2 字体规范

#### 6.2.1 字体家族

```
中文字体：
Primary:   PingFang SC (苹果)
           Microsoft YaHei (Windows)
           Noto Sans SC (Android)

英文/数字字体：
Primary:   -apple-system, BlinkMacSystemFont
           "Segoe UI", "Helvetica Neue"
           
后备字体：
sans-serif

代码字体(如有):
"Monaco", "Courier New", monospace
```

#### 6.2.2 字号体系

```
特大标题(H1):    32px  粗体(Bold)      页面主标题
大标题(H2):      28px  粗体(Bold)      测试结果标题
中标题(H3):      24px  半粗(Semibold)  卡片标题
小标题(H4):      20px  半粗(Semibold)  区块标题
强调文本:        18px  常规(Regular)   题目、重要信息
正文:            16px  常规(Regular)   选项、描述文字
辅助文本:        14px  常规(Regular)   说明、提示
注释文本:        12px  常规(Regular)   版权、免责

【数字字体】
特大数字:        48px  粗体           总分展示
大数字:          32px  半粗           维度得分
中数字:          24px  常规           百分比
```

#### 6.2.3 行高与字重

```
行高(Line Height):
标题:    1.2 - 1.3
正文:    1.6 - 1.8
密集文本: 1.5

字重(Font Weight):
Thin:        100  (不使用)
Light:       300  (不使用)
Regular:     400  正文
Medium:      500  强调
Semibold:    600  小标题
Bold:        700  大标题
```

#### 6.2.4 字体应用示例

```
【入口页】
主标题 "你的社恐有多严重?":         28px Bold #000000
副标题 "SAS社交焦虑专业量表":        16px Regular #666666
痛点列表 "😰 参加聚会前就开始焦虑":   18px Regular #333333
产品卖点 "✓ 30道科学测试题":         16px Regular #333333
CTA按钮 "立即开始测试":             18px Bold #FFFFFF

【答题页】
题目 "想到要参加聚会，你会...":     22px Semibold #000000
选项 "○ 完全不会紧张":              18px Regular #333333
进度提示 "第1题/共30题":            14px Regular #666666

【报告页】
类型标签 "「预演型社恐」":          28px Bold #FFFFFF
维度名称 "社交场景恐惧":            16px Semibold #333333
得分 "20/25":                       20px Bold #8B7FD9
解读文字 "→ 你在多人聚会...":        15px Regular #666666 行高1.6
```

---

### 6.3 间距规范

#### 6.3.1 间距体系

```
基础单位: 4px (使用4的倍数)

超小间距(xs):   4px   图标与文字间距
小间距(sm):     8px   同组元素间距
中间距(md):     16px  卡片内边距、段落间距
大间距(lg):     24px  区块间距
超大间距(xl):   32px  页面主区块间距
巨大间距(xxl):  48px  页面顶部/底部留白
```

#### 6.3.2 页面布局间距

```
【全局页边距】
左右: 20px (安全区)
顶部: 60px (包含导航栏)
底部: 24px

【卡片间距】
卡片内边距(Padding):  16px
卡片外边距(Margin):   16px
卡片圆角(Radius):     12px

【按钮间距】
按钮内边距:           16px(上下) 32px(左右)
按钮组间距:           12px
按钮高度:             48px (主按钮) / 40px (次按钮)

【列表间距】
列表项间距:           12px
列表项内边距:         16px
```

#### 6.3.3 间距应用示例

```
┌─────────────────────────────────────┐
│  ←20px→                    ←20px→   │ 页边距
│   ┌───────────────────────────┐     │
│   │  ↑16px                    │     │ 卡片内边距
│   │  标题                      │     │
│   │  ↓8px                     │     │ 标题与内容间距
│   │  内容文字                  │     │
│   │  ↓16px                    │     │
│   └───────────────────────────┘     │
│   ↓16px                             │ 卡片外边距
│   ┌───────────────────────────┐     │
│   │  下一个卡片                │     │
│   └───────────────────────────┘     │
└─────────────────────────────────────┘
```

---

### 6.4 图标规范

#### 6.4.1 图标尺寸

```
超小图标:  16×16px  (列表前图标)
小图标:    20×20px  (导航图标)
中图标:    24×24px  (功能图标)
大图标:    32×32px  (卡片图标)
超大图标:  48×48px  (主视觉图标)
巨型图标:  64×64px  (入口页emoji)
```

#### 6.4.2 图标库

```
推荐使用:
- Emoji (表情符号) - 增加亲和力
- Feather Icons (简约风格)
- Material Icons (功能性图标)

【常用图标】
🫣  社恐主题
🎯  目标/结果
📊  数据/分析
🔍  详细分析
💡  建议/想法
✅  完成/正确
⚠️  警告/注意
🔒  锁定/付费
💜  喜欢/品牌
📱  手机/二维码
🎁  礼物/赠品
🫂  社群/陪伴
📖  阅读/学习
🧠  心理/思考
💪  改善/加油
```

#### 6.4.3 图标使用规范

```
【颜色】
单色图标: 继承文字颜色
品牌图标: #8B7FD9
成功图标: #52C41A
警告图标: #FAAD14
错误图标: #FF4D4F

【间距】
图标与文字间距: 8px
图标与边框间距: 12px

【对齐】
图标与文字垂直居中对齐
```

---

### 6.5 阴影规范

```
【卡片阴影】
浅阴影(默认):
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

中阴影(hover):
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

深阴影(弹窗):
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);

【按钮阴影】
默认:
box-shadow: 0 2px 4px rgba(139, 127, 217, 0.2);

hover:
box-shadow: 0 4px 12px rgba(139, 127, 217, 0.3);

active:
box-shadow: 0 1px 2px rgba(139, 127, 217, 0.2);
```

---

### 6.6 圆角规范

```
超小圆角:  4px   标签、徽章
小圆角:    8px   按钮、输入框
中圆角:    12px  卡片、对话框
大圆角:    16px  图片、大卡片
圆形:      50%   头像、圆形按钮
```

---

## 七、组件库

### 7.1 按钮组件

#### 7.1.1 主按钮（Primary Button）

```
【默认状态】
┌──────────────────────────┐
│   🚀 立即开始测试(5分钟)   │  高度48px
└──────────────────────────┘  圆角8px
背景: #8B7FD9渐变
文字: 18px Bold #FFFFFF
阴影: 0 2px 4px rgba(139,127,217,0.2)

【Hover状态】
背景: #A899FF渐变
阴影: 0 4px 12px rgba(139,127,217,0.3)
transform: translateY(-2px)

【Active状态】
背景: #6B5FB8
阴影: 0 1px 2px rgba(139,127,217,0.2)
transform: translateY(0)

【禁用状态】
背景: #F5F5F5
文字: #CCCCCC
cursor: not-allowed
```

#### 7.1.2 次按钮（Secondary Button）

```
【默认状态】
┌──────────────────────────┐
│      继续答题            │  高度40px
└──────────────────────────┘  圆角8px
背景: #FFFFFF
文字: 16px Semibold #8B7FD9
边框: 1px solid #8B7FD9

【Hover状态】
背景: #F3F1FF
边框: 2px solid #8B7FD9
```

#### 7.1.3 文字按钮（Text Button）

```
【默认状态】
[查看详情 >]
背景: 透明
文字: 14px Regular #1890FF
无边框

【Hover状态】
文字: #40A9FF
text-decoration: underline
```

---

### 7.2 输入组件

#### 7.2.1 单选按钮（Radio Button）

```
【未选中】
○  完全不会紧张
圆圈: 20×20px, 边框2px #D9D9D9
文字: 18px Regular #333333
内边距: 16px
背景: #FFFFFF

【选中】
◉  完全不会紧张 ✓
圆圈: 20×20px, 填充#8B7FD9
文字: 18px Regular #000000
右侧✓: 16px #8B7FD9
背景: #F3F1FF
边框: 2px solid #8B7FD9
```

#### 7.2.2 复选框（Checkbox）

```
【未选中】
□ 我已阅读并同意以上内容
方框: 16×16px, 边框1px #D9D9D9
文字: 14px Regular #666666

【选中】
☑ 我已阅读并同意以上内容
方框: 16×16px, 填充#8B7FD9, ✓白色
文字: 14px Regular #000000
```

#### 7.2.3 文本输入框（Text Input）

```
【默认状态】
┌──────────────────────────┐
│  请输入...               │  高度44px
└──────────────────────────┘  圆角8px
背景: #FFFFFF
边框: 1px solid #D9D9D9
文字: 16px Regular #333333
placeholder: 16px Regular #999999
内边距: 12px 16px

【聚焦状态】
边框: 2px solid #8B7FD9
阴影: 0 0 0 3px rgba(139,127,217,0.1)

【错误状态】
边框: 1px solid #FF4D4F
底部提示: 12px Regular #FF4D4F
```

---

### 7.3 反馈组件

#### 7.3.1 Toast提示

```
【成功Toast】
┌──────────────────────────┐
│  ✓ 操作成功               │
└──────────────────────────┘
背景: #F6FFED
边框: 1px solid #B7EB8F
文字: 14px Regular #52C41A
位置: 顶部居中
持续: 2秒自动消失

【错误Toast】
┌──────────────────────────┐
│  ⚠️ 请先选择一个答案       │
└──────────────────────────┘
背景: #FFF2F0
边框: 1px solid #FFCCC7
文字: 14px Regular #FF4D4F
```

#### 7.3.2 弹窗（Modal）

```
【结构】
遮罩层: rgba(0,0,0,0.5)

┌──────────────────────────┐
│  ×                       │  关闭按钮
│                          │
│      确认离开吗?          │  标题 18px Bold
│                          │
│  你的答案已保存,          │  内容 16px Regular
│  可随时继续答题           │
│                          │
│  [取消]      [确定]      │  按钮组
└──────────────────────────┘

宽度: 320px
圆角: 16px
阴影: 0 8px 24px rgba(0,0,0,0.16)
```

#### 7.3.3 进度条（Progress Bar）

```
【线性进度条】
▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  33%

容器: 高度4px, 圆角2px, 背景#F0F0F0
填充: 高度4px, 圆角2px, 背景#8B7FD9
宽度: 100%
动画: 0.3s ease

【环形进度条】(可选)
    ⭕ 75%
外圆: 80px直径, 边框8px #F0F0F0
进度: 边框8px #8B7FD9
文字: 24px Bold #000000 居中
```

---

### 7.4 展示组件

#### 7.4.1 卡片（Card）

```
【基础卡片】
┌──────────────────────────┐
│  卡片标题                 │  16px Semibold
│  ━━━━━━━━━━━━━━━━━━━━  │
│  卡片内容区域             │  16px Regular
│                          │
└──────────────────────────┘
背景: #FFFFFF
边框: 1px solid #E8E8E8
圆角: 12px
内边距: 16px
阴影: 0 2px 8px rgba(0,0,0,0.08)

【强调卡片】
背景: #F3F1FF (淡紫色)
边框: 1px solid #8B7FD9

【警告卡片】
背景: #FFF7E6 (淡黄色)
边框: 1px solid #FAAD14
```

#### 7.4.2 标签（Tag）

```
【默认标签】
┌─────────┐
│  中度   │  高度24px
└─────────┘  圆角4px
背景: #F5F5F5
文字: 12px Medium #666666
内边距: 4px 12px

【品牌标签】
背景: #F3F1FF
文字: 12px Medium #8B7FD9

【状态标签】
成功: 背景#F6FFED 文字#52C41A
警告: 背景#FFF7E6 文字#FAAD14
错误: 背景#FFF2F0 文字#FF4D4F
```

#### 7.4.3 分割线（Divider）

```
【实线】
━━━━━━━━━━━━━━━━━━━━━━━━━━
高度: 1px
颜色: #E8E8E8
外边距: 16px 0

【虚线】
- - - - - - - - - - - - - - -
高度: 1px
颜色: #D9D9D9
样式: dashed

【带文字】
━━━━━━  向下滑动查看详细分析 👇  ━━━━━━
```

---

### 7.5 雷达图组件

```javascript
// 使用ECharts配置
const radarOption = {
  radar: {
    indicator: [
      { name: '社交场景恐惧', max: 100 },
      { name: '回避行为', max: 100 },
      { name: '预期焦虑', max: 100 },
      { name: '社交反刍', max: 100 },
      { name: '生理反应', max: 100 },
      { name: '自我效能', max: 100 }
    ],
    radius: 120,
    splitNumber: 4,
    name: {
      textStyle: {
        color: '#333333',
        fontSize: 14
      }
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(0,0,0,0.1)',
        type: 'dashed'
      }
    },
    splitArea: {
      areaStyle: {
        color: ['transparent']
      }
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(0,0,0,0.1)'
      }
    }
  },
  series: [{
    type: 'radar',
    data: [{
      value: [80, 60, 88, 72, 40, 32],
      name: '你的数据',
      areaStyle: {
        color: 'rgba(139,127,217,0.3)'
      },
      lineStyle: {
        color: '#8B7FD9',
        width: 2
      },
      itemStyle: {
        color: '#8B7FD9'
      }
    }]
  }]
};
```

---

## 八、响应式适配

### 8.1 断点设置

```
移动端(Mobile):     375px - 767px   (主要适配)
平板(Tablet):       768px - 1023px  (可选)
桌面端(Desktop):    1024px+          (不适配)

说明: MVP版本只适配移动端
```

### 8.2 移动端适配方案

```css
/* 使用rem单位 */
html {
  font-size: 16px; /* 1rem = 16px */
}

/* 关键尺寸 */
@media (max-width: 375px) {
  html { font-size: 14px; }  /* 小屏手机 */
}

@media (min-width: 414px) {
  html { font-size: 17px; }  /* 大屏手机 */
}

/* 或使用vw单位 */
html {
  font-size: calc(100vw / 375 * 16);  /* 基于375px设计稿 */
}
```

### 8.3 安全区域适配（iPhone X+）

```css
/* 考虑刘海屏和底部横条 */
.page-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 导航栏 */
.navbar {
  height: calc(44px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
}

/* 底部按钮 */
.bottom-button {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
```

### 8.4 横屏适配

```css
@media (orientation: landscape) {
  /* 横屏时减小字号 */
  html {
    font-size: 14px;
  }
  
  /* 减小垂直间距 */
  .card {
    margin: 12px 0;
  }
  
  /* 隐藏非关键元素 */
  .decoration {
    display: none;
  }
}
```

---

## 九、开发注释

### 9.1 技术栈建议

```
【前端框架】
推荐: Vue 3 + Vite
或: React + Next.js

【UI组件库】
Vant (移动端)
Ant Design Mobile

【图表库】
ECharts (雷达图)
Chart.js (备选)

【动画库】
Animate.css (简单动画)
GSAP (复杂动画,可选)

【工具库】
Lodash (数据处理)
Day.js (时间处理)
html2canvas (截图分享)
```

### 9.2 性能优化建议

```
【图片优化】
- 使用WebP格式 (降低60%体积)
- 懒加载非首屏图片
- 雷达图使用Canvas渲染

【代码优化】
- 路由懒加载 (按页面分包)
- 组件懒加载 (可见时再加载)
- Tree Shaking (删除未使用代码)

【加载优化】
- 首屏关键CSS内联
- 非关键CSS异步加载
- 字体子集化 (只加载用到的字符)

【缓存策略】
- 测试题目数据缓存 (LocalStorage)
- 用户答案实时保存 (防止丢失)
- 静态资源CDN缓存
```

### 9.3 埋点需求

```javascript
// 关键行为埋点
const trackingEvents = {
  // 页面浏览
  page_view: {
    page_name: 'landing_page/question_page/result_page',
    timestamp: Date.now()
  },
  
  // 用户行为
  click_start_test: {},           // 点击开始测试
  complete_question: {             // 完成题目
    question_id: 1,
    answer: 'A',
    time_spent: 5000              // 毫秒
  },
  complete_all_questions: {        // 完成全部题目
    total_time: 180000            // 总耗时
  },
  view_free_result: {},           // 查看免费结果
  click_unlock: {},               // 点击解锁完整报告
  payment_success: {              // 支付成功
    amount: 0.99
  },
  view_full_report: {},           // 查看完整报告
  click_share: {},                // 点击分享
  share_success: {                // 分享成功
    platform: 'wechat/moments'
  },
  click_other_test: {             // 点击其他测试
    test_name: 'pleaser_test'
  },
  
  // 用户流失
  abandon_question: {             // 放弃答题
    question_id: 15,
    progress: 50                  // 完成百分比
  },
  close_payment: {}               // 关闭支付
};
```

### 9.4 浏览器兼容性

```
【必须支持】
iOS Safari 12+
Android Chrome 70+
微信内置浏览器 (基于Chrome)

【CSS兼容】
- 使用Autoprefixer自动添加前缀
- Flexbox布局 (兼容性好)
- 避免使用Grid (部分老设备不支持)

【JS兼容】
- 使用Babel转译ES6+
- Promise需要polyfill
- 避免使用可选链 (?.) 在老设备

【测试设备】
- iPhone 8 (iOS 12)
- iPhone 11 (iOS 14)
- iPhone 13 (iOS 15+)
- 华为 P30 (Android 9)
- 小米 10 (Android 11)
```

---

### 9.5 关键代码片段

#### 9.5.1 答题逻辑

```javascript
// 答题状态管理
const questionState = {
  currentQuestion: 1,
  totalQuestions: 30,
  answers: {},  // { questionId: answerId }
  startTime: Date.now(),
  
  // 保存答案
  saveAnswer(questionId, answerId) {
    this.answers[questionId] = answerId;
    localStorage.setItem('test_answers', JSON.stringify(this.answers));
  },
  
  // 计算进度
  getProgress() {
    return Object.keys(this.answers).length / this.totalQuestions * 100;
  },
  
  // 检查是否完成
  isCompleted() {
    return Object.keys(this.answers).length === this.totalQuestions;
  }
};

// 自动跳转下一题
function autoNextQuestion(delay = 500) {
  setTimeout(() => {
    if (questionState.currentQuestion < questionState.totalQuestions) {
      questionState.currentQuestion++;
      renderQuestion(questionState.currentQuestion);
    } else {
      submitTest();
    }
  }, delay);
}
```

#### 9.5.2 计分逻辑

```javascript
// 计算总分和维度分
function calculateScore(answers) {
  const dimensions = {
    scene_fear: [1, 2, 3, 4, 5],        // 社交场景恐惧
    avoidance: [6, 7, 8, 9, 10],        // 回避行为
    anticipation: [11, 12, 13, 14, 15], // 预期焦虑
    rumination: [16, 17, 18, 19, 20],   // 社交反刍
    physical: [21, 22, 23, 24, 25],     // 生理反应
    self_efficacy: [26, 27, 28, 29, 30] // 自我效能
  };
  
  let totalScore = 0;
  let dimensionScores = {};
  
  // 计算每个维度得分
  Object.entries(dimensions).forEach(([key, questionIds]) => {
    let dimensionScore = 0;
    questionIds.forEach(id => {
      dimensionScore += answers[id] || 0;
    });
    dimensionScores[key] = dimensionScore;
    totalScore += dimensionScore;
  });
  
  return {
    total: totalScore,
    dimensions: dimensionScores,
    level: getLevel(totalScore),
    type: getType(dimensionScores)
  };
}

// 判断等级
function getLevel(score) {
  if (score < 60) return '轻度';
  if (score < 90) return '中度';
  if (score < 120) return '重度';
  return '极重度';
}

// 判断类型
function getType(dimensions) {
  // 根据维度得分组合判断类型
  if (dimensions.anticipation > 18 && dimensions.rumination > 18) {
    return '预演型社恐';
  } else if (dimensions.avoidance > 18) {
    return '回避型社恐';
  } else if (dimensions.physical > 18) {
    return '表演型社恐';
  } else {
    return '轻度社恐';
  }
}
```

#### 9.5.3 报告生成

```javascript
// 生成完整报告
function generateReport(scoreData, userInfo) {
  const report = {
    // 基础信息
    userId: userInfo.userId,
    testTime: new Date().toISOString(),
    
    // 分数数据
    totalScore: scoreData.total,
    level: scoreData.level,
    percentile: calculatePercentile(scoreData.total),
    
    // 维度数据
    dimensions: Object.entries(scoreData.dimensions).map(([key, value]) => ({
      name: getDimensionName(key),
      score: value,
      maxScore: 25,
      percentage: (value / 25 * 100).toFixed(0),
      interpretation: getDimensionInterpretation(key, value)
    })),
    
    // 类型诊断
    type: {
      name: scoreData.type,
      features: getTypeFeatures(scoreData.type),
      analysis: getTypeAnalysis(scoreData.type),
      advice: getTypeAdvice(scoreData.type)
    },
    
    // 改善建议
    suggestions: getSuggestions(scoreData),
    
    // 附加资源
    resources: {
      pdf: 'url_to_21day_plan.pdf',
      images: ['url_to_tip1.jpg', 'url_to_tip2.jpg'],
      audio: 'url_to_meditation.mp3'
    }
  };
  
  return report;
}
```

#### 9.5.4 分享图片生成

```javascript
import html2canvas from 'html2canvas';

// 生成分享卡片
async function generateShareCard(reportData) {
  // 1. 创建分享卡片DOM
  const cardElement = createShareCardElement(reportData);
  document.body.appendChild(cardElement);
  
  // 2. 转换为图片
  const canvas = await html2canvas(cardElement, {
    width: 1080,
    height: 1080,
    scale: 2,  // 提高清晰度
    backgroundColor: '#FFFFFF',
    useCORS: true  // 支持跨域图片
  });
  
  // 3. 转换为base64
  const imageUrl = canvas.toDataURL('image/png');
  
  // 4. 清理DOM
  document.body.removeChild(cardElement);
  
  return imageUrl;
}

// 创建分享卡片元素
function createShareCardElement(data) {
  const card = document.createElement('div');
  card.className = 'share-card';
  card.innerHTML = `
    <div class="card-header">
      <span class="emoji">🫣</span>
      <h2>我的社恐程度测试报告</h2>
    </div>
    <div class="card-content">
      <div class="type-tag">${data.type}</div>
      <div class="score-info">
        <p>综合得分: ${data.totalScore}/150</p>
        <p>击败了全国 ${data.percentile}% 的社恐人群</p>
      </div>
      <div class="features">
        ${data.features.map(f => `<p>✓ ${f}</p>`).join('')}
      </div>
    </div>
    <div class="card-footer">
      <div class="qrcode">
        <img src="${data.qrcodeUrl}" alt="二维码" />
      </div>
      <p>扫码测测你的社恐程度</p>
      <p class="brand">来自 小红书心理研究院 💜</p>
    </div>
  `;
  
  // 应用样式
  card.style.width = '1080px';
  card.style.height = '1080px';
  card.style.position = 'absolute';
  card.style.left = '-9999px';
  
  return card;
}
```

---

## 十、交付清单

### 10.1 设计交付物

```
【必须交付】
✓ 原型设计文档(本文档)
✓ 页面流程图(Mermaid)
✓ 所有页面线框图(ASCII Art)
✓ 视觉规范文档(色彩/字体/间距)
✓ 组件库说明

【可选交付】(如需高保真设计)
□ Figma/Sketch设计稿
□ 切图资源包(图标/插图)
□ 动效演示视频
□ 交互原型(可点击)
```

### 10.2 开发协作

```
【协作流程】
1. 开发前会议: 讲解设计思路和交互逻辑
2. 开发中答疑: 及时回答设计细节问题
3. UI走查: 检查实现效果与设计稿一致性
4. 优化迭代: 基于用户反馈调整设计

【设计走查检查点】
□ 间距是否符合规范(4px倍数)
□ 颜色是否使用规范色值
□ 字体大小和字重是否正确
□ 圆角和阴影是否一致
□ 动画时长和缓动是否流畅
□ 移动端适配是否正常
□ 交互反馈是否及时
```

---

## 十一、附录

### 11.1 设计参考

```
【竞品参考】
- SCL-90心理测评 (专业性)
- 网易云音乐心理测试 (视觉风格)
- 小红书官方测试 (平台调性)

【灵感来源】
- Dribbble: 搜索"mental health app"
- Behance: 搜索"psychology test UI"
- Pinterest: 搜索"pastel UI design"

【配色参考】
- Coolors.co (配色生成器)
- Adobe Color (色彩搭配)
```

### 11.2 常见问题FAQ

```
Q1: 为什么选择紫色作为主色调?
A: 紫色在色彩心理学中代表疗愈、智慧、神秘,符合心理测试的
   专业性和温暖感定位。同时紫色在小红书平台较少使用,有辨识度。

Q2: 为什么采用单题单页的答题形式?
A: 减少认知负荷,让用户专注当前题目。同时通过自动跳转提升
   答题流畅度,降低放弃率。

Q3: 为什么免费结果只显示总分?
A: 制造"不完整感"促进付费转化,同时确保用户即使不付费也
   能获得基础价值(知道严重程度),避免纯营销感。

Q4: 雷达图为什么设计6个维度?
A: 基于社交焦虑的心理学模型,6个维度全面覆盖评估维度,同时
   雷达图呈现6个维度视觉效果最佳(对称性好)。

Q5: 为什么大量使用emoji?
A: 增加亲和力,降低心理测试的严肃感,符合Z世代用户的沟通习惯。
   同时emoji跨语言通用,便于后续国际化。
```

### 11.3 版本更新记录

```
V1.0 (2025-11-03)
- 完成MVP版本所有页面设计
- 定义完整视觉规范
- 提供开发注释和代码示例

待规划版本:
V1.1 - 增加好友对比功能
V1.2 - 增加21天训练营页面
V2.0 - 增加音频解读页面
```

---

## 📌 最后的话

这份原型设计文档基于PRD需求,完整定义了"社恐程度测试"产品的所有界面、交互和视觉规范。

**设计理念**：温暖的专业主义
- 不是冷冰冰的医学量表
- 不是哗众取宠的娱乐化
- 而是让用户感受到"被理解"的疗愈体验

**核心设计决策**：
1. **渐进式信息披露** - 从简到繁,避免信息过载
2. **情感化设计** - 用emoji和温暖文案建立情感连接
3. **可分享性优先** - 精美的雷达图和分享卡片是传播关键
4. **移动优先** - 100%适配移动端,流畅体验

**开发建议**：
- 先实现核心流程(P1→P3→P6)
- 再完善付费转化(P5)
- 最后优化分享功能(P7)

**期待效果**：
用户完成测试后的感受不是"被诊断",而是"被理解、被接纳、被赋能"。

---

**文档完成日期**: 2025年11月3日  
**设计师**: AI UX设计师  
**文档版本**: V1.0 完整版  
**对应PRD**: 社恐程度测试-产品需求文档（PRD）V1.0

---

**快速导航**：
- [页面原型设计](#四页面原型设计) - 查看所有页面布局
- [交互设计规范](#五交互设计规范) - 了解交互逻辑  
- [视觉设计规范](#六视觉设计规范) - 色彩/字体/间距
- [组件库](#七组件库) - 复用设计组件
- [开发注释](#九开发注释) - 代码实现参考

祝产品开发顺利! 🚀💜