"""
密码验证工具
"""
import re
from typing import List, Tuple
from src.core.config import settings


class PasswordValidator:
    """密码验证器"""

    @staticmethod
    def validate(password: str) -> Tuple[bool, List[str]]:
        """
        验证密码强度

        Args:
            password: 待验证的密码

        Returns:
            (是否有效, 错误消息列表)
        """
        errors = []

        # 检查长度
        if len(password) < settings.PASSWORD_MIN_LENGTH:
            errors.append(f"密码长度至少需要 {settings.PASSWORD_MIN_LENGTH} 位")

        # 检查大写字母
        if not re.search(r'[A-Z]', password):
            errors.append("密码必须包含至少一个大写字母")

        # 检查小写字母
        if not re.search(r'[a-z]', password):
            errors.append("密码必须包含至少一个小写字母")

        # 检查数字
        if not re.search(r'\d', password):
            errors.append("密码必须包含至少一个数字")

        # 检查特殊字符
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            errors.append("密码必须包含至少一个特殊字符")

        return len(errors) == 0, errors

    @staticmethod
    def generate_random(length: int = 12) -> str:
        """
        生成随机密码

        Args:
            length: 密码长度

        Returns:
            随机密码
        """
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password


def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """
    验证密码强度（便捷函数）

    Args:
        password: 待验证的密码

    Returns:
        (是否有效, 错误消息列表)
    """
    return PasswordValidator.validate(password)
