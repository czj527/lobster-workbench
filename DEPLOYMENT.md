# 🦞 龙虾工作台 - 部署指南

## ✅ 已完成

- [x] GitHub仓库创建: https://github.com/czj527/lobster-workbench
- [x] Next.js项目初始化
- [x] Supabase客户端集成
- [x] 基础页面框架
- [x] 推送到GitHub

## ⏳ 待完成

### 1. 创建Supabase数据库表

在Supabase Dashboard中执行以下操作：

1. 打开 https://supabase.com/dashboard/project/wotpzpegbgpqzxesqcas
2. 点击左侧 **SQL Editor**
3. 新建查询，复制 `supabase-schema.sql` 文件内容并执行
4. 检查是否成功创建了以下表：
   - `projects` - 项目表
   - `tasks` - 任务表
   - `activity_log` - 活动日志
   - `events` - 事件总线

### 2. 部署到Vercel

#### 方式一：GitHub Connect（推荐）

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择 `czj527/lobster-workbench`
4. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wotpzpegbgpqzxesqcas.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_JGFZUvYJ3I7PB1n-bAD8Qw_AFBRVPVK`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHB6cGVnYmdwcXp4ZXNxY2FzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzUzNjUwNCwiZXhwIjoyMDkzMTEyNTA0fQ.g6mf20Vh6M8U06DvWk7K_cajexpd8L3QKfSzvnQrGlw`
5. 点击 Deploy

#### 方式二：Vercel CLI

```bash
cd lobster-workbench
vercel login
vercel --yes
```

### 3. 配置域名（可选）

部署完成后，可以在Vercel中配置自定义域名。

## 📁 项目结构

```
lobster-workbench/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 全局布局
│   │   ├── page.tsx            # 首页仪表盘
│   │   ├── globals.css         # 全局样式
│   │   └── projects/
│   │       ├── page.tsx        # 项目列表
│   │       └── [id]/page.tsx   # 项目详情
│   └── lib/
│       └── supabase/
│           ├── client.ts        # 浏览器客户端
│           ├── server.ts       # 服务端客户端
│           └── realtime.ts     # 实时订阅
├── supabase-schema.sql          # 数据库表结构
└── vercel.json                 # Vercel配置
```

## 🗄️ Supabase 表结构

| 表名 | 说明 |
|------|------|
| projects | 项目主表 |
| tasks | 任务表（Kanban看板） |
| activity_log | 活动日志 |
| events | 事件总线 |

## 🔧 本地开发

```bash
cd lobster-workbench
npm install
npm run dev
```

访问 http://localhost:3000

---

有任何问题请联系 🦞 龙虾AI
