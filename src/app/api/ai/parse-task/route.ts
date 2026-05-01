/**
 * 自然语言解析任务 API
 * 使用规则引擎解析自然语言为任务字段
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, project_id } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '缺少 text 参数' },
        { status: 400 }
      )
    }

    // 使用规则引擎解析自然语言
    const parsed = parseNaturalLanguage(text)

    // 如果提供了 project_id，获取项目信息
    let project = null
    if (project_id) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single()
      project = data
    }

    // 返回解析结果
    return NextResponse.json({
      success: true,
      parsed: {
        title: parsed.title,
        description: parsed.description,
        due_date: parsed.due_date,
        priority: parsed.priority,
        status: parsed.status,
        tags: parsed.tags,
      },
      project,
      preview: generatePreview(parsed),
    })

  } catch (error) {
    console.error('Parse task error:', error)
    return NextResponse.json(
      { error: '解析失败' },
      { status: 500 }
    )
  }
}

/**
 * 自然语言解析规则引擎
 */
interface ParsedTask {
  title: string
  description?: string
  due_date?: string
  priority: number // 1=高, 2=中, 3=低
  status: 'todo' | 'in_progress'
  tags: string[]
}

function parseNaturalLanguage(text: string): ParsedTask {
  const result: ParsedTask = {
    title: text,
    priority: 2, // 默认中优先级
    status: 'todo',
    tags: [],
  }

  let workingText = text

  // ============================================
  // 1. 提取优先级
  // ============================================
  
  // 高优先级关键词
  const highPriorityPatterns = [
    /紧急/i, /urgent/i, /重要/i, /高优/,
    /!{2,}/, /!!!/, /高优先级/, /最高/,
    /立刻/i, /马上/i, /立即/i
  ]
  
  // 低优先级关键词
  const lowPriorityPatterns = [
    /低优/i, /低优先级/, /不急/i, /有空/i,
    /later/i, /eventually/i, /eventually/,
    /以后/i, /以后再说/i
  ]

  for (const pattern of highPriorityPatterns) {
    if (pattern.test(workingText)) {
      result.priority = 1
      workingText = workingText.replace(pattern, '').trim()
      break
    }
  }

  for (const pattern of lowPriorityPatterns) {
    if (pattern.test(workingText)) {
      result.priority = 3
      workingText = workingText.replace(pattern, '').trim()
      break
    }
  }

  // ============================================
  // 2. 提取截止时间
  // ============================================
  
  const today = new Date()
  
  // 今天（可选：具体时间）
  const todayPattern = /(?:今天|今日|今天?)(?:[\s:：]*(?:上午|下午|早上|晚上)?[\s:：]*(\d{1,2})[:：.]?(\d{0,2}))?/i
  const todayMatch = workingText.match(todayPattern)
  if (todayMatch) {
    result.due_date = formatDate(today)
    if (todayMatch[1]) {
      const hours = parseInt(todayMatch[1])
      const minutes = todayMatch[2] ? parseInt(todayMatch[2]) : 0
      result.due_date = `${result.due_date} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
    workingText = workingText.replace(todayPattern, '').trim()
  }

  // 明天
  const tomorrowPattern = /(?:明天|明日)/i
  if (tomorrowPattern.test(workingText)) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.due_date = formatDate(tomorrow)
    
    // 尝试提取时间
    const timePattern = /(\d{1,2})[:：.]?(\d{0,2})/
    const timeMatch = workingText.match(timePattern)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      result.due_date = `${result.due_date} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
    workingText = workingText.replace(tomorrowPattern, '').replace(timePattern, '').trim()
  }

  // 后天
  const dayAfterTomorrowPattern = /(?:后天)/i
  if (dayAfterTomorrowPattern.test(workingText)) {
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)
    result.due_date = formatDate(dayAfter)
    workingText = workingText.replace(dayAfterTomorrowPattern, '').trim()
  }

  // 本周末
  const weekendPattern = /(?:周末|这周末|本周末)/i
  if (weekendPattern.test(workingText)) {
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
    const saturday = new Date(today)
    saturday.setDate(saturday.getDate() + daysUntilSaturday)
    result.due_date = formatDate(saturday)
    workingText = workingText.replace(weekendPattern, '').trim()
  }

  // 下周
  const nextWeekPattern = /(?:下周|下个礼拜|下周[一二三四五六日])/i
  if (nextWeekPattern.test(workingText)) {
    const nextMonday = new Date(today)
    const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday)
    
    // 检查是否指定了具体星期几
    const weekdayMatch = workingText.match(/下周([一二三四五六日])/i)
    if (weekdayMatch) {
      const weekdayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7 }
      const targetDay = weekdayMap[weekdayMatch[1]]
      const currentDay = today.getDay() || 7
      let daysToAdd = targetDay - currentDay
      if (daysToAdd <= 0) daysToAdd += 7
      nextMonday.setDate(nextMonday.getDate() + daysToAdd)
    }
    
    result.due_date = formatDate(nextMonday)
    workingText = workingText.replace(nextWeekPattern, '').trim()
  }

  // 具体日期格式 YYYY-MM-DD 或 YYYY.MM.DD
  const datePattern = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})/
  const dateMatch = workingText.match(datePattern)
  if (dateMatch) {
    result.due_date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
    workingText = workingText.replace(dateMatch[0], '').trim()
  }

  // X天后、X天后
  const daysLaterPattern = /(\d+)\s*天[之]?后/i
  const daysLaterMatch = workingText.match(daysLaterPattern)
  if (daysLaterMatch) {
    const days = parseInt(daysLaterMatch[1])
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    result.due_date = formatDate(futureDate)
    workingText = workingText.replace(daysLaterMatch[0], '').trim()
  }

  // ============================================
  // 3. 提取任务状态
  // ============================================
  
  // 开始进行中
  const startPatterns = [/^开始/i, /开始做/i, /去做/i, /^做/i, /进行中/]
  for (const pattern of startPatterns) {
    if (pattern.test(workingText)) {
      result.status = 'in_progress'
      workingText = workingText.replace(pattern, '').trim()
      break
    }
  }

  // ============================================
  // 4. 提取标签
  // ============================================
  
  const tagPatterns = [
    { pattern: /#[^\s#]+/g, tag: '标签' },
    { pattern: /【([^】]+)】/g, tag: '标签', group: 1 },
  ]

  // Bug 相关
  if (/bug|bug修复|修复|错误|报错/i.test(workingText)) {
    result.tags.push('bug')
  }

  // 文档相关
  if (/文档|doc|说明书|readme/i.test(workingText)) {
    result.tags.push('文档')
  }

  // 测试相关
  if (/测试|test|debug/i.test(workingText)) {
    result.tags.push('测试')
  }

  // 设计相关
  if (/设计|design|ui|ux|界面/i.test(workingText)) {
    result.tags.push('设计')
  }

  // 会议相关
  if (/讨论|会议|meeting|聊|沟通/i.test(workingText)) {
    result.tags.push('会议')
  }

  // 研究相关
  if (/研究|调研|探索|调查/i.test(workingText)) {
    result.tags.push('调研')
  }

  // ============================================
  // 5. 清理标题
  // ============================================
  
  // 移除多余空格
  result.title = workingText.replace(/\s+/g, ' ').trim()
  
  // 移除常见前缀词
  const prefixPatterns = [
    /^(创建|新建|添加|新增|做|完成|处理)/,
    /^(请|需要|要)/,
  ]
  for (const pattern of prefixPatterns) {
    result.title = result.title.replace(pattern, '').trim()
  }

  // 如果标题为空，使用原始文本
  if (!result.title) {
    result.title = text.replace(/\s+/g, ' ').trim()
  }

  return result
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 生成预览文本
 */
function generatePreview(parsed: ParsedTask): string {
  const parts: string[] = []
  
  parts.push(`📌 ${parsed.title}`)
  
  if (parsed.due_date) {
    parts.push(`📅 ${parsed.due_date}`)
  }
  
  const priorityMap: Record<number, string> = { 1: '🔴 高', 2: '🟡 中', 3: '🟢 低' }
  parts.push(priorityMap[parsed.priority])
  
  if (parsed.status === 'in_progress') {
    parts.push('⚡ 进行中')
  }
  
  if (parsed.tags.length > 0) {
    parts.push(`🏷️ ${parsed.tags.join(', ')}`)
  }
  
  return parts.join(' | ')
}
