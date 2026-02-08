@echo off
REM Python Tools 虚拟环境激活脚本

echo ===============================
echo  Python Tools Environment
echo ===============================
echo.

cd /d "%~dp0"
call .venv\Scripts\activate.bat

echo.
echo 虚拟环境已激活!
echo.
echo 可用命令:
echo   python tools/ocr_tool.py --help
echo   python api/server.py
echo.
echo ===============================
