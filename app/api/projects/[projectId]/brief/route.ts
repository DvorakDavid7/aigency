import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const briefUpdateSchema = z.object({
  businessDescription: z.string().min(1),
  product: z.string().min(1),
  targetAudience: z.string().min(1),
  uniqueSellingPoint: z.string().min(1),
  goal: z.enum(["LEADS", "SALES", "TRAFFIC", "APP_INSTALLS"]),
  monthlyBudget: z.number().int().positive(), // whole dollars from client
  location: z.string().min(1),
  websiteUrl: z.string().optional(),
  analysis: z.string().min(1),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = briefUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const data = parsed.data
  const budgetInCents = data.monthlyBudget * 100

  await prisma.$transaction(async (tx) => {
    await tx.projectBrief.update({
      where: { projectId },
      data: {
        businessDescription: data.businessDescription,
        product: data.product,
        targetAudience: data.targetAudience,
        uniqueSellingPoint: data.uniqueSellingPoint,
        goal: data.goal,
        monthlyBudget: budgetInCents,
        location: data.location,
        websiteUrl: data.websiteUrl ?? null,
      },
    })

    const artifact = await tx.artifact.findFirst({
      where: { projectId, type: "BRIEF" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    })

    if (artifact) {
      await tx.artifact.update({
        where: { id: artifact.id },
        data: {
          content: {
            businessDescription: data.businessDescription,
            product: data.product,
            targetAudience: data.targetAudience,
            uniqueSellingPoint: data.uniqueSellingPoint,
            goal: data.goal,
            monthlyBudget: budgetInCents,
            location: data.location,
            websiteUrl: data.websiteUrl,
            analysis: data.analysis,
          },
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}
