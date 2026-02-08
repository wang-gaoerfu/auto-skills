"""
知识库搜索工具
用于领导力测评与发展知识库的向量检索
"""
from langchain.tools import tool
from coze_coding_dev_sdk import KnowledgeClient, Config
from coze_coding_utils.runtime_ctx.context import new_context


@tool
def search_leadership_knowledge(query: str) -> str:
    """
    在领导力测评与发展知识库中搜索相关信息

    Args:
        query: 用户的问题或关键词

    Returns:
        检索到的知识库内容，包含匹配度分数和内容片段
    """
    ctx = new_context(method="search_leadership_knowledge")

    try:
        config = Config()
        client = KnowledgeClient(config=config, ctx=ctx)

        # 搜索知识库，返回最相关的5条结果
        response = client.search(
            query=query,
            top_k=5,
            min_score=0.3  # 设置最低相似度阈值（临时降低到0.3以匹配现有内容）
        )

        if response.code != 0:
            return f"知识库搜索失败：{response.msg}"

        if not response.chunks:
            return "未在知识库中找到相关内容。"

        # 格式化返回结果
        results = []
        for i, chunk in enumerate(response.chunks, 1):
            results.append(f"【知识库片段{i}】(相似度: {chunk.score:.2f})\n{chunk.content}")

        return "\n\n".join(results)

    except Exception as e:
        return f"知识库搜索异常：{str(e)}"


@tool
def check_knowledge_relevance(query: str) -> str:
    """
    检查用户问题是否在知识库范围内

    Args:
        query: 用户的问题

    Returns:
        返回是否找到相关内容以及相关性评分
    """
    ctx = new_context(method="check_knowledge_relevance")

    try:
        config = Config()
        client = KnowledgeClient(config=config, ctx=ctx)

        # 搜索并获取最高匹配度结果
        response = client.search(
            query=query,
            top_k=1,
            min_score=0.0  # 不设置阈值，获取所有结果
        )

        if response.code != 0:
            return f"检查失败：{response.msg}"

        if not response.chunks:
            return "NO_MATCH|知识库中未找到任何相关内容"

        # 获取最高分的片段
        top_chunk = response.chunks[0]

        # 根据分数判断相关性（临时调整阈值以匹配现有"教练技术"内容）
        if top_chunk.score >= 0.5:
            return f"HIGH_MATCH|{top_chunk.score:.2f}|{top_chunk.content[:200]}..."
        elif top_chunk.score >= 0.3:
            return f"MEDIUM_MATCH|{top_chunk.score:.2f}|{top_chunk.content[:200]}..."
        else:
            return f"LOW_MATCH|{top_chunk.score:.2f}|知识库中的内容与您的问题相关性较低"

    except Exception as e:
        return f"检查异常：{str(e)}"
