-- Leader-Spark 数据库初始化脚本
-- 此脚本在 PostgreSQL 容器首次启动时自动执行

-- ============================================
-- 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 用于模糊搜索

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',  -- 'admin' or 'user'
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' or 'disabled'
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    last_login_at TIMESTAMP,
    login_failed_count INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- 验证码表
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,  -- 'register', 'reset_password'
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- 删除过期验证码的定时任务（通过应用层实现）

-- ============================================
-- 分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    is_visible_to_users BOOLEAN DEFAULT FALSE,  -- 是否对用户可见
    sort_order INT DEFAULT 0,  -- 排序
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_categories_visible ON categories(is_visible_to_users);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================
-- 文档表
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,  -- 'docx', 'pdf', 'txt'
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'processing',  -- 'processing', 'completed', 'failed'
    error_message TEXT,
    chunk_count INT DEFAULT 0,  -- 分片数量
    vector_ids JSONB,  -- 存储Qdrant中的向量ID列表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);

-- ============================================
-- 聊天会话表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created ON chat_sessions(created_at DESC);

-- ============================================
-- 聊天消息表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- ============================================
-- Token使用统计表
-- ============================================
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10, 6) DEFAULT 0,  -- 预估费用（USD）
    model VARCHAR(50) NOT NULL,  -- 'deepseek-chat', 'deepseek-coder'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_token_usage_user ON token_usage(user_id);
CREATE INDEX idx_token_usage_created ON token_usage(created_at);

-- ============================================
-- 操作审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'upload_document', 'delete_document', etc.
    resource_type VARCHAR(50),  -- 'user', 'document', 'category', 'session'
    resource_id UUID,
    details JSONB,  -- 存储详细信息的JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success',  -- 'success' or 'failure'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_configs (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO system_configs (key, value, description) VALUES
    ('mail_server', 'smtp.163.com', '邮件服务器'),
    ('mail_port', '465', '邮件端口'),
    ('mail_use_ssl', 'true', '使用SSL'),
    ('mail_username', 'wangTest321@163.com', '发件邮箱'),
    ('mail_password', 'WVuUuxnuBBiWqi2x', '邮箱授权码'),
    ('mail_from_name', 'Leader-Spark平台', '发件人名称'),
    ('model_temperature', '0.7', '模型温度参数'),
    ('model_max_tokens', '2000', '模型最大Token数'),
    ('model_top_p', '0.9', '模型Top_P参数')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 默认管理员账户
-- ============================================
-- 密码: Admin@9000 (bcrypt hash)
INSERT INTO users (email, password_hash, role, status, nickname) VALUES
    ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEmc0i', 'admin', 'active', '系统管理员')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 视图：用户统计
-- ============================================
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id,
    u.email,
    u.role,
    u.status,
    u.created_at,
    COUNT(DISTINCT cs.id) as session_count,
    COUNT(DISTINCT cm.id) as message_count,
    COALESCE(SUM(tu.total_tokens), 0) as total_tokens,
    COALESCE(SUM(tu.estimated_cost), 0) as total_cost
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
LEFT JOIN token_usage tu ON u.id = tu.user_id
GROUP BY u.id;

-- ============================================
-- 视图：分类统计
-- ============================================
CREATE OR REPLACE VIEW category_statistics AS
SELECT
    c.id,
    c.name,
    c.is_visible_to_users,
    COUNT(DISTINCT d.id) as document_count,
    COALESCE(SUM(d.file_size), 0) as total_size,
    COUNT(DISTINCT cs.id) as session_count
FROM categories c
LEFT JOIN documents d ON c.id = d.category_id AND d.status = 'completed'
LEFT JOIN chat_sessions cs ON c.id = cs.category_id
GROUP BY c.id, c.name, c.is_visible_to_users;

-- ============================================
-- 完成
-- ============================================
-- 数据库初始化完成！
