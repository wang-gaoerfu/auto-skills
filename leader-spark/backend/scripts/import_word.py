"""
从Word文档导入书籍内容到知识库
包含自动清洗功能：页眉、页脚、多余空格、页码等
"""
import docx2python
import re
from coze_coding_dev_sdk import KnowledgeClient, Config, KnowledgeDocument, DataSourceType, ChunkConfig


def clean_text(text):
    """
    清洗文本内容，去除页眉、页脚、页码等无关信息

    Args:
        text: 原始文本

    Returns:
        清洗后的文本
    """
    # 1. 去除多余的空行
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 2. 去除常见的页眉页脚模式
    # 页码模式：第x页、Page x、- x -、x/xx等
    text = re.sub(r'第\s*\d+\s*页', '', text)
    text = re.sub(r'Page\s*\d+', '', text)
    text = re.sub(r'-\s*\d+\s*-', '', text)
    text = re.sub(r'\d+/\d+', '', text)

    # 3. 去除纯数字行（可能是页码）
    text = re.sub(r'^\d+$', '', text, flags=re.MULTILINE)

    # 4. 去除常见的页眉页脚关键词
    footer_patterns = [
        r'领导力测评与发展.*?\n',  # 书名
        r'第\s*\d+\s*章.*?\n',      # 章节号（保留，但如果重复则去除）
        r'保密.*?\n',               # 保密声明
        r'内部资料.*?\n',           # 内部资料声明
        r'版权所有.*?\n',           # 版权信息
        r'All rights reserved.*?\n', # 英文版权信息
    ]
    for pattern in footer_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # 5. 去除多余的空格
    text = re.sub(r'[ \t]+', ' ', text)

    # 6. 去除每行首尾的空格
    lines = text.split('\n')
    lines = [line.strip() for line in lines if line.strip()]

    # 7. 去除过短的行（可能是乱码或页码）
    lines = [line for line in lines if len(line) > 2 or re.search(r'[一二三四五六七八九十]', line)]

    return '\n'.join(lines)


def extract_text_from_word(word_path):
    """
    从Word文档中提取所有文本（包括页眉页脚和表格）

    Args:
        word_path: Word文档路径

    Returns:
        提取的完整文本
    """
    try:
        print(f"   正在使用 docx2python 提取文本...")

        # 使用 docx2python 提取所有内容
        doc = docx2python.docx2python(word_path)

        # 获取所有文本（包括表格）
        # doc.text 返回文档中的所有文本内容
        full_text = doc.text

        # docx2python 会自动处理表格，将表格内容转换为文本
        # 页眉页脚也会包含在内，后续通过 clean_text 去除

        return full_text

    except Exception as e:
        print(f"❌ 读取Word文档失败：{str(e)}")
        return None


def import_word_to_knowledge(word_path, dataset_name="leadership_knowledge", chunk_size=1500):
    """
    将Word文档导入到知识库

    Args:
        word_path: Word文档路径
        dataset_name: 数据集名称
        chunk_size: 分块大小（token数）
    """
    print("=" * 60)
    print("📚 开始导入Word文档到知识库")
    print("=" * 60)

    # 步骤1：提取文本
    print(f"\n📖 步骤 1/4: 读取Word文档...")
    print(f"   文件路径: {word_path}")

    text = extract_text_from_word(word_path)

    if not text:
        print("❌ 提取文本失败，请检查文件格式！")
        return

    print(f"✅ 成功提取文本，共 {len(text)} 个字符")
    print(f"   大约 {len(text)//500} 页内容")

    # 步骤2：清洗文本
    print(f"\n🧹 步骤 2/4: 清洗文本内容...")
    print("   正在去除页眉、页脚、页码等无关信息...")

    cleaned_text = clean_text(text)

    print(f"✅ 清洗完成")
    print(f"   清洗前: {len(text)} 字符")
    print(f"   清洗后: {len(cleaned_text)} 字符")
    print(f"   清除: {len(text) - len(cleaned_text)} 字符")

    # 保存清洗后的文本（方便检查）
    output_txt = word_path.replace('.docx', '_cleaned.txt')
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write(cleaned_text)
    print(f"   清洗后文本已保存: {output_txt}")

    # 步骤3：配置分块
    print(f"\n⚙️  步骤 3/4: 配置分块参数...")
    print(f"   分块大小: {chunk_size} tokens")
    print(f"   分割符: 段落 (\\n\\n)")

    chunk_config = ChunkConfig(
        separator="\n\n",  # 按段落分割，保持内容完整性
        max_tokens=chunk_size,  # 每块大小
        remove_extra_spaces=True,  # 去除多余空格
        remove_urls_emails=False  # 不去除URL和邮箱（如有）
    )

    # 步骤4：导入知识库
    print(f"\n📤 步骤 4/4: 导入到知识库...")
    print(f"   数据集名称: {dataset_name}")

    try:
        # 初始化知识库客户端
        config = Config()
        client = KnowledgeClient(config=config)

        # 创建文档
        document = KnowledgeDocument(
            source=DataSourceType.TEXT,
            raw_data=cleaned_text
        )

        # 导入
        response = client.add_documents(
            documents=[document],
            table_name=dataset_name,
            chunk_config=chunk_config
        )

        if response.code == 0:
            print(f"\n✅✅✅ 导入成功！✅✅✅")
            print(f"\n📊 导入统计:")
            print(f"   文档ID: {response.doc_ids}")
            print(f"   数据集: {dataset_name}")
            print(f"   总字符: {len(cleaned_text)}")
            print(f"   分块大小: {chunk_size} tokens")
            print(f"\n🎉 现在可以使用Agent进行问答了！")
        else:
            print(f"\n❌ 导入失败：{response.msg}")

    except Exception as e:
        print(f"\n❌ 导入异常：{str(e)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python import_word.py <word文件路径> [数据集名称] [分块大小]")
        print("\n示例:")
        print("  python import_word.py my_book.docx")
        print("  python import_word.py my_book.docx leadership_knowledge 2000")
        sys.exit(1)

    word_path = sys.argv[1]
    dataset_name = sys.argv[2] if len(sys.argv) > 2 else "leadership_knowledge"
    chunk_size = int(sys.argv[3]) if len(sys.argv) > 3 else 1500

    import_word_to_knowledge(word_path, dataset_name, chunk_size)
