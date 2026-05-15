import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.userAssignment.findMany({ orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { siteNameOrUrl, userName, role, organization, persona } = body;

  const user = await prisma.userAssignment.create({
    data: {
      siteNameOrUrl,
      userName,
      role,
      organization,
      persona,
    },
  });

  return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json' } });
}
