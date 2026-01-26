import { NextResponse } from 'next/server'
import { getAllDocs, getDocBySlug } from '@/lib/docs'

// GET /api/docs - 获取所有文档列表
export async function GET() {
  try {
    const docs = await getAllDocs()
    return NextResponse.json({ docs })
  } catch (error) {
    console.error('Error fetching docs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch docs' },
      { status: 500 }
    )
  }
}
