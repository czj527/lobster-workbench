/**
 * AI 摘要 API - 生成项目周报
 * 从 Supabase 获取指定项目过去7天的活动日志、任务变更，生成结构化摘要
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json(
      { error: '缺少 project_id 参数' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  
  // 获取项目信息
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) {
    return NextResponse.json(
      { error: '项目不存在' },
      { status: 404 }
    )
  }

  // 计算7天前的时间戳
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString()

  // 获取过去7天的任务变更
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .gte('updated_at', sevenDaysAgoStr)
    .order('updated_at', { ascending: false })

  // 获取所有任务用于统计
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)

  // 获取过去7天的活动日志
  const { data: recentActivities } = await supabase
    .from('activity_log')
    .select('*')
    .gte('created_at', sevenDaysAgoStr)
    .order('created_at', { ascending: false })

  // 按状态分组任务
  const tasksByStatus = {
    todo: allTasks?.filter(t => t.status === 'todo') || [],
    in_progress: allTasks?.filter(t => t.status === 'in_progress') || [],
    testing: allTasks?.filter(t => t.status === 'testing') || [],
    done: allTasks?.filter(t => t.status === 'done') || [],
  }

  // 找出逾期任务（截止日期已过且未完成）
  const today = new Date().toISOString().split('T')[0]
  const overdueTasks = (allTasks || []).filter(task => 
    task.due_date && 
    task.due_date < today && 
    task.status !== 'done'
  )

  // 计算本周完成任务
  const completedThisWeek = recentTasks?.filter(t => t.status === 'done') || []
  
  // 计算本周新任务
  const newTasksThisWeek = recentTasks?.filter(t => {
    const createdAt = new Date(t.created_at).getTime()
    const weekAgo = new Date(sevenDaysAgoStr).getTime()
    return createdAt >= weekAgo
  }) || []

  // 生成结构化摘要 Markdown
  const summary = generateSummaryMarkdown({
    project,
    tasksByStatus,
    overdueTasks,
    completedThisWeek,
    newTasksThisWeek,
    recentActivities: recentActivities || [],
    weekAgo: sevenDaysAgo,
  })

  // 将摘要保存到 activity_log 表
  await supabase.from('activity_log').insert({
    content: `📊 AI周报摘要 [${project.name}]\n\n${summary}`,
    type: 'ai_summary',
  })

  return NextResponse.json({
    success: true,
    summary,
    stats: {
      totalTasks: allTasks?.length || 0,
      completedThisWeek: completedThisWeek.length,
      newTasksThisWeek: newTasksThisWeek.length,
      overdueTasks: overdueTasks.length,
      inProgressTasks: tasksByStatus.in_progress.length,
      tasksByStatus: {
        todo: tasksByStatus.todo.length,
        in_progress: tasksByStatus.in_progress.length,
        testing: tasksByStatus.testing.length,
        done: tasksByStatus.done.length,
      },
    },
  })
}

/**
 * 生成结构化摘要 Markdown
 */
function generateSummaryMarkdown(data: {
  project: any
  tasksByStatus: Record<string, any[]>
  overdueTasks: any[]
  completedThisWeek: any[]
  newTasksThisWeek: any[]
  recentActivities: any[]
  weekAgo: Date
}): string {
  const { project, tasksByStatus, overdueTasks, completedThisWeek, newTasksThisWeek, weekAgo } = data
  
  const weekStart = weekAgo.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  const weekEnd = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  
  let summary = `## 📋 ${project.name} 周报\n`
  summary += `> 📅 ${weekStart} - ${weekEnd}\n\n`

  // 1. 本周完成事项
  summary += `### ✅ 本周完成事项\n\n`
  if (completedThisWeek.length > 0) {
    completedThisWeek.slice(0, 5).forEach(task => {
      const priorityLabel = task.priority === 1 ? '🔴' : task.priority === 2 ? '🟡' : '🟢'
      summary += `- ${priorityLabel} **${task.title}**`
      if (task.due_date) {
        summary += ` (计划: ${task.due_date})`
      }
      summary += `\n`
    })
    if (completedThisWeek.length > 5) {
      summary += `- ...还有 ${completedThisWeek.length - 5} 项任务\n`
    }
  } else {
    summary += `- 本周暂无完成的任务\n`
  }
  summary += `\n`

  // 2. 进行中的工作
  summary += `### 🔄 进行中的工作\n\n`
  const inProgressTasks = tasksByStatus.in_progress.concat(tasksByStatus.testing)
  if (inProgressTasks.length > 0) {
    inProgressTasks.slice(0, 5).forEach(task => {
      const statusIcon = task.status === 'testing' ? '🧪' : '⚡'
      const priorityLabel = task.priority === 1 ? '🔴' : task.priority === 2 ? '🟡' : '🟢'
      summary += `- ${statusIcon} ${priorityLabel} **${task.title}**`
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        const today = new Date()
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft < 0) {
          summary += ` (已逾期 ${Math.abs(daysLeft)} 天)`
        } else if (daysLeft === 0) {
          summary += ` (今天截止)`
        } else {
          summary += ` (${daysLeft} 天后截止)`
        }
      }
      summary += `\n`
    })
    if (inProgressTasks.length > 5) {
      summary += `- ...还有 ${inProgressTasks.length - 5} 项任务\n`
    }
  } else {
    summary += `- 当前没有进行中的任务\n`
  }
  summary += `\n`

  // 3. 逾期/阻塞事项
  summary += `### ⚠️ 逾期/阻塞事项\n\n`
  if (overdueTasks.length > 0) {
    overdueTasks.slice(0, 5).forEach(task => {
      const daysOverdue = Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
      summary += `- 🔴 **${task.title}** (已逾期 ${daysOverdue} 天)`
      if (task.status === 'todo') {
        summary += ` - 建议尽快启动`
      }
      summary += `\n`
    })
    if (overdueTasks.length > 5) {
      summary += `- ...还有 ${overdueTasks.length - 5} 项逾期任务\n`
    }
  } else {
    summary += `- 🎉 没有逾期任务，继续保持！\n`
  }
  summary += `\n`

  // 4. 下周建议
  summary += `### 💡 下周建议\n\n`
  
  // 基于数据生成建议
  const suggestions: string[] = []
  
  // 检查是否有高优先级任务
  const highPriorityTasks = (tasksByStatus.todo || []).filter(t => t.priority === 1)
  if (highPriorityTasks.length > 0) {
    suggestions.push(`📌 优先处理 ${highPriorityTasks.length} 项高优先级待办任务`)
  }
  
  // 检查是否有大量待办
  if (tasksByStatus.todo.length > 10) {
    suggestions.push(`📋 待办任务较多 (${tasksByStatus.todo.length} 项)，建议分解或排优先级`)
  }
  
  // 检查是否有长期无更新的任务
  const stuckTasks = tasksByStatus.in_progress.filter(t => {
    const daysSinceUpdate = Math.ceil((new Date().getTime() - new Date(t.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceUpdate > 3
  })
  if (stuckTasks.length > 0) {
    suggestions.push(`⏸️ ${stuckTasks.length} 项任务超过3天无更新，关注一下进度吧`)
  }
  
  // 检查是否有新任务
  if (newTasksThisWeek.length > 0) {
    suggestions.push(`✨ 本周新增 ${newTasksThisWeek.length} 项任务，记得规划时间`)
  }
  
  // 检查项目进度
  const progress = project.progress || 0
  if (progress < 30) {
    suggestions.push(`🚀 项目进度 ${progress}%，需要加快节奏`)
  } else if (progress > 80) {
    suggestions.push(`🎯 项目即将完成 (${progress}%)，做好收尾工作`)
  }
  
  // 是否有任务今天截止
  const allTasksList = tasksByStatus.todo.concat(
    tasksByStatus.in_progress,
    tasksByStatus.testing,
    tasksByStatus.done
  )
  const dueToday = allTasksList.filter(t => t.due_date === new Date().toISOString().split('T')[0])
  if (dueToday.length > 0) {
    suggestions.push(`⏰ 今天有 ${dueToday.length} 项任务截止，请注意时间`)
  }
  
  if (suggestions.length > 0) {
    suggestions.slice(0, 4).forEach(s => {
      summary += `- ${s}\n`
    })
  } else {
    summary += `- 继续保持当前节奏，项目进展顺利！\n`
  }

  // 底部统计信息
  summary += `\n---\n`
  summary += `📊 **项目统计**: 共 ${allTasksList.length} 个任务 | `
  summary += `已完成 ${tasksByStatus.done.length} | `
  summary += `进度 ${project.progress || 0}%`

  return summary
}
