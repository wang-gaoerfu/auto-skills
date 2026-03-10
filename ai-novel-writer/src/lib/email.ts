import nodemailer from "nodemailer"

// 邮件配置
const mailConfig = {
  host: process.env.MAIL_SERVER || "smtp.163.com",
  port: Number(process.env.MAIL_PORT) || 465,
  secure: process.env.MAIL_USE_SSL === "true",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
}

// 创建邮件传输器
const transporter = nodemailer.createTransport(mailConfig)

// 生成验证码
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送验证码邮件
export async function sendVerificationCode(email: string, code: string) {
  const mailOptions = {
    from: process.env.MAIL_DEFAULT_SENDER,
    to: email,
    subject: "【墨飞小说创造】邮箱验证码",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">邮箱验证码</h2>
        <p>您好，</p>
        <p>您正在注册墨飞小说创造，验证码如下：</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
          ${code}
        </div>
        <p>验证码有效期为 <strong>10分钟</strong>，请尽快完成注册。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// 发送欢迎邮件
export async function sendWelcomeEmail(email: string, name?: string) {
  const mailOptions = {
    from: process.env.MAIL_DEFAULT_SENDER,
    to: email,
    subject: "欢迎加入墨飞小说创造",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">欢迎加入！</h2>
        <p>您好${name ? `，${name}` : ""}，</p>
        <p>欢迎使用 <strong>墨飞小说创造</strong>！</p>
        <p>您的账号已成功注册，现在可以开始体验AI辅助创作功能。</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">快速开始：</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>创建您的第一个小说项目</li>
            <li>使用AI生成大纲和章节</li>
            <li>探索知识库功能</li>
          </ul>
        </div>
        <p>祝您创作愉快！</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
