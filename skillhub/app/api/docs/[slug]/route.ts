import { NextResponse } from 'next/server'
import { getDocBySlug } from '@/lib/docs'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const content = await getDocBySlug(params.slug)

    if (!content) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching doc:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doc' },
      { status: 500 }
    )
  }
}
