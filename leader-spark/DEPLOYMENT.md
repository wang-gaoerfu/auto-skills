# Leader-Spark 部署指南

> **版本**: v2.0
> **更新时间**: 2025-02-08
> **适用环境**: Linux Ubuntu 20.04+ / Debian 11+

---

## 目录

- [一、部署前准备](#一部署前准备)
- [二、开发环境快速部署](#二开发环境快速部署)
- [三、生产环境部署](#三生产环境部署)
- [四、Nginx 反向代理配置](#四nginx-反向代理配置)
- [五、SSL 证书配置](#五ssl-证书配置)
- [六、监控和维护](#六监控和维护)
- [七、故障排查](#七故障排查)
- [八、安全建议](#八安全建议)

---

## 一、部署前准备

### 1.1 服务器环境要求

#### 最低配置
| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 20GB 可用空间 | 50GB+ SSD |
| 操作系统 | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |

#### 网络端口
| 端口 | 用途 |
|------|------|
| 22 | SSH（必须开放） |
| 80 | HTTP |
| 443 | HTTPS |
| 3000 | 前端（可选，反向代理后可关闭） |
| 8000 | 后端 API（可选，反向代理后可关闭） |

### 1.2 获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录
3. 进入 API Keys 页面
4. 创建新的 API Key
5. **保存 API Key**（只显示一次，请妥善保管）

### 1.3 准备域名（可选）

如需配置 HTTPS：
- 购买域名（推荐阿里云、腾讯云）
- 域名 DNS 解析到服务器 IP

---

## 二、开发环境快速部署

适用于本地开发和测试。

### 2.1 安装 Docker

#### Ubuntu/Debian

```bash
# 1. 更新包索引
sudo apt-get update

# 2. 安装依赖
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 6. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 7. 验证安装
docker --version
```

#### CentOS/RHEL

```bash
# 1. 安装依赖
sudo yum install -y yum-utils

# 2. 添加 Docker 仓库
sudo yum-config-manager --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 3. 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 4. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 5. 验证安装
docker --version
```

### 2.2 安装 Docker Compose

```bash
# 下载最新版本的 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version

# 如果命令失败，创建软链接
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### 2.3 配置防火墙

```bash
# 如果使用 ufw（Ubuntu 默认防火墙）
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # 前端（开发）
sudo ufw allow 8000/tcp  # 后端 API（开发）

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 2.4 启动数据库服务

```bash
cd leader-spark/deploy

# 仅启动数据库和向量数据库
docker-compose up -d postgres qdrant

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f postgres
```

等待服务启动完成（约 10-20 秒）。

### 2.5 配置后端环境变量

```bash
cd leader-spark/backend

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**必须配置的环境变量：**

```bash
# DeepSeek API（必填）
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# 数据库密码
DB_PASSWORD=your_secure_password_here

# 密钥（用于加密，至少 32 位随机字符）
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-change-this-min-32-chars
```

生成密钥的方法：
```bash
# 生成 SECRET_KEY
openssl rand -hex 32

# 生成 JWT_SECRET_KEY
openssl rand -hex 32
```

### 2.6 安装 Python 依赖

```bash
cd leader-spark/backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.7 初始化数据库

```bash
cd leader-spark/deploy

# 检查数据库是否已初始化
docker exec leader-spark-postgres psql -U leader_spark -d leader_spark -c "\dt"

# 如果表不存在，初始化数据库
docker exec leader-spark-postgres psql -U leader_spark -d leader_spark -f /docker-entrypoint-initdb.d/init-db.sql
```

### 2.8 启动后端服务

```bash
cd leader-spark/backend

# 激活虚拟环境（如果未激活）
source venv/bin/activate

# 启动后端
cd src
python app.py

# 后端将在 http://localhost:8000 运行
# API 文档：http://localhost:8000/docs
```

### 2.9 安装前端依赖

```bash
cd leader-spark/frontend

# 使用 pnpm 安装依赖（推荐）
pnpm install

# 或使用 npm
npm install
```

### 2.10 配置前端环境变量

```bash
cd leader-spark/frontend

# 创建环境变量文件
cat > .env.local << 'EOF'
# API 配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 应用配置
NEXT_PUBLIC_APP_NAME=Spark
NEXT_PUBLIC_APP_VERSION=2.0.0

# 功能开关
NEXT_PUBLIC_ENABLE_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_USER_CHAT=true
EOF
```

### 2.11 启动前端服务

```bash
cd leader-spark/frontend

# 开发模式
pnpm dev

# 或
npm run dev

# 前端将在 http://localhost:3000 运行
```

---

## 三、生产环境部署

适用于生产环境部署。

### 3.1 上传代码到服务器

#### 方式一：Git 克隆（推荐）

```bash
# 在服务器上执行
mkdir -p ~/apps
cd ~/apps

# 克隆代码（替换为你的仓库地址）
git clone https://github.com/your-username/leader-spark.git
cd leader-spark

# 或使用 SSH 密钥
git clone git@github.com:your-username/leader-spark.git
```

#### 方式二：SCP 上传

```bash
# 在本地执行（压缩代码）
tar --exclude='node_modules' --exclude='venv' --exclude='__pycache__' \
    -czf leader-spark.tar.gz leader-spark/

# 上传到服务器
scp leader-spark.tar.gz root@your-server-ip:~/apps/

# 在服务器上解压
cd ~/apps
tar -xzf leader-spark.tar.gz
rm leader-spark.tar.gz
cd leader-spark
```

### 3.2 配置生产环境变量

```bash
cd leader-spark/backend

# 复制环境变量模板
cp .env.example .env.production

# 编辑生产环境变量
nano .env.production
```

**生产环境必须修改的配置：**

```bash
# 应用环境
APP_ENV=production
APP_DEBUG=false

# 应用 URL（替换为你的域名）
APP_URL=https://your-domain.com

# 数据库密码（生成强密码）
DB_PASSWORD=change_this_to_a_secure_password

# 密钥（生成新的密钥）
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# CORS 配置（添加你的域名）
CORS_ORIGINS=["https://your-domain.com"]

# 日志级别
LOG_LEVEL=WARNING
```

### 3.3 创建生产环境 Docker Compose 文件

```bash
cd leader-spark/deploy

# 创建生产环境配置
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    container_name: leader-spark-postgres
    restart: always
    environment:
      POSTGRES_USER: leader_spark
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-your_secure_password_here}
      POSTGRES_DB: leader_spark
      TZ: Asia/Shanghai
    ports:
      - "127.0.0.1:5432:5432"  # 仅本地访问
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U leader_spark"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - leader-spark-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Qdrant 向量数据库
  qdrant:
    image: qdrant/qdrant:v1.12.0
    container_name: leader-spark-qdrant
    restart: always
    ports:
      - "127.0.0.1:6333:6333"
      - "127.0.0.1:6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      TZ: Asia/Shanghai
    networks:
      - leader-spark-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # 后端 API
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: leader-spark-backend:latest
    container_name: leader-spark-backend
    restart: always
    ports:
      - "127.0.0.1:8000:8000"
    env_file:
      - ../backend/.env.production
    environment:
      TZ: Asia/Shanghai
      # 覆盖 docker-compose.yml 中的环境变量
    depends_on:
      postgres:
        condition: service_healthy
      qdrant:
        condition: service_started
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - leader-spark-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # 前端
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://backend:8000
    image: leader-spark-frontend:latest
    container_name: leader-spark-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      TZ: Asia/Shanghai
    depends_on:
      - backend
    networks:
      - leader-spark-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    driver: local
  qdrant_data:
    driver: local
  backend_uploads:
    driver: local

networks:
  leader-spark-network:
    driver: bridge
EOF
```

### 3.4 构建和启动服务

```bash
cd leader-spark/deploy

# 设置环境变量
export POSTGRES_PASSWORD=your_secure_password_here

# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 3.5 验证部署

```bash
# 1. 检查数据库
docker exec -it leader-spark-postgres psql -U leader_spark -d leader_spark
\dt
SELECT email, is_admin FROM users;
\q

# 2. 检查后端 API
curl http://localhost:8000/health

# 3. 检查前端
curl http://localhost:3000

# 4. 检查 Qdrant
curl http://localhost:6333/collections
```

---

## 四、Nginx 反向代理配置

### 4.1 安装 Nginx

```bash
sudo apt install -y nginx
```

### 4.2 创建站点配置

```bash
sudo nano /etc/nginx/sites-available/leader-spark
```

粘贴以下配置（替换 `your-domain.com` 为你的域名）：

```nginx
# HTTP - 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - 主配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL 证书路径（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # WebSocket 支持
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 后端 API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 支持 SSE (Server-Sent Events)
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        chunked_transfer_encoding on;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;  # 流式响应需要更长超时
        proxy_read_timeout 300s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 日志
    access_log /var/log/nginx/leader-spark-access.log;
    error_log /var/log/nginx/leader-spark-error.log;
}
```

### 4.3 启用配置

```bash
# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 启用站点配置
sudo ln -s /etc/nginx/sites-available/leader-spark /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 五、SSL 证书配置

### 5.1 安装 Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 获取 SSL 证书

```bash
# 自动获取并配置证书
sudo certbot --nginx -d your-domain.com

# Certbot 会自动修改 Nginx 配置
# 重载 Nginx 使配置生效
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 设置自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# Certbot 会自动添加 cron 任务
# 查看定时任务
sudo systemctl list-timers
```

---

## 六、监控和维护

### 6.1 查看服务状态

```bash
cd leader-spark/deploy

# 查看所有服务状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看磁盘使用
df -h
```

### 6.2 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f qdrant

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 6.3 数据备份

#### PostgreSQL 备份

```bash
# 创建备份脚本
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec leader-spark-postgres pg_dump -U leader_spark leader_spark | gzip > $BACKUP_DIR/leader_spark_db_$DATE.sql.gz

# 备份 Qdrant
docker run --rm \
  -v qdrant_data:/data:ro \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/qdrant_$DATE.tar.gz -C /data .

# 删除 30 天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh

# 设置定时备份（每天凌晨 2 点）
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh >> ~/backup.log 2>&1") | crontab -
```

#### 恢复数据库

```bash
# 恢复 PostgreSQL
zcat ~/backups/leader_spark_db_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i leader-spark-postgres psql -U leader_spark leader_spark

# 恢复 Qdrant
docker run --rm \
  -v qdrant_data:/data \
  -v ~/backups:/backup \
  alpine tar xzf /backup/qdrant_YYYYMMDD_HHMMSS.tar.gz -C /data
```

### 6.4 更新应用

```bash
cd leader-spark

# 拉取最新代码
git pull

# 或重新上传代码
# ...

# 重新构建并启动
cd deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 只重启某个服务
docker-compose -f docker-compose.prod.yml restart backend
```

### 6.5 查看资源使用

```bash
# 容器资源使用
docker stats

# 磁盘使用
df -h

# 内存使用
free -h

# Docker 磁盘使用
docker system df

# 清理未使用的 Docker 资源
docker system prune -a
```

---

## 七、故障排查

### 7.1 容器无法启动

#### 问题：容器启动失败

```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# 检查端口占用
sudo netstat -tlnp | grep -E ':(3000|8000|5432|6333)'

# 停止并删除容器
docker-compose down

# 重新启动
docker-compose up -d
```

#### 问题：数据库连接失败

```bash
# 检查数据库是否运行
docker exec leader-spark-postgres pg_isready -U leader_spark

# 进入数据库测试
docker exec -it leader-spark-postgres psql -U leader_spark -d leader_spark

# 检查网络连接
docker network inspect leader-spark-network

# 重启数据库
docker-compose restart postgres
```

### 7.2 API 错误

#### 问题：后端 API 500 错误

```bash
# 查看详细错误日志
docker-compose logs -f backend

# 进入容器调试
docker exec -it leader-spark-backend sh

# 检查环境变量
docker exec leader-spark-backend env | grep -E '(DB_|QDRANT_|DEEPSEEK_)'

# 手动测试 API
curl http://localhost:8000/api/v1/categories
```

#### 问题：前端无法连接后端

```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 检查环境变量配置
docker-compose exec leader-spark-frontend env | grep API

# 查看前端日志
docker-compose logs frontend
```

### 7.3 内存不足

#### 问题：服务因内存不足崩溃

```bash
# 检查内存使用
free -h

# 检查 Docker 内存限制
docker stats --no-stream

# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 7.4 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理 Docker 未使用资源
docker system prune -a --volumes

# 清理日志文件
sudo journalctl --vacuum-time=7d

# 查找大文件
sudo find / -type f -size +100M -exec ls -lh {} \;
```

---

## 八、安全建议

### 8.1 立即执行

| 安全措施 | 说明 |
|---------|------|
| 修改默认密码 | 修改数据库密码、管理员密码 |
| 更换密钥 | 生成新的 SECRET_KEY 和 JWT_SECRET_KEY |
| 配置防火墙 | 只开放必要的端口 |
| 启用 HTTPS | 使用 SSL 证书加密传输 |
| 定期备份 | 设置自动备份策略 |

### 8.2 应用安全

| 措施 | 说明 |
|------|------|
| 限制访问 | 通过防火墙限制 IP 访问管理端口 |
| 日志监控 | 定期检查异常日志 |
| 更新补丁 | 定期更新系统和依赖 |
| 弱口扫描 | 定期进行安全扫描 |

### 8.3 数据安全

| 措施 | 说明 |
|------|------|
| 数据备份 | 定期备份 PostgreSQL 和 Qdrant |
| 访问控制 | 使用最小权限原则 |
| 敏感数据加密 | 确保环境变量不泄露 |

---

## 九、快速部署脚本

创建一个一键部署脚本：

```bash
#!/bin/bash
set -e

echo "=================================="
echo "Leader-Spark 一键部署脚本"
echo "=================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo systemctl start docker
    sudo systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "正在安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 获取部署目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 配置环境变量
echo ""
echo "请配置生产环境变量："
read -p "请输入数据库密码: " DB_PASSWORD
read -p "请输入 DeepSeek API Key: " DEEPSEEK_API_KEY

# 生成密钥
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

echo ""
echo "正在配置环境变量..."

# 创建 .env.production
cat > "$PROJECT_DIR/backend/.env.production" << EOF
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY

DB_HOST=postgres
DB_PORT=5432
DB_NAME=leader_spark
DB_USER=leader_spark
DB_PASSWORD=$DB_PASSWORD

QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_API_KEY=

DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 邮件配置
MAIL_SERVER=smtp.163.com
MAIL_PORT=465
MAIL_USERNAME=wangTest321@163.com
MAIL_PASSWORD=WVuUuxnuBBiWqi2x

# CORS 配置
CORS_ORIGINS=["https://your-domain.com"]
EOF

# 更新 docker-compose.yml
sed -i "s/your_secure_password_here/$DB_PASSWORD/g" "$PROJECT_DIR/deploy/docker-compose.yml"

echo "环境变量配置完成！"
echo ""
echo "正在启动服务..."

cd "$PROJECT_DIR/deploy"

# 启动服务
docker-compose up -d --build

echo ""
echo "=================================="
echo "部署完成！"
echo "=================================="
echo ""
echo "默认管理员账户："
echo "  邮箱: admin@example.com"
echo "  密码: Admin@9000"
echo ""
echo "请立即修改默认密码！"
echo ""
echo "服务访问地址："
echo "  前端: http://your-server-ip:3000"
echo "  后端 API: http://your-server-ip:8000"
echo "  API 文档: http://your-server-ip:8000/docs"
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

**文档版本**: v2.0
**最后更新**: 2025-02-08
**维护者**: Leader-Spark Team
