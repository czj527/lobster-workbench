-- 创建 events 表用于存储日历日程
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'other', -- study, work, sync, other
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  source TEXT, -- entrocamp, workbench, coze, manual
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- 启用 RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 允许公开读取
CREATE POLICY "Allow public read" ON events FOR SELECT USING (true);

-- 允许公开插入更新删除
CREATE POLICY "Allow public insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON events FOR DELETE USING (true);

-- 插入示例日程数据
INSERT INTO events (title, event_type, event_date, start_time, end_time, source, data) VALUES
  ('🎯 读懂意图 每日上课', 'study', CURRENT_DATE, '01:00', '01:30', 'entrocamp', '{"course": "读懂意图", "duration": "30min"}'),
  ('🧠 记忆与学习 每日上课', 'study', CURRENT_DATE, '01:15', '01:45', 'entrocamp', '{"course": "记忆与学习", "duration": "30min"}'),
  ('🧩 推理与判断 每日上课', 'study', CURRENT_DATE, '01:30', '02:00', 'entrocamp', '{"course": "推理与判断", "duration": "30min"}'),
  ('💻 同步工作成果到蓝的工作台', 'sync', CURRENT_DATE, '18:00', '18:30', 'workbench', '{"task": "sync"}'),
  ('🎯 读懂意图 每日上课', 'study', CURRENT_DATE + INTERVAL '1 day', '01:00', '01:30', 'entrocamp', '{"course": "读懂意图", "duration": "30min"}'),
  ('🧠 记忆与学习 每日上课', 'study', CURRENT_DATE + INTERVAL '1 day', '01:15', '01:45', 'entrocamp', '{"course": "记忆与学习", "duration": "30min"}'),
  ('🧩 推理与判断 每日上课', 'study', CURRENT_DATE + INTERVAL '1 day', '01:30', '02:00', 'entrocamp', '{"course": "推理与判断", "duration": "30min"}'),
  ('💻 同步工作成果到蓝的工作台', 'sync', CURRENT_DATE + INTERVAL '1 day', '18:00', '18:30', 'workbench', '{"task": "sync"}'),
  ('🎯 读懂意图 每日上课', 'study', CURRENT_DATE + INTERVAL '2 days', '01:00', '01:30', 'entrocamp', '{"course": "读懂意图", "duration": "30min"}'),
  ('🧠 记忆与学习 每日上课', 'study', CURRENT_DATE + INTERVAL '2 days', '01:15', '01:45', 'entrocamp', '{"course": "记忆与学习", "duration": "30min"}'),
  ('🧩 推理与判断 每日上课', 'study', CURRENT_DATE + INTERVAL '2 days', '01:30', '02:00', 'entrocamp', '{"course": "推理与判断", "duration": "30min"}'),
  ('💻 同步工作成果到蓝的工作台', 'sync', CURRENT_DATE + INTERVAL '2 days', '18:00', '18:30', 'workbench', '{"task": "sync"}');
