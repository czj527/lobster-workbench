/**
 * 四季清单 (TaskFlow) 桥接模块
 * 为将来的实际对接做准备
 */

export type TaskFlowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskFlowPriority = 'high' | 'medium' | 'low'

export interface TaskFlowTask {
  id: string; title: string; description?: string; status: TaskFlowStatus; priority: TaskFlowPriority
  tags?: string[]; dueDate?: string; createdAt: string; updatedAt: string; completedAt?: string
}

export interface TaskFlowProject {
  id: string; name: string; description?: string; color?: string; icon?: string
  taskCount: number; completedCount: number; tasks: TaskFlowTask[]; createdAt: string; updatedAt: string
}

export interface TaskFlowStats {
  totalTasks: number; completedTasks: number; pendingTasks: number; inProgressTasks: number
  overdueTasks: number; todayTasks: number; weekTasks: number
}

export type BridgeConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface IntegrationService {
  id: string; name: string; description: string; status: BridgeConnectionStatus
  lastSync?: string; taskCount?: number; icon: string
}

export function generateMockTaskFlowData(): TaskFlowProject[] {
  return [
    { id: 'tf-1', name: '日常任务', description: '每日例行任务', color: '#4CAF50', icon: '📋', taskCount: 5, completedCount: 2,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(),
      tasks: [
        { id: 't1', title: '晨间阅读', status: 'completed', priority: 'medium', tags: ['阅读'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 't2', title: '锻炼30分钟', status: 'completed', priority: 'high', tags: ['健康'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 't3', title: '学习英语', status: 'in_progress', priority: 'medium', tags: ['学习'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
    },
    { id: 'tf-2', name: '学习计划', description: '技术学习', color: '#2196F3', icon: '📚', taskCount: 3, completedCount: 1,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(),
      tasks: [
        { id: 't4', title: '完成React课程', status: 'in_progress', priority: 'high', tags: ['前端'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 't5', title: '阅读算法书', status: 'completed', priority: 'medium', tags: ['算法'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
    },
  ]
}

export function generateMockTaskFlowStats(): TaskFlowStats {
  return { totalTasks: 12, completedTasks: 5, pendingTasks: 4, inProgressTasks: 2, overdueTasks: 1, todayTasks: 3, weekTasks: 8 }
}

export class TaskFlowBridge {
  private useMockData = true
  async getConnectionStatus(): Promise<BridgeConnectionStatus> { return 'connected' }
  async getProjects(): Promise<TaskFlowProject[]> { return generateMockTaskFlowData() }
  async getStats(): Promise<TaskFlowStats> { return generateMockTaskFlowStats() }
  async syncData(): Promise<{ success: boolean; itemCount: number }> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true, itemCount: 12 }
  }
}
