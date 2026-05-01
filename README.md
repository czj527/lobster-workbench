# 蓝的工作台 (Blue Workbench)

> 💙 个人工作台系统 - 基于 Next.js + Supabase 构建

## 功能特性

### 核心功能
- 📊 **项目管理** - 创建、跟踪和管理项目进度
- ✅ **任务管理** - 看板式任务管理
- 📅 **日历集成** - Google Calendar 同步
- 🤖 **AI 摘要** - 自动生成项目摘要
- 🔔 **实时通知** - Supabase Realtime 实时更新

### 组件清单

| 组件 | 说明 |
|------|------|
| `DashboardV2` | 首页仪表盘，综合展示项目、任务、活动 |
| `LiveStatus` | 实时状态文本框，显示蓝当前工作状态 |
| `ThemeToggle` | 主题切换按钮（亮/暗模式） |
| `AppShell` | 应用外壳，包含导航栏和侧边栏 |
| `Sidebar` | 侧边栏抽屉（移动端） |
| `RealtimeIndicator` | 实时连接状态指示器 |
| `NotificationCenter` | 通知中心 |
| `CalendarWidget` | 日历小部件 |
| `GitHubStatus` | GitHub 状态组件 |
| `AISummary` | AI 项目摘要 |
| `TaskSuggestions` | 任务建议 |
| `QuickAdd` | 快速添加任务 |

### API 接口

#### 状态 API

**GET /api/status** - 获取当前实时状态

响应：
```json
{
  "current_task": "修复手机端主题切换",
  "steps": [
    {"text": "排查代码", "status": "done"},
    {"text": "修复问题", "status": "doing"}
  ],
  "status": "working"
}
```

**POST /api/status** - 更新实时状态

请求：
```json
{
  "current_task": "任务描述",
  "steps": [
    {"text": "步骤1", "status": "done"},
    {"text": "步骤2", "status": "doing"},
    {"text": "步骤3", "status": "todo"}
  ],
  "status": "working"
}
```

状态值：`working` | `thinking` | `idle`

#### 其他 API

- `GET/POST /api/reports` - 生成项目报告
- `GET /api/ai/summary` - AI 摘要生成
- `GET /api/ai/suggest` - AI 任务建议
- `POST /api/ai/parse-task` - AI 解析任务
- `GET/POST /api/calendar` - 日历操作
- `POST /api/github/sync` - GitHub 同步

## 数据存储

### Supabase 表

| 表名 | 说明 |
|------|------|
| `projects` | 项目信息 |
| `tasks` | 任务列表 |
| `activity_log` | 活动日志 |
| `events` | 事件存储（含实时状态） |

实时状态存储在 `events` 表中，`event_type='live_status'`。

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

## 部署

部署到 Vercel：

```bash
# 设置环境变量
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY

# 推送部署
git push
```

Vercel 会自动检测并部署。

## 变更记录

### 2026-05-01
- ✅ 修复手机端主题切换问题
  - 修复 z-index 层级问题
  - 添加 Safari 隐私模式 localStorage 回退
  - 添加 hydration mismatch 防护
- ✅ 新增 LiveStatus 实时状态组件
  - 显示蓝当前工作状态
  - 步骤列表（完成/进行中/待做）
  - Supabase Realtime 实时更新
  - 脉冲动画指示在线状态
- ✅ 新增 /api/status 接口
  - GET 查询当前状态
  - POST 更新状态
- ✅ 初始化 live_status 数据

### 更早版本
- 初始版本搭建
- 看板功能
- AI 摘要集成
- 日历同步
