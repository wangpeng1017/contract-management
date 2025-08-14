-- 智能合同管理系统数据库表结构

-- 1. 合同分类表
CREATE TABLE contract_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 合同模板表
CREATE TABLE contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES contract_categories(id) ON DELETE SET NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing')),
    variables_extracted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 合同变量表
CREATE TABLE contract_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES contract_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'address', 'currency', 'percentage', 'select', 'textarea')),
    description TEXT,
    required BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    placeholder TEXT,
    options JSONB, -- 用于select类型的选项
    validation_rules JSONB, -- 验证规则
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, name)
);

-- 4. 生成的合同表
CREATE TABLE generated_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
    template_name VARCHAR(200),
    content TEXT NOT NULL,
    variables_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'downloaded')),
    file_path VARCHAR(500), -- PDF文件路径
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 聊天会话表
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
    collected_variables JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 聊天消息表
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_contract_templates_category ON contract_templates(category_id);
CREATE INDEX idx_contract_templates_status ON contract_templates(status);
CREATE INDEX idx_contract_variables_template ON contract_variables(template_id);
CREATE INDEX idx_contract_variables_order ON contract_variables(template_id, order_index);
CREATE INDEX idx_generated_contracts_template ON generated_contracts(template_id);
CREATE INDEX idx_generated_contracts_status ON generated_contracts(status);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_contract_categories_updated_at BEFORE UPDATE ON contract_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_variables_updated_at BEFORE UPDATE ON contract_variables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_contracts_updated_at BEFORE UPDATE ON generated_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认分类数据
INSERT INTO contract_categories (name, description, color) VALUES
('采购合同', '用于采购商品或服务的合同模板', '#10B981'),
('销售合同', '用于销售商品或服务的合同模板', '#3B82F6'),
('外贸合同', '用于进出口贸易的合同模板', '#8B5CF6'),
('上牌合同', '用于车辆上牌相关的合同模板', '#F59E0B'),
('服务合同', '用于提供各类服务的合同模板', '#EF4444'),
('其他合同', '其他类型的合同模板', '#6B7280');
