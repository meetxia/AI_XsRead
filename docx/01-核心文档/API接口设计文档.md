# API接口设计文档

> 文字之境 - Vue3版本 RESTful API设计  
> 版本: v1.0  
> 创建日期: 2025-10-27

---

## 📋 接口设计原则

### 1. RESTful设计规范
- 使用标准HTTP方法: GET, POST, PUT, DELETE
- 使用名词而非动词: `/api/novels` 而非 `/api/getNovel`
- 使用复数形式: `/api/novels` 而非 `/api/novel`
- 正确使用HTTP状态码

### 2. 统一响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 实际数据
  },
  "timestamp": 1698765432000
}
```

#### 失败响应
```json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ],
  "timestamp": 1698765432000
}
```

### 3. HTTP状态码规范

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器错误 |

---

## 🔐 认证授权

### JWT Token认证

#### 请求头格式
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token刷新机制
- Access Token有效期: 2小时
- Refresh Token有效期: 7天
- Token即将过期时自动刷新

---

## 📚 接口列表

### 1. 用户认证模块

#### 1.1 用户注册

**接口地址**: `POST /api/auth/register`

**请求参数**:
```json
{
  "username": "string",      // 用户名 (3-20字符)
  "email": "string",         // 邮箱
  "password": "string",      // 密码 (6-20字符)
  "confirmPassword": "string" // 确认密码
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "userId": 1001,
    "username": "reader001",
    "email": "reader@example.com",
    "createdAt": "2025-10-27T10:00:00Z"
  }
}
```

#### 1.2 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "string",  // 用户名或邮箱
  "password": "string"   // 密码
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "user": {
      "id": 1001,
      "username": "reader001",
      "email": "reader@example.com",
      "avatar": "https://...",
      "role": "user"
    }
  }
}
```

#### 1.3 刷新Token

**接口地址**: `POST /api/auth/refresh`

**请求参数**:
```json
{
  "refreshToken": "string"
}
```

#### 1.4 用户登出

**接口地址**: `POST /api/auth/logout`

**请求头**: 需要Token

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功"
}
```

---

### 2. 用户信息模块

#### 2.1 获取当前用户信息

**接口地址**: `GET /api/user/profile`

**请求头**: 需要Token

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1001,
    "username": "reader001",
    "email": "reader@example.com",
    "avatar": "https://cdn.example.com/avatar/1001.jpg",
    "nickname": "温柔读者",
    "gender": 1,  // 0-保密, 1-女, 2-男
    "birthday": "1995-05-20",
    "bio": "喜欢阅读温柔的故事",
    "readingStats": {
      "totalBooks": 47,
      "readingBooks": 12,
      "finishedBooks": 35,
      "totalReadTime": 128,  // 小时
      "monthlyReadTime": 58   // 小时
    },
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2025-10-27T10:00:00Z"
  }
}
```

#### 2.2 更新用户信息

**接口地址**: `PUT /api/user/profile`

**请求头**: 需要Token

**请求参数**:
```json
{
  "nickname": "string",
  "avatar": "string",
  "gender": 0,
  "birthday": "1995-05-20",
  "bio": "string"
}
```

#### 2.3 修改密码

**接口地址**: `PUT /api/user/password`

**请求头**: 需要Token

**请求参数**:
```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

---

### 3. 小说模块

#### 3.1 获取小说列表

**接口地址**: `GET /api/novels`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码,默认1 |
| pageSize | int | 否 | 每页数量,默认20 |
| category | string | 否 | 分类筛选 |
| sort | string | 否 | 排序方式: latest(最新), hot(最热), recommend(推荐) |
| keyword | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "时光里的温柔相遇",
        "author": "温柔笔触",
        "authorId": 2001,
        "cover": "https://cdn.example.com/covers/1.jpg",
        "category": "都市言情",
        "categoryId": 101,
        "description": "那年春天,我在图书馆的角落遇见了他。阳光透过窗棂洒在他的书页上,恰好照亮了我的心房...",
        "wordCount": 128000,
        "chapterCount": 50,
        "status": 1,  // 0-完结, 1-连载中
        "likes": 2300,
        "views": 15600,
        "collections": 890,
        "lastChapterTitle": "第五十章:未完待续",
        "lastUpdateTime": "2025-10-24T15:30:00Z",
        "tags": ["甜文", "校园", "治愈"],
        "createdAt": "2025-08-01T10:00:00Z"
      },
      {
        "id": 2,
        "title": "长安月下,归人未归",
        "author": "墨染流年",
        "authorId": 2002,
        "cover": "https://cdn.example.com/covers/2.jpg",
        "category": "古风穿越",
        "categoryId": 102,
        "description": "宫墙深深,月色清冷。她站在长安城楼上,等待一个永远不会回来的人。三年了,那个许诺要回来娶她的少年郎,再无音讯...",
        "wordCount": 256000,
        "chapterCount": 100,
        "status": 1,
        "likes": 5800,
        "views": 32400,
        "collections": 2100,
        "lastChapterTitle": "第一百章:月下重逢",
        "lastUpdateTime": "2025-10-26T20:00:00Z",
        "tags": ["虐恋", "古风", "穿越"],
        "createdAt": "2025-06-15T08:00:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### 3.2 获取小说详情

**接口地址**: `GET /api/novels/:id`

**路径参数**:
- id: 小说ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "时光里的温柔相遇",
    "author": "温柔笔触",
    "authorId": 2001,
    "authorAvatar": "https://cdn.example.com/avatars/2001.jpg",
    "authorBio": "专注都市言情创作",
    "cover": "https://cdn.example.com/covers/1.jpg",
    "category": "都市言情",
    "categoryId": 101,
    "description": "详细简介...",
    "wordCount": 128000,
    "chapterCount": 50,
    "status": 1,
    "likes": 2300,
    "views": 15600,
    "collections": 890,
    "comments": 456,
    "rating": 4.8,
    "ratingCount": 234,
    "lastChapterTitle": "第五十章:未完待续",
    "lastUpdateTime": "2025-10-24T15:30:00Z",
    "tags": ["甜文", "校园", "治愈"],
    "isLiked": false,      // 当前用户是否点赞
    "isCollected": true,   // 当前用户是否收藏
    "readingProgress": {   // 当前用户阅读进度
      "chapterId": 15,
      "chapterTitle": "第十五章:雨中告白",
      "progress": 30  // 百分比
    },
    "createdAt": "2025-08-01T10:00:00Z",
    "updatedAt": "2025-10-24T15:30:00Z"
  }
}
```

#### 3.3 获取推荐小说

**接口地址**: `GET /api/novels/recommend`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量,默认10 |
| type | string | 否 | 推荐类型: editor(编辑推荐), hot(热门), new(新书) |

**响应示例**: 与小说列表相同格式

#### 3.4 获取分类列表

**接口地址**: `GET /api/categories`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 101,
      "name": "都市言情",
      "icon": "💕",
      "description": "现代都市爱情故事",
      "novelCount": 328,
      "order": 1
    },
    {
      "id": 102,
      "name": "古风穿越",
      "icon": "🏮",
      "description": "穿越古代,演绎传奇",
      "novelCount": 256,
      "order": 2
    },
    {
      "id": 103,
      "name": "悬疑推理",
      "icon": "🔍",
      "description": "烧脑推理,揭开谜团",
      "novelCount": 189,
      "order": 3
    },
    {
      "id": 104,
      "name": "治愈系",
      "icon": "🌸",
      "description": "温暖治愈,抚慰心灵",
      "novelCount": 412,
      "order": 4
    }
  ]
}
```

---

### 4. 章节模块

#### 4.1 获取章节列表

**接口地址**: `GET /api/novels/:novelId/chapters`

**路径参数**:
- novelId: 小说ID

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码,默认1 |
| pageSize | int | 否 | 每页数量,默认50 |
| order | string | 否 | 排序: asc(正序), desc(倒序) |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "novelId": 1,
    "novelTitle": "时光里的温柔相遇",
    "chapters": [
      {
        "id": 1,
        "novelId": 1,
        "chapterNumber": 1,
        "title": "第一章:图书馆的邂逅",
        "wordCount": 2580,
        "isFree": true,
        "publishTime": "2025-08-01T10:00:00Z",
        "updateTime": "2025-08-01T10:00:00Z"
      },
      {
        "id": 2,
        "novelId": 1,
        "chapterNumber": 2,
        "title": "第二章:意外的重逢",
        "wordCount": 2450,
        "isFree": true,
        "publishTime": "2025-08-02T10:00:00Z",
        "updateTime": "2025-08-02T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 50
  }
}
```

#### 4.2 获取章节内容

**接口地址**: `GET /api/chapters/:id`

**路径参数**:
- id: 章节ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "novelId": 1,
    "novelTitle": "时光里的温柔相遇",
    "chapterNumber": 1,
    "title": "第一章:图书馆的邂逅",
    "content": "那年春天,我在图书馆的角落遇见了他。\n\n阳光透过窗棂洒在他的书页上,恰好照亮了我的心房。那一刻,时间仿佛静止了,整个世界都安静下来,只剩下他翻书的沙沙声和我不安分的心跳。\n\n...",
    "wordCount": 2580,
    "isFree": true,
    "previousChapter": null,  // 上一章
    "nextChapter": {
      "id": 2,
      "title": "第二章:意外的重逢"
    },
    "publishTime": "2025-08-01T10:00:00Z",
    "updateTime": "2025-08-01T10:00:00Z"
  }
}
```

---

### 5. 书架模块

#### 5.1 获取书架列表

**接口地址**: `GET /api/bookshelf`

**请求头**: 需要Token

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型: reading(正在读), finished(已读完), collected(收藏) |
| page | int | 否 | 页码,默认1 |
| pageSize | int | 否 | 每页数量,默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "reading": {
      "count": 12,
      "novels": [
        {
          "id": 1001,
          "novel": {
            "id": 1,
            "title": "时光里的温柔相遇",
            "author": "温柔笔触",
            "cover": "https://...",
            "category": "都市言情",
            "chapterCount": 50,
            "wordCount": 128000
          },
          "currentChapter": {
            "id": 15,
            "chapterNumber": 15,
            "title": "第十五章:雨中告白"
          },
          "progress": 30,  // 阅读进度百分比
          "readingTime": 360,  // 阅读时长(分钟)
          "lastReadTime": "2025-10-27T09:00:00Z",
          "addedTime": "2025-10-01T08:00:00Z"
        }
      ]
    },
    "finished": {
      "count": 35,
      "novels": []
    },
    "collected": {
      "count": 58,
      "novels": []
    }
  }
}
```

#### 5.2 添加到书架

**接口地址**: `POST /api/bookshelf`

**请求头**: 需要Token

**请求参数**:
```json
{
  "novelId": 1,
  "type": "reading"  // reading, finished, collected
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "添加成功",
  "data": {
    "id": 1001,
    "novelId": 1,
    "type": "reading",
    "addedTime": "2025-10-27T10:00:00Z"
  }
}
```

#### 5.3 移除书架

**接口地址**: `DELETE /api/bookshelf/:id`

**请求头**: 需要Token

**路径参数**:
- id: 书架记录ID

**响应示例**:
```json
{
  "code": 204,
  "message": "移除成功"
}
```

#### 5.4 更新书架状态

**接口地址**: `PUT /api/bookshelf/:id`

**请求头**: 需要Token

**请求参数**:
```json
{
  "type": "finished"  // 更新类型
}
```

---

### 6. 阅读进度模块

#### 6.1 保存阅读进度

**接口地址**: `POST /api/reading/progress`

**请求头**: 需要Token

**请求参数**:
```json
{
  "novelId": 1,
  "chapterId": 15,
  "progress": 30,  // 当前章节阅读百分比
  "scrollPosition": 1280  // 滚动位置(可选)
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "保存成功"
}
```

#### 6.2 获取阅读进度

**接口地址**: `GET /api/reading/progress/:novelId`

**请求头**: 需要Token

**路径参数**:
- novelId: 小说ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "novelId": 1,
    "currentChapter": {
      "id": 15,
      "chapterNumber": 15,
      "title": "第十五章:雨中告白"
    },
    "progress": 30,
    "scrollPosition": 1280,
    "readingTime": 360,  // 累计阅读时长(分钟)
    "lastReadTime": "2025-10-27T09:00:00Z",
    "totalProgress": 30  // 整本书阅读进度
  }
}
```

#### 6.3 获取阅读历史

**接口地址**: `GET /api/reading/history`

**请求头**: 需要Token

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码,默认1 |
| pageSize | int | 否 | 每页数量,默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "novelId": 1,
        "novelTitle": "时光里的温柔相遇",
        "novelCover": "https://...",
        "chapterId": 15,
        "chapterTitle": "第十五章:雨中告白",
        "readTime": "2025-10-27T09:00:00Z",
        "duration": 25  // 本次阅读时长(分钟)
      }
    ],
    "total": 89,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 7. 互动模块

#### 7.1 点赞小说

**接口地址**: `POST /api/novels/:id/like`

**请求头**: 需要Token

**响应示例**:
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 2301
  }
}
```

#### 7.2 取消点赞

**接口地址**: `DELETE /api/novels/:id/like`

**请求头**: 需要Token

#### 7.3 收藏小说

**接口地址**: `POST /api/novels/:id/collect`

**请求头**: 需要Token

**响应示例**:
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "isCollected": true,
    "collectCount": 891
  }
}
```

#### 7.4 取消收藏

**接口地址**: `DELETE /api/novels/:id/collect`

**请求头**: 需要Token

#### 7.5 评论小说

**接口地址**: `POST /api/novels/:id/comments`

**请求头**: 需要Token

**请求参数**:
```json
{
  "content": "string",
  "rating": 5  // 1-5星评分
}
```

#### 7.6 获取评论列表

**接口地址**: `GET /api/novels/:id/comments`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码,默认1 |
| pageSize | int | 否 | 每页数量,默认20 |
| sort | string | 否 | 排序: latest(最新), hot(最热) |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 10001,
        "userId": 1001,
        "username": "reader001",
        "userAvatar": "https://...",
        "content": "非常好看的小说!文笔细腻,情感真挚。",
        "rating": 5,
        "likes": 23,
        "isLiked": false,
        "createdAt": "2025-10-26T10:00:00Z"
      }
    ],
    "total": 456,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 8. 搜索模块

#### 8.1 搜索小说

**接口地址**: `GET /api/search`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| type | string | 否 | 搜索类型: novel(小说), author(作者) |
| category | string | 否 | 分类筛选 |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

**响应示例**: 与小说列表相同格式

#### 8.2 获取搜索建议

**接口地址**: `GET /api/search/suggest`

**请求参数**:
- keyword: 关键词

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    "时光里的温柔相遇",
    "时光倒流",
    "时光旅人"
  ]
}
```

#### 8.3 获取热门搜索

**接口地址**: `GET /api/search/hot`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "rank": 1,
      "keyword": "长安月下归人未归",
      "count": 12580
    },
    {
      "rank": 2,
      "keyword": "星河尽头的她",
      "count": 10234
    }
  ]
}
```

---

### 9. 统计模块

#### 9.1 获取用户阅读统计

**接口地址**: `GET /api/user/statistics`

**请求头**: 需要Token

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "readingBooks": 12,
    "finishedBooks": 35,
    "totalBooks": 47,
    "totalReadTime": 128,  // 总阅读时长(小时)
    "monthlyReadTime": 58,  // 本月阅读时长(小时)
    "weeklyReadTime": 15,   // 本周阅读时长(小时)
    "todayReadTime": 2,     // 今日阅读时长(小时)
    "averageReadTime": 2.7, // 日均阅读时长(小时)
    "readingStreak": 7,     // 连续阅读天数
    "favoriteCategory": "都市言情",
    "readingTrend": [       // 阅读趋势(最近7天)
      {
        "date": "2025-10-21",
        "minutes": 120
      },
      {
        "date": "2025-10-22",
        "minutes": 90
      }
    ]
  }
}
```

#### 9.2 获取小说统计

**接口地址**: `GET /api/novels/:id/statistics`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "views": 15600,
    "likes": 2300,
    "collections": 890,
    "comments": 456,
    "shares": 123,
    "rating": 4.8,
    "ratingCount": 234,
    "dailyViews": 280,
    "weeklyViews": 1850,
    "monthlyViews": 7200
  }
}
```

---

### 10. 系统配置模块

#### 10.1 获取系统配置

**接口地址**: `GET /api/system/config`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "siteName": "文字之境",
    "siteDescription": "故事入境,杂念自消",
    "siteKeywords": "小说,阅读,女性向",
    "logo": "https://...",
    "favicon": "https://...",
    "themes": [
      {
        "id": "rose",
        "name": "玫瑰温情",
        "colors": {
          "primary": "#d95468",
          "secondary": "#ed7654"
        }
      }
    ],
    "features": {
      "registration": true,
      "comment": true,
      "share": true
    }
  }
}
```

---

## 📝 数据模型

### User (用户表)
```javascript
{
  id: Integer,
  username: String,
  email: String,
  password: String (加密),
  nickname: String,
  avatar: String,
  gender: Integer,
  birthday: Date,
  bio: String,
  role: String,  // user, vip, author, admin
  status: Integer,  // 0-禁用, 1-正常
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Novel (小说表)
```javascript
{
  id: Integer,
  title: String,
  authorId: Integer,
  categoryId: Integer,
  cover: String,
  description: Text,
  wordCount: Integer,
  chapterCount: Integer,
  status: Integer,  // 0-完结, 1-连载
  views: Integer,
  likes: Integer,
  collections: Integer,
  rating: Float,
  tags: Array,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Chapter (章节表)
```javascript
{
  id: Integer,
  novelId: Integer,
  chapterNumber: Integer,
  title: String,
  content: Text,
  wordCount: Integer,
  isFree: Boolean,
  publishTime: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Bookshelf (书架表)
```javascript
{
  id: Integer,
  userId: Integer,
  novelId: Integer,
  type: String,  // reading, finished, collected
  currentChapterId: Integer,
  progress: Integer,
  readingTime: Integer,
  lastReadTime: DateTime,
  addedTime: DateTime
}
```

### ReadingProgress (阅读进度表)
```javascript
{
  id: Integer,
  userId: Integer,
  novelId: Integer,
  chapterId: Integer,
  progress: Integer,
  scrollPosition: Integer,
  readingTime: Integer,
  lastReadTime: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## 🔒 安全建议

### 1. 密码安全
- 使用bcrypt加密密码
- 密码强度检查
- 限制登录失败次数

### 2. Token安全
- 使用JWT签名验证
- Token设置过期时间
- Refresh Token机制

### 3. 接口安全
- 请求频率限制(Rate Limiting)
- 参数校验
- SQL注入防护
- XSS防护
- CSRF防护

### 4. 数据安全
- HTTPS传输
- 敏感数据加密
- 数据库访问控制

---

## 📊 性能优化建议

### 1. 缓存策略
- Redis缓存热门数据
- 小说列表缓存30分钟
- 章节内容缓存1小时
- 用户信息缓存15分钟

### 2. 数据库优化
- 索引优化
- 分页查询
- 读写分离
- 主从复制

### 3. CDN加速
- 静态资源CDN
- 图片CDN
- 封面图片压缩

---

## 📌 版本控制

### API版本管理
```
v1: /api/v1/novels
v2: /api/v2/novels
```

### 版本更新日志
- v1.0 (2025-10-27): 初始版本
- v1.1 (计划中): 增加评论功能
- v2.0 (计划中): 增加付费章节功能

---

## 🧪 测试建议

### 单元测试
- 每个接口编写测试用例
- 测试正常情况和异常情况
- 测试边界条件

### 接口测试工具
- Postman
- Apifox
- Swagger

---

## 📞 联系方式

如有接口问题,请联系:
- 后端负责人: [联系方式]
- 技术文档: [文档地址]

---

*文档版本: v1.0*  
*最后更新: 2025-10-27*  
*维护者: 后端团队*

