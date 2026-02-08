#!/bin/bash

# 知识库诊断脚本
# 快速检查知识库状态并提供修复建议

echo "================================================"
echo "🔍 领导力测评知识库诊断工具"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 诊断函数
check_knowledge_base() {
    echo "📊 步骤 1/4: 检查知识库内容..."
    echo ""

    local result=$(coze-coding-ai knowledge search --query "领导力" --top-k 3 2>&1)

    if echo "$result" | grep -q "未在知识库中找到相关内容"; then
        echo -e "${RED}❌ 知识库中未找到相关内容${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 知识库中找到相关内容${NC}"
        echo "$result" | head -5
        return 0
    fi
}

check_word_files() {
    echo ""
    echo "📁 步骤 2/4: 检查Word文件..."
    echo ""

    if ls assets/*.docx 1> /dev/null 2>&1; then
        echo -e "${GREEN}✅ 找到Word文件：${NC}"
        ls -lh assets/*.docx
        return 0
    else
        echo -e "${RED}❌ 未找到Word文件${NC}"
        echo ""
        echo "请将你的Word文档放到 assets/ 目录下"
        return 1
    fi
}

check_cleaned_files() {
    echo ""
    echo "📝 步骤 3/4: 检查清洗后的文本文件..."
    echo ""

    if ls assets/*_cleaned.txt 1> /dev/null 2>&1; then
        echo -e "${GREEN}✅ 找到清洗后的文本文件：${NC}"
        ls -lh assets/*_cleaned.txt
        return 0
    else
        echo -e "${YELLOW}⚠️  未找到清洗后的文本文件${NC}"
        echo ""
        echo "你可能还没有导入书籍，或导入时出现问题"
        return 1
    fi
}

show_recommendations() {
    echo ""
    echo "💡 步骤 4/4: 修复建议"
    echo "================================================"
    echo ""

    if check_knowledge_base; then
        # 知识库有内容
        if ! check_word_files; then
            echo ""
            echo -e "${YELLOW}📌 建议：知识库有内容，但未找到源文件${NC}"
            echo "这是正常的，如果Agent能正常回答，无需修复"
        else
            echo ""
            echo -e "${GREEN}✅ 知识库状态正常！${NC}"
            echo "如果Agent还是无法回答，请尝试调整阈值"
            echo ""
            echo "调整阈值方法："
            echo "1. 编辑文件: vi src/tools/knowledge_search_tool.py"
            echo "2. 修改以下阈值:"
            echo "   - HIGH_MATCH: 0.7 → 0.6"
            echo "   - MEDIUM_MATCH: 0.5 → 0.4"
            echo "   - min_score: 0.5 → 0.3"
        fi
    else
        # 知识库无内容
        if check_word_files; then
            echo ""
            echo -e "${RED}📌 问题：找到Word文件，但知识库中没有内容${NC}"
            echo ""
            echo -e "${GREEN}🔧 解决方案：导入书籍到知识库${NC}"
            echo ""
            echo "执行以下命令："
            echo "  python scripts/import_word.py assets/你的书籍.docx"
            echo ""
            echo "示例："
            echo "  python scripts/import_word.py assets/领导力测评书籍.docx"
        else
            echo ""
            echo -e "${RED}📌 问题：既没有找到Word文件，知识库也没有内容${NC}"
            echo ""
            echo -e "${GREEN}🔧 解决方案：准备书籍并导入${NC}"
            echo ""
            echo "步骤："
            echo "1. 将你的Word文档放到 assets/ 目录"
            echo "2. 确认文件名（例如：领导力测评书籍.docx）"
            echo "3. 执行导入命令:"
            echo "   python scripts/import_word.py assets/领导力测评书籍.docx"
        fi
    fi

    echo ""
    echo "================================================"
    echo ""
    echo "如果按照以上步骤仍然无法解决问题，"
    echo "请查看详细文档: docs/KNOWLEDGE_BASE_TROUBLESHOOTING.md"
}

# 主程序
main() {
    show_recommendations

    echo ""
    echo "是否需要导入书籍？(y/n)"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo ""
        echo "请输入你的Word文件名（例如：领导力测评书籍.docx）："
        read -r filename

        if [ -f "assets/$filename" ]; then
            echo ""
            echo -e "${GREEN}✅ 文件存在，开始导入...${NC}"
            echo ""
            python scripts/import_word.py "assets/$filename"
        else
            echo ""
            echo -e "${RED}❌ 文件不存在：assets/$filename${NC}"
            echo ""
            echo "请确认："
            echo "1. 文件是否在 assets/ 目录下"
            echo "2. 文件名是否正确"
            echo ""
            echo "当前assets目录下的文件："
            ls -lh assets/
        fi
    else
        echo ""
        echo "好的，你可以随时运行此脚本重新诊断"
    fi
}

# 执行主程序
main
