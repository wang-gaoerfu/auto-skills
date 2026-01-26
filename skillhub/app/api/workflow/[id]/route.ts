import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/workflow/[id] - 获取单个工作流详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const history = await prisma.workflowHistory.findUnique({
      where: { id: params.id },
    })

    if (!history) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const output = JSON.parse(history.output || '{}')

    return NextResponse.json({ history, output })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

// PATCH /api/workflow/[id] - 更新工作流状态
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, output } = body

    const history = await prisma.workflowHistory.update({
      where: { id: params.id },
      data: {
        status,
        output: output ? JSON.stringify(output) : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

// DELETE /api/workflow/[id] - 删除工作流历史
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.workflowHistory.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
