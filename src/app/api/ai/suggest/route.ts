/**
 * 智能任务建议 API
 * 基于当前项目状态给出建议
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id') // 可选，不传则分析所有项目

  const supabase = createAdminClient()

  // 获取项目列表
  let projectsQuery = supabase.from('projects').select('*')
  if (projectId) {
    projectsQuery = projectsQuery.eq('id', projectId)
  }
  const { data: projects } = await projectsQuery

  // 获取所有任务
  let tasksQuery = supabase.from('tasks').select('*, projects(name, icon)')
  if (projectId) {
    tasksQuery = tasksQuery.eq('project_id', projectId)
  }
  const { data: allTasks } = await tasksQuery

  // 获取活动日志用于判断活跃度
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const suggestions: Suggestion[] = []
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  // 1. 检查逾期任务
  const overdueTasks = (allTasks || []).filter(task => 
    task.due_date && 
    task.due_date < today && 
    task.status !== 'done'
  )
  if (overdueTasks.length > 0) {
    suggestions.push({
      id: 'overdue-tasks',
      type: 'warning',
      icon: '⚠️',
      title: `${overdueTasks.length} 项任务已逾期`,
      description: `最早逾期的是"${overdueTasks[0].title}"，已逾期 ${getDaysOverdue(overdueTasks[0].due_date)} 天`,
      action: {
        label: '查看逾期任务',
        type: 'navigate',
        target: projectId ? `/projects/${projectId}` : '/projects'
      }
    })
  }

  // 2. 检查今天截止的任务
  const dueTodayTasks = (allTasks || []).filter(task => 
    task.due_date === today && 
    task.status !== 'done'
  )
  if (dueTodayTasks.length > 0) {
    suggestions.push({
      id: 'due-today',
      type: 'urgent',
      icon: '⏰',
      title: `${dueTodayTasks.length} 项任务今天截止`,
      description: dueTodayTasks[0].title + (dueTodayTasks.length > 1 ? ` 等${dueTodayTasks.length}项` : ''),
      action: {
        label: '立即处理',
        type: 'navigate',
        target: projectId ? `/projects/${projectId}` : '/projects'
      }
    })
  }

  // 3. 检查长期无更新的进行中任务
  const stuckTasks = (allTasks || []).filter(task => {
    if (task.status !== 'in_progress') return false
    const daysSinceUpdate = Math.ceil((now.getTime() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceUpdate > 3
  })
  if (stuckTasks.length > 0) {
    suggestions.push({
      id: 'stuck-tasks',
      type: 'info',
      icon: '🔄',
      title: `${stuckTasks.length} 项任务进度停滞`,
      description: `"${stuckTasks[0].title}" 已超过3天无更新`,
      action: {
        label: '更新进度',
        type: 'navigate',
        target: projectId ? `/projects/${projectId}` : '/projects'
      }
    })
  }

  // 4. 检查任务过多的情况
  const todoTasks = (allTasks || []).filter(t => t.status === 'todo')
  if (todoTasks.length > 15) {
    suggestions.push({
      id: 'too-many-todos',
      type: 'tip',
      icon: '📋',
      title: '待办任务过多',
      description: `你有 ${todoTasks.length} 项待办任务，建议分解或设置优先级`,
      action: {
        label: '查看待办',
        type: 'navigate',
        target: projectId ? `/projects/${projectId}` : '/projects'
      }
    })
  }

  // 5. 检查项目是否长期无活动
  const lastActivity = activities && activities.length > 0 ? new Date(activities[0].created_at) : null
  const daysSinceActivity = lastActivity 
    ? Math.ceil((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : null
  
  if (daysSinceActivity !== null && daysSinceActivity > 2 && !projectId) {
    suggestions.push({
      id: 'no-recent-activity',
      type: 'reminder',
      icon: '💡',
      title: '好久不见',
      description: `已经 ${daysSinceActivity} 天没有活动了，来看看有什么可以做的吧`,
      action: {
        label: '开始工作',
        type: 'navigate',
        target: '/projects'
      }
    })
  }

  // 6. 检查高优先级未开始的任务
  const highPriorityPending = (allTasks || []).filter(t => 
    t.status === 'todo' && t.priority === 1
  )
  if (highPriorityPending.length > 0) {
    suggestions.push({
      id: 'high-priority-pending',
      type: 'tip',
      icon: '🎯',
      title: `${highPriorityPending.length} 项高优先级任务待处理`,
      description: `"${highPriorityPending[0].title}" 需要尽快处理`,
      action: {
        label: '开始处理',
        type: 'navigate',
        target: projectId ? `/projects/${projectId}` : '/projects'
      }
    })
  }

  // 7. 检查停滞的项目
  if (!projectId) {
    const staleProjects = (projects || []).filter(p => {
      if (p.status === 'completed' || p.status === 'paused') return false
      const daysSinceUpdate = Math.ceil((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceUpdate > 7
    })
    if (staleProjects.length > 0) {
      suggestions.push({
        id: 'stale-projects',
        type: 'info',
        icon: '🏠',
        title: `${staleProjects.length} 个项目需要关注`,
        description: `"${staleProjects[0].name}" 已超过7天未更新`,
        action: {
          label: '查看项目',
          type: 'navigate',
          target: '/projects'
        }
      })
    }
  }

  // 8. 鼓励完成进度
  if (!projectId) {
    const projectsInProgress = (projects || []).filter(p => p.status === 'in_progress')
    const nearComplete = projectsInProgress.filter(p => (p.progress || 0) >= 80 && (p.progress || 0) < 100)
    if (nearComplete.length > 0) {
      suggestions.push({
        id: 'near-complete',
        type: 'success',
        icon: '🎉',
        title: `${nearComplete.length} 个项目即将完成`,
        description: `"${nearComplete[0].name}" 进度已达 ${nearComplete[0].progress}%`,
        action: {
          label: '继续加油',
          type: 'navigate',
          target: '/projects'
        }
      })
    }
  }

  // 如果没有任何建议，添加一个默认的积极建议
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'all-good',
      type: 'success',
      icon: '✨',
      title: '一切顺利',
      description: '没有需要特别关注的事项，继续保持！',
      action: null
    })
  }

  return NextResponse.json({
    success: true,
    suggestions: suggestions.slice(0, 5), // 最多返回5条建议
    stats: {
      totalTasks: allTasks?.length || 0,
      overdueTasks: overdueTasks.length,
      dueTodayTasks: dueTodayTasks.length,
      todoTasks: todoTasks.length,
      inProgressTasks: (allTasks || []).filter(t => t.status === 'in_progress').length,
      completedTasks: (allTasks || []).filter(t => t.status === 'done').length,
    }
  })
}

interface Suggestion {
  id: string
  type: 'warning' | 'urgent' | 'info' | 'tip' | 'reminder' | 'success'
  icon: string
  title: string
  description: string
  action: {
    label: string
    type: 'navigate' | 'modal' | 'action'
    target?: string
    actionType?: string
  } | null
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}
