-- 龙虾工作台数据库初始化脚本
-- 执行方式: 在Supabase Dashboard的SQL Editor中执行，或通过psql连接执行

-- 1. projects 表 (项目主表)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'paused')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_phase VARCHAR(100),
    icon VARCHAR(50) DEFAULT '📦',
    color VARCHAR(7) DEFAULT '#6366F1',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. tasks 表 (任务表)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'testing', 'done')),
    priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
    due_date DATE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. activity_log 表 (活动日志)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. events 表 (事件总线，用于项目间通信)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    source VARCHAR(100),
    target VARCHAR(100),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略 (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 允许公开读取所有数据
CREATE POLICY "Allow public read on projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read on tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read on activity_log" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public read on events" ON events FOR SELECT USING (true);

-- Service Role 可以写入 (Supabase会自动处理)
-- 注：anon key 只能读取，service_role 可以写入
