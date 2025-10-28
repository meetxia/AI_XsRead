/**
 * TXT文件解析工具
 * 用于解析上传的TXT小说文件
 */

// 分类映射（根据标题关键词自动分类）
const CATEGORY_MAP = {
  101: { name: '现代言情', keywords: ['总裁', '豪门', '婚姻', '恋爱', '暧昧', '前任', '闪婚', '未婚夫', '男朋友', '室友'] },
  102: { name: '古风穿越', keywords: ['穿越', '重生', '古风', '宫廷', '王爷', '嫡女', '皇上', '太子'] },
  103: { name: '悬疑推理', keywords: ['悬疑', '推理', '真相', '谜团', '杀手', '死亡', '监控', '双胞胎'] },
  104: { name: '治愈系', keywords: ['治愈', '温暖', '咖啡', '相遇', '温柔', '遗愿', '学长'] },
  105: { name: '玄幻奇幻', keywords: ['修真', '仙侠', '玄幻', '灵气', '大佬', '师兄', '师妹', '尾巴'] },
  106: { name: '科幻未来', keywords: ['科幻', '星际', '未来', '机甲', '游戏', '测试', '虚拟'] }
};

/**
 * 根据标题自动分类
 * @param {string} title 小说标题
 * @returns {number} 分类ID
 */
function getCategoryId(title) {
  for (const [categoryId, info] of Object.entries(CATEGORY_MAP)) {
    if (info.keywords.some(keyword => title.includes(keyword))) {
      return parseInt(categoryId);
    }
  }
  return 101; // 默认：现代言情
}

/**
 * 生成随机作者名
 * @returns {string} 作者名
 */
function generateAuthorName() {
  const prefixes = ['温柔', '墨染', '清风', '流年', '浅笑', '梦回', '烟雨', '星辰'];
  const suffixes = ['笔触', '流年', '明月', '如歌', '依依', '未央', '浅浅', '微凉'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return prefix + suffix;
}

/**
 * 解析TXT文件内容
 * @param {string} content 文件内容
 * @param {string} filename 文件名
 * @returns {Object} 解析后的数据
 */
function parseTxtContent(content, filename) {
  // 提取标题（去除.txt后缀）
  const title = filename.replace(/\.txt$/i, '').trim();
  
  // 清理内容（去除BOM、统一换行符）
  let cleanContent = content.replace(/^\uFEFF/, ''); // 移除BOM
  cleanContent = cleanContent.replace(/\r\n/g, '\n'); // 统一换行符
  cleanContent = cleanContent.trim();
  
  // 计算字数（去除空白字符）
  const wordCount = cleanContent.replace(/\s/g, '').length;
  
  // 生成简介（取前200字，智能截断）
  let description = cleanContent.substring(0, 200).replace(/\n/g, ' ').trim();
  
  // 如果有明显的分段，取第一段或第二段作为简介
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  if (paragraphs.length > 0) {
    // 跳过可能的标题行，取实际内容段
    const contentParagraph = paragraphs.find(p => p.length > 50) || paragraphs[0];
    if (contentParagraph) {
      description = contentParagraph.substring(0, 200).replace(/\n/g, ' ').trim();
    }
  }
  
  if (description.length >= 200) {
    description += '...';
  }
  
  // 自动分类
  const categoryId = getCategoryId(title);
  
  // 生成作者名
  const author = generateAuthorName();
  
  // 生成随机统计数据（模拟真实小说）
  const stats = {
    views: Math.floor(Math.random() * 10000) + 500,
    likes: Math.floor(Math.random() * 1000) + 50,
    collections: Math.floor(Math.random() * 500) + 20,
    rating: (4 + Math.random()).toFixed(2),
    ratingCount: Math.floor(Math.random() * 100) + 10,
    isRecommended: Math.random() > 0.6 ? 1 : 0,
    isHot: Math.random() > 0.7 ? 1 : 0
  };
  
  return {
    title,
    author,
    content: cleanContent,
    wordCount,
    description,
    categoryId,
    stats
  };
}

/**
 * 验证TXT文件
 * @param {Object} fileData 文件数据
 * @returns {Object} 验证结果
 */
function validateTxtFile(fileData) {
  const errors = [];
  
  // 检查标题
  if (!fileData.title || fileData.title.length < 2) {
    errors.push('标题太短，至少需要2个字符');
  }
  
  if (fileData.title.length > 100) {
    errors.push('标题太长，最多100个字符');
  }
  
  // 检查内容
  if (!fileData.content || fileData.content.length < 100) {
    errors.push('内容太短，至少需要100个字符');
  }
  
  if (fileData.wordCount < 500) {
    errors.push('字数太少，建议至少500字');
  }
  
  if (fileData.wordCount > 1000000) {
    errors.push('字数太多，超长小说建议分章节上传');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  parseTxtContent,
  validateTxtFile,
  getCategoryId,
  generateAuthorName,
  CATEGORY_MAP
};

