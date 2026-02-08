# yt-dlp 视频下载助手

一个便捷的视频下载技能，基于强大的 yt-dlp 工具，支持从数百个网站下载视频内容。

## 功能特性

- 支持数百个视频网站（YouTube、Bilibili、Twitter、Instagram 等）
- 多种格式选择（MP4、MP3、最佳质量等）
- 播放列表下载支持
- 字幕下载和嵌入
- 代理支持
- Cookies 认证支持
- 视频信息提取（不下载）

## 快速开始

### 安装依赖

首先需要安装 yt-dlp：

```bash
pip install yt-dlp
```

或使用包管理器：

```bash
# Windows (winget)
winget install yt-dlp

# macOS (Homebrew)
brew install yt-dlp

# Linux (Debian/Ubuntu)
sudo apt install yt-dlp
```

可选：安装 FFmpeg（用于合并视频/音频、转换格式）：

```bash
# Windows
winget install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

### 基本使用

```bash
# 下载视频（最佳质量）
/yt-dlp url="https://youtube.com/watch?v=xxx"

# 下载为 MP3 音频
/yt-dlp url="视频链接" format="mp3"

# 下载指定质量（1080p）
/yt-dlp url="视频链接" quality="1080"

# 下载带字幕
/yt-dlp url="视频链接" subtitle="true"

# 下载播放列表的前 5 个视频
/yt-dlp url="播放列表链接" playlist="true" playlist-start=1 playlist-end=5

# 使用代理下载
/yt-dlp url="视频链接" proxy="socks5://127.0.0.1:1080"
```

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| url | string | ✅ | - | 视频 URL 地址 |
| output | string | ❌ | 当前目录 | 输出目录或文件名模板 |
| format | string | ❌ | best | 视频/音频格式 |
| quality | string | ❌ | - | 视频质量（如 1080p, 720p） |
| subtitle | boolean | ❌ | false | 是否下载字幕 |
| subtitle-lang | string | ❌ | - | 字幕语言（如 zh-Hans, en） |
| thumbnail | boolean | ❌ | false | 是否下载缩略图 |
| playlist | boolean | ❌ | false | 是否下载整个播放列表 |
| playlist-start | number | ❌ | - | 播放列表起始位置 |
| playlist-end | number | ❌ | - | 播放列表结束位置 |
| proxy | string | ❌ | - | 代理地址 |
| cookies | string | ❌ | - | Cookies 文件路径 |
| extract-only | boolean | ❌ | false | 仅提取信息不下载 |
| verbose | boolean | ❌ | false | 显示详细输出 |
| force | boolean | ❌ | false | 强制覆盖已存在的文件 |

### format 参数选项

| 值 | 说明 |
|---|------|
| best | 最佳质量（默认） |
| mp4 | MP4 格式 |
| mp3 | 仅音频（MP3 格式） |
| bestvideo+bestaudio | 最佳视频 + 最佳音频（合并） |
| worst | 最低质量 |

## 使用示例

### 下载 YouTube 视频

```bash
/yt-dlp url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 下载 Bilibili 视频（1080p）

```bash
/yt-dlp url="https://www.bilibili.com/video/BV1xx411c7mD" quality="1080"
```

### 提取视频为 MP3

```bash
/yt-dlp url="视频链接" format="mp3" output="~/Music/%(title)s.%(ext)s"
```

### 下载带中文字幕的视频

```bash
/yt-dlp url="视频链接" subtitle="true" subtitle-lang="zh-Hans"
```

### 仅查看视频信息（不下载）

```bash
/yt-dlp url="视频链接" extract-only="true"
```

### 下载播放列表（指定范围）

```bash
/yt-dlp url="播放列表链接" playlist="true" playlist-start=1 playlist-end=3
```

### 使用代理和 Cookies 下载受限内容

```bash
/yt-dlp url="视频链接" proxy="socks5://127.0.0.1:1080" cookies="cookies.txt"
```

## 输出文件命名

使用 `output` 参数自定义输出文件名，支持的格式化选项：

| 模板 | 说明 |
|------|------|
| %(title)s | 视频标题 |
| %(uploader)s | 上传者 |
| %(upload_date)s | 上传日期 |
| %(duration)s | 时长（秒） |
| %(view_count)s | 观看次数 |
| %(ext)s | 文件扩展名 |

示例：

```bash
# 按标题保存
/yt-dlp url="视频链接" output="%(title)s.%(ext)s"

# 按上传者和标题保存
/yt-dlp url="视频链接" output="%(uploader)s/%(title)s.%(ext)s"

# 按日期和标题保存
/yt-dlp url="视频链接" output="%(upload_date)s-%(title)s.%(ext)s"
```

## 支持的网站

部分常用网站：

- YouTube (youtube.com, youtu.be)
- Bilibili (bilibili.com)
- Twitter/X (twitter.com, x.com)
- Instagram (instagram.com)
- TikTok (tiktok.com)
- 抖音 (douyin.com)
- 微博 (weibo.com)
- 知乎 (zhihu.com)
- Vimeo (vimeo.com)

完整列表请查看：https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

## 注意事项

1. **版权问题**：请仅下载您有权下载的内容
2. **网络限制**：某些网站可能需要代理或登录才能访问
3. **定期更新**：建议定期更新 yt-dlp 以获取最新的网站支持
4. **播放列表**：下载播放列表前建议先使用 `extract-only=true` 查看视频数量

## 故障排除

### yt-dlp 未找到

确保已正确安装 yt-dlp：

```bash
pip install --upgrade yt-dlp
```

### 需要登录/验证

使用 Cookies 文件：

```bash
# 1. 使用浏览器导出 cookies.txt
# 2. 使用该文件下载
/yt-dlp url="视频链接" cookies="cookies.txt"
```

### 下载失败

尝试以下步骤：

1. 更新 yt-dlp：`pip install -U yt-dlp`
2. 使用代理：`proxy="socks5://127.0.0.1:1080"`
3. 启用详细模式：`verbose="true"` 查看详细错误信息

## 许可证

MIT License

---

作者：Auto-Skills Team  
版本：1.0.0
