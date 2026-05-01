import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/calendar - 获取日历日程
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const supabase = await createClient()
  
  // 获取指定日期及之后3天的日程
  const endDate = new Date(date)
  endDate.setDate(endDate.getDate() + 3)
  const endDateStr = endDate.toISOString().split('T')[0]
  
  // events 表使用 payload JSONB 存储详细数据
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('payload->event_date', date)
    .lte('payload->event_date', endDateStr)
    .in('event_type', ['study', 'work', 'sync'])
    .order('payload->>event_date', { ascending: true })
    .order('payload->>start_time', { ascending: true })

  if (error) {
    console.error('获取日程失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: events || [] })
}
