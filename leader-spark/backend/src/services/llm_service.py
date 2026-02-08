"""
DeepSeek LLM 服务
"""
from typing import List, Dict, Optional, AsyncGenerator, Any
from openai import AsyncOpenAI
from src.core.config import settings
import tiktoken


class DeepSeekService:
    """DeepSeek LLM 服务"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL
        )
        self.chat_model = settings.DEEPSEEK_MODEL
        self.embedding_model = settings.DEEPSEEK_EMBEDDING_MODEL

        # 初始化 tokenizer 用于计算 tokens
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except:
            self.encoding = None

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        stream: bool = False
    ) -> AsyncGenerator[str, None] | Dict[str, Any]:
        """
        对话生成

        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大 token 数
            top_p: top_p 参数
            stream: 是否流式返回

        Returns:
            流式生成器或完整响应
        """
        params = {
            "model": self.chat_model,
            "messages": messages,
            "temperature": temperature or settings.DEFAULT_TEMPERATURE,
            "max_tokens": max_tokens or settings.DEFAULT_MAX_TOKENS,
            "top_p": top_p or settings.DEFAULT_TOP_P,
        }

        if stream:
            # 流式响应
            response = await self.client.chat.completions.create(**params, stream=True)

            async def generate():
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

            return generate()
        else:
            # 非流式响应
            response = await self.client.chat.completions.create(**params)

            return {
                "content": response.choices[0].message.content,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
                "model": response.model
            }

    async def get_embedding(self, text: str) -> List[float]:
        """
        获取文本嵌入向量

        Args:
            text: 输入文本

        Returns:
            嵌入向量
        """
        response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=text
        )

        return response.data[0].embedding

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        批量获取文本嵌入向量

        Args:
            texts: 输入文本列表

        Returns:
            嵌入向量列表
        """
        # DeepSeek API 支持批量请求
        response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=texts
        )

        return [item.embedding for item in response.data]

    async def classify_document(
        self,
        title: str,
        content: str,
        categories: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        AI 文档分类

        Args:
            title: 文档标题
            content: 文档内容（截取）
            categories: 可用分类列表 [{"id": "...", "name": "...", "description": "..."}]

        Returns:
            分类结果 {"category_id": "...", "confidence": 0.95}
        """
        # 构建分类提示
        category_list = "\n".join([
            f"- {cat['name']}: {cat.get('description', '')}"
            for cat in categories
        ])

        prompt = f"""请将以下文档分类到最合适的类别中：

文档标题：{title}

文档内容：
{content[:1000]}

可用类别：
{category_list}

请以 JSON 格式返回分类结果，包含以下字段：
- category_id: 最匹配的类别 ID
- confidence: 置信度（0-1 之间的浮点数）
- reason: 分类理由（简短说明）

返回示例：
{{
  "category_id": "uuid-here",
  "confidence": 0.95,
  "reason": "该文档主要讨论..."
}}"""

        messages = [
            {"role": "system", "content": "你是一个专业的文档分类助手。"},
            {"role": "user", "content": prompt}
        ]

        response = await self.chat(messages, temperature=0.3)

        # 解析 JSON 响应
        import json
        try:
            # 提取 JSON 部分
            content = response["content"]
            # 查找 JSON 部分
            start_idx = content.find("{")
            end_idx = content.rfind("}") + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                result = json.loads(json_str)
                return result
        except Exception as e:
            print(f"解析分类结果失败: {e}")

        # 如果解析失败，返回默认分类
        return {
            "category_id": categories[0]["id"] if categories else None,
            "confidence": 0.0,
            "reason": "自动分类失败"
        }

    async def generate_system_prompt(
        self,
        category_name: str,
        category_description: str,
        sample_content: Optional[str] = None
    ) -> str:
        """
        为分类生成系统提示词

        Args:
            category_name: 分类名称
            category_description: 分类描述
            sample_content: 示例内容（可选）

        Returns:
            生成的系统提示词
        """
        prompt = f"""请为以下知识库分类生成一个专业的系统提示词，用于 AI 对话系统：

分类名称：{category_name}
分类描述：{category_description}
"""

        if sample_content:
            prompt += f"\n参考内容示例：\n{sample_content[:500]}"

        prompt += """
要求：
1. 提示词应该明确定义 AI 的角色和职责
2. 提示词应该指导 AI 如何使用该分类的知识库内容
3. 提示词应该说明回答的风格和语气
4. 提示词长度在 200-500 字之间

请直接返回系统提示词内容，不要包含其他说明。"""

        messages = [
            {"role": "system", "content": "你是一个专业的提示词工程专家。"},
            {"role": "user", "content": prompt}
        ]

        response = await self.chat(messages, temperature=0.7)
        return response["content"]

    def count_tokens(self, text: str) -> int:
        """
        计算 token 数量

        Args:
            text: 输入文本

        Returns:
            token 数量
        """
        if self.encoding:
            return len(self.encoding.encode(text))
        else:
            # 粗略估计：1 token ≈ 4 字符（英文）或 1.5-2 字符（中文）
            chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
            other_chars = len(text) - chinese_chars
            return int(chinese_chars / 1.5 + other_chars / 4)

    def estimate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """
        估算调用费用

        Args:
            prompt_tokens: 输入 token 数
            completion_tokens: 输出 token 数
            model: 模型名称

        Returns:
            估算费用（USD）
        """
        model = model or self.chat_model

        if "chat" in model.lower():
            input_cost = prompt_tokens / 1000 * settings.DEEPSEEK_CHAT_INPUT_PRICE
            output_cost = completion_tokens / 1000 * settings.DEEPSEEK_CHAT_OUTPUT_PRICE
        else:
            # embedding
            input_cost = (prompt_tokens + completion_tokens) / 1000 * settings.DEEPSEEK_EMBEDDING_PRICE
            output_cost = 0

        return input_cost + output_cost

    async def generate_chat_title(
        self,
        first_message: str,
        max_length: int = 50
    ) -> str:
        """
        生成对话标题

        Args:
            first_message: 首条用户消息
            max_length: 最大长度

        Returns:
            生成的标题
        """
        prompt = f"""请为以下对话生成一个简洁的标题（不超过 {max_length} 字）：

用户消息：{first_message}

要求：
1. 标题应该概括对话的主题
2. 简洁明了，易于理解
3. 不要使用标点符号
4. 直接返回标题，不要其他内容"""

        messages = [
            {"role": "system", "content": "你是一个专业的对话标题生成助手。"},
            {"role": "user", "content": prompt}
        ]

        response = await self.chat(messages, temperature=0.5)
        title = response["content"].strip()

        # 截断过长的标题
        if len(title) > max_length:
            title = title[:max_length]

        return title


# 创建全局 DeepSeek 服务实例
deepseek_service = DeepSeekService()
