/**
 * 极简邮件发送工具
 *
 * 设计目标：
 * - 不引入新 npm 依赖（nodemailer 等）
 * - 在 dev / test 环境直接 console.log，便于开发者拷贝重置链接
 * - 在 prod 环境，由运维替换为他们已经在用的 SMTP / 第三方 transactional API
 *
 * 调用：
 *   sendEmail({ to, subject, text, html })
 *     → { delivered: boolean, fallback: boolean }
 *
 * 行为：
 *   - process.env.SMTP_HOST 没设置 → console.log 并返回 { delivered:false, fallback:true }
 *   - 设置了 SMTP_* → TODO（运维接入）：当前实现仍走 fallback，并给 console.warn 提示
 */

/**
 * @param {{ to: string, subject: string, text?: string, html?: string }} payload
 * @returns {Promise<{ delivered: boolean, fallback: boolean }>}
 */
async function sendEmail(payload) {
  const { to, subject, text, html } = payload || {};
  if (!to || !subject) {
    throw new TypeError('sendEmail: to / subject 必填');
  }

  const hasSmtp = !!process.env.SMTP_HOST;

  if (!hasSmtp) {
    // 开发 / 测试：直接打印
    // eslint-disable-next-line no-console
    console.log('[mailer-fallback]', {
      to,
      subject,
      text: text || null,
      html: html ? '<html omitted>' : null
    });
    return { delivered: false, fallback: true };
  }

  // 生产：留给运维替换为他们的 transactional email API
  // TODO(prod-mailer): 接入团队选定的 SMTP / API（例如 SendGrid / Postmark / 阿里云 DM）
  //   - 在此处调用对应 SDK 或 fetch
  //   - 失败时抛错，调用方决定是否降级
  // eslint-disable-next-line no-console
  console.warn(
    '[mailer-fallback] SMTP_HOST 已配置但 mailer 尚未接入真实投递实现，邮件未真正发送：',
    { to, subject }
  );
  return { delivered: false, fallback: true };
}

/**
 * 构造重置密码链接
 * 前端域从 PASSWORD_RESET_FRONTEND_URL 读取，默认 http://localhost:3008/reset-password
 */
function buildPasswordResetLink(token) {
  const base =
    process.env.PASSWORD_RESET_FRONTEND_URL ||
    'http://localhost:3008/reset-password';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

module.exports = {
  sendEmail,
  buildPasswordResetLink
};
