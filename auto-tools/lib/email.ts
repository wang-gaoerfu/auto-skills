import nodemailer from 'nodemailer'

// 邮件 transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.163.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }
  return transporter
}

// 发送邮件的通用函数
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const transport = getTransporter()

    const from = `"${process.env.SMTP_FROM_NAME || 'Auto-Tools'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`

    const info = await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    })

    console.log('邮件发送成功:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '发送失败' }
  }
}

// 发送欢迎邮件
export async function sendWelcomeEmail(email: string, name?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 欢迎加入 Auto-Tools</h1>
        </div>
        <div class="content">
          <p>您好${name ? `，${name}`：}，</p>
          <p>感谢您注册 Auto-Tools 自动化工具平台！</p>
          <p>我们提供上百种实用工具，帮助您提高工作效率。</p>
          <p style="text-align: center;">
            <a href="http://localhost:3000/login" class="button">立即登录</a>
          </p>
          <p>如果您有任何问题，请随时联系我们。</p>
        </div>
        <div class="footer">
          <p>本邮件由系统自动发送，请勿回复</p>
          <p>© 2024 Auto-Tools. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '欢迎加入 Auto-Tools',
    html,
    text: `欢迎加入 Auto-Tools！请访问 http://localhost:3000/login 登录。`,
  })
}

// 发送会员审核结果邮件
export async function sendMembershipEmail(
  email: string,
  name: string,
  status: 'approved' | 'rejected',
  plan: string,
  reason?: string
) {
  const isApproved = status === 'approved'
  const planNames: Record<string, string> = {
    FREE: '免费版',
    BASIC: '基础版',
    PRO: '专业版',
    ENTERPRISE: '企业版',
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isApproved ? '#10b981' : '#ef4444'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isApproved ? '✅ 会员申请已通过' : '❌ 会员申请未通过'}</h1>
        </div>
        <div class="content">
          <p>您好，${name}：</p>
          <div class="info-box">
            <p><strong>申请套餐：</strong>${planNames[plan] || plan}</p>
            <p><strong>审核结果：</strong>${isApproved ? '已通过' : '未通过'}</p>
            ${reason ? `<p><strong>原因：</strong>${reason}</p>` : ''}
          </div>
          ${isApproved ? `
            <p>恭喜您！现在您可以使用 Auto-Tools 的全部工具了。</p>
            <p style="text-align: center;">
              <a href="http://localhost:3000/tools" style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">开始使用工具</a>
            </p>
          ` : `
            <p>很遗憾，您的会员申请未通过。如有疑问，请联系客服。</p>
          `}
        </div>
        <div class="footer">
          <p>本邮件由系统自动发送，请勿回复</p>
          <p>© 2024 Auto-Tools. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: isApproved ? '会员申请已通过 - Auto-Tools' : '会员申请未通过 - Auto-Tools',
    html,
    text: isApproved
      ? `您的${planNames[plan]}会员申请已通过，请登录开始使用工具。`
      : `您的会员申请未通过。${reason ? `原因：${reason}` : ''}`,
  })
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 重置密码</h1>
        </div>
        <div class="content">
          <p>您好，</p>
          <p>我们收到了您重置密码的请求。</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">重置密码</a>
          </p>
          <p>或者复制以下链接到浏览器：</p>
          <p style="background: #f0f0f0; padding: 10px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⚠️ 注意：</strong></p>
            <ul>
              <li>此链接将在 1 小时后失效</li>
              <li>如果您没有请求重置密码，请忽略此邮件</li>
              <li>请勿将此链接分享给他人</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>本邮件由系统自动发送，请勿回复</p>
          <p>© 2024 Auto-Tools. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '重置密码 - Auto-Tools',
    html,
    text: `请访问以下链接重置密码：${resetUrl}`,
  })
}
