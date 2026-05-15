import { prisma } from '@/lib/prisma';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

export async function GET() {
  const answers = await prisma.questionAnswer.findMany({ orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(answers), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, answers } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing answers' }), { status: 400 });
  }

  const storedAnswers = await Promise.all(
    answers.map(async (answer: string, index: number) => {
      return prisma.questionAnswer.create({
        data: {
          question: `Question ${index + 1}`,
          answer,
        },
      });
    })
  );

  const stateMachineArn = process.env.AWS_STEP_FUNCTION_ARN;
  if (stateMachineArn) {
    const client = new SFNClient({});
    const command = new StartExecutionCommand({
      stateMachineArn,
      input: JSON.stringify({ sessionId, answers: storedAnswers }),
    });
    await client.send(command);
  }

  return new Response(JSON.stringify({ success: true, storedAnswers }), { headers: { 'Content-Type': 'application/json' } });
}
