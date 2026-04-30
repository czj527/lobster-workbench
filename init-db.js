const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({
    host: 'db.wotpzpegbgpqzxesqcas.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Whyd0czj@!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // 读取并执行SQL
    const sql = fs.readFileSync('./supabase-schema.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Schema created successfully');
    
    // 插入示例数据
    await client.query(`
      INSERT INTO projects (name, description, status, progress, current_phase, icon, color)
      VALUES 
        ('龙虾工作台', '可视化项目管理平台，展示项目进度和任务看板', 'in_progress', 20, '开发阶段', '🦞', '#F59E0B'),
        ('Portfolio网站', '个人作品集展示网站', 'in_progress', 75, '测试阶段', '🌐', '#10B981')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample data inserted');
    
    // 插入示例任务
    await client.query(`
      INSERT INTO tasks (project_id, title, description, status, priority)
      SELECT 
        p.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority
      FROM projects p
      CROSS JOIN (VALUES
        ('初始化项目框架', '创建Next.js项目，配置Supabase', 'done', 3),
        ('设计数据模型', '定义projects、tasks表结构', 'done', 3),
        ('实现API接口', '创建Supabase API路由', 'in_progress', 2),
        ('前端页面开发', '开发首页和看板页面', 'todo', 2),
        ('部署上线', '部署到Vercel', 'todo', 1)
      ) AS t(title, description, status, priority)
      WHERE p.name = '龙虾工作台'
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample tasks inserted');
    
    // 插入示例活动
    await client.query(`
      INSERT INTO activity_log (content, type, project_id)
      SELECT 
        a.content,
        a.type,
        p.id
      FROM projects p
      CROSS JOIN (VALUES
        ('🦞 龙虾工作台项目初始化完成', 'success'),
        ('完成数据模型设计', 'info'),
        ('开始前端页面开发', 'info')
      ) AS a(content, type)
      WHERE p.name = '龙虾工作台'
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample activities inserted');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
