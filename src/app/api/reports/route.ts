/**
 * 导出报告 API Route
 * 生成 Markdown 格式的项目报告
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: '缺少 project_id 参数' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    // 获取任务列表
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    // 获取活动日志
    const { data: activities } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // 生成 Markdown 报告
    const markdown = generateMarkdownReport(project, tasks || [], activities || [])

    // 返回 Markdown 文件
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="project-${project.name}-report.md"`,
      },
    })
  } catch (error) {
    console.error('生成报告失败:', error)
    return NextResponse.json({ error: '生成报告失败', details: String(error) }, { status: 500 })
  }
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  current_phase?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date?: string;
  created_at: string;
}

interface Activity {
  id: string;
  content: string;
  type: string;
  created_at: string;
}

function generateMarkdownReport(
  project: Project,
  tasks: Task[],
  activities: Activity[]
): string {
  const statusMap: Record<string, string> = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停',
  }

  const priorityMap: Record<number, string> = {
    1: '高优先级',
    2: '中优先级',
    3: '低优先级',
  }

  const taskStatusMap: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    testing: '测试中',
    done: '已完成',
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    testing: tasks.filter(t => t.status === 'testing'),
    done: tasks.filter(t => t.status === 'done'),
  }

  const now = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const icon = project.icon || '📦'
  
  let markdown = `# ${icon} ${project.name}

> 生成时间: ${now}

## 项目概览

| 属性 | 值 |
|------|-----|
| **状态** | ${statusMap[project.status] || project.status} |
| **进度** | ${project.progress}% |
| **当前阶段** | ${project.current_phase || '未设置'} |
| **创建时间** | ${new Date(project.created_at).toLocaleString('zh-CN')} |
| **最后更新** | ${new Date(project.updated_at).toLocaleString('zh-CN')} |

`

  if (project.description) {
    markdown += `## 项目描述

${project.description}

`
  }

  markdown += `## 任务统计

- **总计**: ${tasks.length} 个任务
- **待办**: ${tasksByStatus.todo.length} 个
- **进行中**: ${tasksByStatus.in_progress.length} 个
- **测试中**: ${tasksByStatus.testing.length} 个
- **已完成**: ${tasksByStatus.done.length} 个

`

  if (tasks.length > 0) {
    markdown += `## 任务列表

`
    tasks.forEach(task => {
      markdown += `### ${taskStatusMap[task.status] || task.status} ${priorityMap[task.priority] || ''}

- **标题**: ${task.title}
`
      if (task.description) {
        markdown += `- **描述**: ${task.description}
`
      }
      if (task.due_date) {
        markdown += `- **截止日期**: ${new Date(task.due_date).toLocaleDateString('zh-CN')}
`
      }
      markdown += `- **创建时间**: ${new Date(task.created_at).toLocaleString('zh-CN')}

---
`
    })
  } else {
    markdown += `> 暂无任务

`
  }

  if (activities.length > 0) {
    markdown += `## 活动日志

`
    activities.forEach(activity => {
      markdown += `- ${activity.content}
  - ${new Date(activity.created_at).toLocaleString('zh-CN')}
`
    })
    markdown += `
`
  }

  markdown += `---

*由 蓝的工作台 自动生成*
`

  return markdown
}
