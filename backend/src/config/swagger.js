/**
 * Swagger API 文档配置
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '文字之境 AI 小说阅读平台 API',
      version: '1.0.0',
      description: '文字之境小说阅读平台的 RESTful API 文档',
      contact: {
        name: 'AI_XsRead Team',
        email: 'support@aixsread.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8005',
        description: '开发环境'
      },
      {
        url: 'https://api.aixsread.com',
        description: '生产环境'
      }
    ],
    tags: [
      {
        name: '认证',
        description: '用户认证相关接口'
      },
      {
        name: '小说',
        description: '小说管理相关接口'
      },
      {
        name: '章节',
        description: '章节管理相关接口'
      },
      {
        name: '用户',
        description: '用户管理相关接口'
      },
      {
        name: '书架',
        description: '用户书架相关接口'
      },
      {
        name: '评论',
        description: '评论管理相关接口'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 认证 Token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '错误码'
            },
            message: {
              type: 'string',
              description: '错误信息'
            },
            timestamp: {
              type: 'integer',
              description: '时间戳'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            timestamp: {
              type: 'integer',
              description: '时间戳'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: '当前页码'
            },
            pageSize: {
              type: 'integer',
              description: '每页数量'
            },
            total: {
              type: 'integer',
              description: '总数'
            },
            totalPages: {
              type: 'integer',
              description: '总页数'
            }
          }
        },
        Novel: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '小说ID'
            },
            title: {
              type: 'string',
              description: '小说标题'
            },
            author: {
              type: 'string',
              description: '作者'
            },
            cover: {
              type: 'string',
              description: '封面图片URL'
            },
            description: {
              type: 'string',
              description: '简介'
            },
            category_id: {
              type: 'integer',
              description: '分类ID'
            },
            category_name: {
              type: 'string',
              description: '分类名称'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'finished'],
              description: '状态'
            },
            views: {
              type: 'integer',
              description: '浏览量'
            },
            likes: {
              type: 'integer',
              description: '点赞数'
            },
            rating: {
              type: 'number',
              format: 'float',
              description: '评分'
            },
            word_count: {
              type: 'integer',
              description: '字数'
            },
            chapter_count: {
              type: 'integer',
              description: '章节数'
            },
            is_finished: {
              type: 'boolean',
              description: '是否完结'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        Chapter: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '章节ID'
            },
            novel_id: {
              type: 'integer',
              description: '小说ID'
            },
            chapter_number: {
              type: 'integer',
              description: '章节序号'
            },
            title: {
              type: 'string',
              description: '章节标题'
            },
            content: {
              type: 'string',
              description: '章节内容'
            },
            word_count: {
              type: 'integer',
              description: '字数'
            },
            is_free: {
              type: 'boolean',
              description: '是否免费'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '用户ID'
            },
            username: {
              type: 'string',
              description: '用户名'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱'
            },
            avatar: {
              type: 'string',
              description: '头像URL'
            },
            role: {
              type: 'string',
              enum: ['user', 'author', 'admin'],
              description: '角色'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // 扫描路由文件中的注释
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

