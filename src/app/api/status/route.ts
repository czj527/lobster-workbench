/**
 * 实时状态 API Route
 * GET: 查询当前 live_status
 * POST: 更新 live_status
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'live_status')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned，不是错误
      console.error('Error fetching status:', error)
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        current_task: '空闲中，等待任务',
        steps: [],
        status: 'idle'
      })
    }

    return NextResponse.json(data.payload)
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { current_task, steps, status } = body

    // 验证状态值
    if (!['working', 'idle', 'thinking'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 删除旧的 live_status 事件
    await supabase
      .from('events')
      .delete()
      .eq('event_type', 'live_status')

    // 插入新状态
    const payload = {
      event_type: 'live_status',
      payload: {
        current_task: current_task || '空闲中',
        steps: steps || [],
        status
      },
      source: 'blue-agent',
      processed: false
    }

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error inserting status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data.payload })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
