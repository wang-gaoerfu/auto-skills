# Leader-Spark 部署指南

## 服务器环境要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+ / Debian 11+)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 至少 4GB
- **磁盘**: 至少 20GB 可用空间

---

## 一、服务器安装 Docker 和 Docker Compose

### 1.1 安装 Docker

```bash
# Ubuntu/Debian 系统
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 1.2 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

---

## 二、数据库安装（独立部署）

如果你想单独安装数据库（不使用 docker-compose）：

### 2.1 安装 PostgreSQL

```bash
# 使用 Docker 运行 PostgreSQL
docker run -d \
  --name leader-spark-postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=leader_spark \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -e POSTGRES_DB=leader_spark \
  -e TZ=Asia/Shanghai \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -v $(pwd)/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  postgres:16-alpine

# 等待数据库启动（约10秒）
sleep 10

# 验证连接
docker exec -it leader-spark-postgres psql -U leader_spark -d leader_spark -c "SELECT version();"
```

### 2.2 安装 Qdrant

```bash
# 使用 Docker 运行 Qdrant
docker run -d \
  --name leader-spark-qdrant \
  --restart unless-stopped \
  -p 6333:6333 \
  -p 6334:6334 \
  -v qdrant_data:/qdrant/storage \
  -e TZ=Asia/Shanghai \
  qdrant/qdrant:v1.12.0

# 验证运行
curl http://localhost:6333/
```

---

## 三、完整部署（推荐）

### 3.1 上传代码到服务器

```bash
# 在服务器上创建目录
mkdir -p ~/leader-spark
cd ~/leader-spark

# 上传代码（使用 git 或 scp）
# 方式1: Git 克隆
git clone <your-repo-url> .

# 方式2: SCP 上传（在本地执行）
scp -r leader-spark root@your-server-ip:~/leader-spark
```

### 3.2 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env.production

# 编辑环境变量（修改数据库密码、API密钥等）
nano backend/.env.production
```

### 3.3 修改 docker-compose.yml 中的密码

```bash
# 编辑 docker-compose.yml
nano deploy/docker-compose.yml

# 修改以下内容：
# 1. POSTGRES_PASSWORD 改为强密码
# 2. 确保端口没有被占用
```

### 3.4 启动所有服务

```bash
cd deploy

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

---

## 四、部署后验证

### 4.1 检查数据库

```bash
# 检查 PostgreSQL
docker exec -it leader-spark-postgres psql -U leader_spark -d leader_spark

# 在 psql 中执行：
\dt  -- 查看所有表
SELECT * FROM users;  -- 查看默认管理员账户
\q  -- 退出
```

### 4.2 检查 Qdrant

```bash
# 查看 Qdrant 集合
curl http://localhost:6333/collections

# 应返回类似：{"status":"ok","result":{"collections":[]}}
```

### 4.3 检查后端 API

```bash
# 健康检查
curl http://localhost:8000/health

# 应返回：{"status":"ok"}
```

### 4.4 检查前端

```bash
# 访问前端
curl http://localhost:3000

# 应返回 HTML 内容
```

---

## 五、常用管理命令

### 5.1 Docker Compose 命令

```bash
cd deploy

# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f [service-name]

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重新构建并启动
docker-compose up -d --build

# 删除所有容器和卷（危险！）
docker-compose down -v
```

### 5.2 数据库备份

```bash
# 备份 PostgreSQL
docker exec leader-spark-postgres pg_dump -U leader_spark leader_spark > backup_$(date +%Y%m%d).sql

# 恢复 PostgreSQL
cat backup_20250115.sql | docker exec -i leader-spark-postgres psql -U leader_spark leader_spark
```

### 5.3 Qdrant 备份

```bash
# Qdrant 数据存储在 Docker 卷中
# 备份整个卷
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant_backup_$(date +%Y%m%d).tar.gz -C /data .

# 恢复
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine tar xzf /backup/qdrant_backup_20250115.tar.gz -C /data
```

---

## 六、防火墙配置

```bash
# 如果使用 ufw 防火墙
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH

# 或者开放特定端口
sudo ufw allow 3000/tcp  # 前端
sudo ufw allow 8000/tcp  # 后端 API

# 启用防火墙
sudo ufw enable
sudo ufw status
```

---

## 七、Nginx 反向代理配置（可选）

如果你有域名，可以使用 Nginx 做反向代理：

```nginx
# /etc/nginx/sites-available/leader-spark

# 前端
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/leader-spark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 八、SSL 证书配置（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 九、故障排查

### 9.1 容器无法启动

```bash
# 查看容器日志
docker-compose logs [service-name]

# 查看容器详细信息
docker inspect [container-name]

# 进入容器调试
docker exec -it [container-name] sh
```

### 9.2 数据库连接失败

```bash
# 检查数据库是否运行
docker ps | grep postgres

# 测试数据库连接
docker exec -it leader-spark-postgres psql -U leader_spark -d leader_spark

# 检查网络
docker network ls
docker network inspect leader-spark-network
```

### 9.3 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000

# 修改 docker-compose.yml 中的端口映射
```

---

## 十、生产环境安全建议

1. **修改默认密码**: 修改 docker-compose.yml 中的数据库密码
2. **环境变量**: 不要在代码中硬编码敏感信息
3. **定期备份**: 设置定时任务备份数据库
4. **更新镜像**: 定期更新 Docker 镜像
5. **监控日志**: 使用日志管理工具监控异常
6. **限制访问**: 使用防火墙限制不必要的端口访问

---

## 快速启动命令（总结）

```bash
# 1. 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. 上传代码到服务器
cd ~/leader-spark

# 3. 配置环境变量
cp backend/.env.example backend/.env.production
nano backend/.env.production  # 修改配置

# 4. 启动服务
cd deploy
docker-compose up -d

# 5. 验证部署
docker-compose ps
docker-compose logs -f
```

---

## 默认账户

- **管理员邮箱**: admin@example.com
- **管理员密码**: Admin@9000

**部署后请立即修改默认密码！**
