"""
邮件发送服务
"""
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import aiosmtplib
from jinja2 import Template

from src.core.config import settings


class EmailService:
    """邮件服务"""

    def __init__(self):
        self.hostname = settings.MAIL_SERVER
        self.port = settings.MAIL_PORT
        self.use_ssl = settings.MAIL_USE_SSL
        self.use_tls = settings.MAIL_USE_TLS
        self.username = settings.MAIL_USERNAME
        self.password = settings.MAIL_PASSWORD
        self.from_name = settings.MAIL_FROM_NAME
        self.from_email = settings.MAIL_USERNAME

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        发送邮件

        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            html_content: HTML 内容
            text_content: 纯文本内容（可选）

        Returns:
            是否发送成功
        """
        try:
            # 创建邮件
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            # 添加纯文本部分
            if text_content:
                text_part = MIMEText(text_content, "plain", "utf-8")
                message.attach(text_part)

            # 添加 HTML 部分
            html_part = MIMEText(html_content, "html", "utf-8")
            message.attach(html_part)

            # 发送邮件
            if self.use_ssl:
                # 使用 SSL（通常端口 465）
                async with aiosmtplib.SMTP_SSL(
                    hostname=self.hostname,
                    port=self.port,
                    timeout=30
                ) as smtp:
                    await smtp.login(self.username, self.password)
                    await smtp.send_message(message)
            else:
                # 使用 TLS 或普通连接（通常端口 25 或 587）
                async with aiosmtplib.SMTP(
                    hostname=self.hostname,
                    port=self.port,
                    timeout=30,
                    use_tls=self.use_tls
                ) as smtp:
                    if self.username and self.password:
                        await smtp.login(self.username, self.password)
                    await smtp.send_message(message)

            return True

        except Exception as e:
            print(f"发送邮件失败: {e}")
            return False

    async def send_verification_code(
        self,
        to_email: str,
        code: str,
        code_type: str = "register"
    ) -> bool:
        """
        发送验证码邮件

        Args:
            to_email: 收件人邮箱
            code: 验证码
            code_type: 验证码类型（register/reset_password）

        Returns:
            是否发送成功
        """
        if code_type == "register":
            subject = "【Leader-Spark】注册验证码"
        else:
            subject = "【Leader-Spark】密码重置验证码"

        # HTML 模板
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 40px 30px;
                }
                .code-box {
                    background-color: #f0f4ff;
                    border: 2px dashed #667eea;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }
                .code {
                    font-size: 36px;
                    font-weight: bold;
                    color: #667eea;
                    letter-spacing: 8px;
                    font-family: "Courier New", monospace;
                }
                .info {
                    color: #666;
                    font-size: 14px;
                    margin-top: 20px;
                }
                .footer {
                    background-color: #f5f5f5;
                    padding: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                }
                .warning {
                    color: #e74c3c;
                    font-size: 14px;
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #fee;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{{ header_title }}</h1>
                </div>
                <div class="content">
                    <p>您好，</p>
                    <p>您的验证码是：</p>
                    <div class="code-box">
                        <div class="code">{{ code }}</div>
                    </div>
                    <p class="info">验证码有效期为 <strong>{{ expire_minutes }}</strong> 分钟。</p>
                    <div class="warning">
                        ⚠️ 请勿将验证码告知他人，以免造成账户安全隐患。
                    </div>
                    <p class="info">如果这不是您的操作，请忽略此邮件。</p>
                </div>
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿直接回复。</p>
                    <p>&copy; 2025 Leader-Spark. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """)

        if code_type == "register":
            header_title = "欢迎注册 Leader-Spark"
        else:
            header_title = "重置您的密码"

        html_content = html_template.render(
            header_title=header_title,
            code=code,
            expire_minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES
        )

        # 纯文本内容
        text_content = f"""
您的验证码是：{code}

验证码有效期为 {settings.VERIFICATION_CODE_EXPIRE_MINUTES} 分钟。

如果这不是您的操作，请忽略此邮件。
"""

        return await self.send_email(to_email, subject, html_content, text_content)

    async def send_welcome_email(self, to_email: str, nickname: Optional[str] = None) -> bool:
        """
        发送欢迎邮件

        Args:
            to_email: 收件人邮箱
            nickname: 用户昵称

        Returns:
            是否发送成功
        """
        subject = "欢迎加入 Leader-Spark！"

        # HTML 模板
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }
                .content {
                    padding: 40px 30px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 欢迎加入 Leader-Spark！</h1>
                </div>
                <div class="content">
                    <p>您好{% if nickname %}，{{ nickname }}{% endif %}！</p>
                    <p>感谢您注册 Leader-Spark，您的账户已创建成功。</p>
                    <p>Leader-Spark 是一个专业的智能知识库平台，为您提供：</p>
                    <ul>
                        <li>💬 智能对话体验</li>
                        <li>📚 丰富的知识库内容</li>
                        <li>🎯 专业的分类咨询服务</li>
                    </ul>
                    <p>立即开始您的探索之旅吧！</p>
                    <center>
                        <a href="{{ app_url }}" class="button">开始使用</a>
                    </center>
                </div>
            </div>
        </body>
        </html>
        """)

        html_content = html_template.render(
            nickname=nickname,
            app_url=settings.APP_URL
        )

        return await self.send_email(to_email, subject, html_content)


# 创建全局邮件服务实例
email_service = EmailService()
