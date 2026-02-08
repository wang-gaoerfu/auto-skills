"""
Qdrant 向量数据库服务
"""
from typing import List, Dict, Optional, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    FilterSelector
)
from src.core.config import settings
import uuid


class QdrantService:
    """Qdrant 向量数据库服务"""

    def __init__(self):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            grpc_port=settings.QDRANT_GRPC_PORT,
            api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
            prefer_grpc=True
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.vector_size = settings.EMBEDDING_DIMENSION

    async def initialize_collection(self):
        """初始化集合"""
        # 检查集合是否存在
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]

        if self.collection_name not in collection_names:
            # 创建新集合
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE
                )
            )
            print(f"创建 Qdrant 集合: {self.collection_name}")
        else:
            print(f"Qdrant 集合已存在: {self.collection_name}")

    async def insert_points(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        插入向量点

        Args:
            vectors: 向量列表
            payloads: 元数据列表
            ids: 点 ID 列表（可选，自动生成）

        Returns:
            插入的点 ID 列表
        """
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in range(len(vectors))]

        points = [
            PointStruct(
                id=point_id,
                vector=vector,
                payload=payload
            )
            for point_id, vector, payload in zip(ids, vectors, payloads)
        ]

        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )

        return ids

    async def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        score_threshold: float = 0.0,
        category_id: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        相似度搜索

        Args:
            query_vector: 查询向量
            limit: 返回结果数量
            score_threshold: 相似度阈值
            category_id: 分类 ID 过滤
            filters: 额外的过滤条件

        Returns:
            搜索结果列表
        """
        # 构建过滤条件
        query_filter = None

        conditions = []

        # 分类过滤
        if category_id:
            conditions.append(
                FieldCondition(key="category_id", match=MatchValue(value=category_id))
            )

        # 额外过滤条件
        if filters:
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )

        if conditions:
            query_filter = Filter(must=conditions)

        # 搜索
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit,
            score_threshold=score_threshold
        )

        # 格式化结果
        formatted_results = []
        for result in results:
            formatted_results.append({
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            })

        return formatted_results

    async def delete_points(self, point_ids: List[str]) -> bool:
        """
        删除向量点

        Args:
            point_ids: 点 ID 列表

        Returns:
            是否删除成功
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=FilterSelector(
                    points=[point_ids] if isinstance(point_ids, str) else point_ids
                )
            )
            return True
        except Exception as e:
            print(f"删除向量点失败: {e}")
            return False

    async def delete_by_filter(self, filters: Dict[str, Any]) -> bool:
        """
        按条件删除向量点

        Args:
            filters: 过滤条件

        Returns:
            是否删除成功
        """
        try:
            conditions = [
                FieldCondition(key=key, match=MatchValue(value=value))
                for key, value in filters.items()
            ]

            self.client.delete(
                collection_name=self.collection_name,
                points_selector=FilterSelector(
                    filter=Filter(must=conditions)
                )
            )
            return True
        except Exception as e:
            print(f"按条件删除向量点失败: {e}")
            return False

    async def get_collection_info(self) -> Dict[str, Any]:
        """
        获取集合信息

        Returns:
            集合信息字典
        """
        info = self.client.get_collection(self.collection_name)
        return {
            "name": info.config.params.vectors.size if info.config.params.vectors else 0,
            "points_count": info.points_count,
            "vectors_count": info.vectors_count,
            "indexed_vectors_count": info.indexed_vectors_count
        }

    async def clear_collection(self) -> bool:
        """
        清空集合

        Returns:
            是否清空成功
        """
        try:
            # 删除所有向量点，但保留集合配置
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=FilterSelector(
                    filter=Filter()  # 空过滤器表示选择所有点
                )
            )
            return True
        except Exception as e:
            print(f"清空集合失败: {e}")
            return False

    async def recreate_collection(self) -> bool:
        """
        重新创建集合（删除并创建）

        Returns:
            是否成功
        """
        try:
            # 先删除集合
            self.client.delete_collection(self.collection_name)
            # 等待删除完成
            import time
            time.sleep(1)
            # 创建新集合
            await self.initialize_collection()
            return True
        except Exception as e:
            print(f"重新创建集合失败: {e}")
            return False


# 创建全局 Qdrant 服务实例
qdrant_service = QdrantService()
