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
    .eq('source', 'coze-calendar')
    .in('event_type', ['study', 'work', 'sync'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('获取日程失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 过滤日期范围
  const filteredEvents = (events || []).filter((event: any) => {
    const eventDate = event.payload?.event_date
    return eventDate >= date && eventDate <= endDateStr
  }).sort((a: any, b: any) => {
    const dateCompare = (a.payload?.event_date || '').localeCompare(b.payload?.event_date || '')
    if (dateCompare !== 0) return dateCompare
    return (a.payload?.start_time || '').localeCompare(b.payload?.start_time || '')
  })

  return NextResponse.json({ events: filteredEvents })
}
