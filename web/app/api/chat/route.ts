const sessions = new Map<string, number>();

async function proxyToAgentService(payload: Record<string, unknown>) {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL;
  if (!agentUrl) return null;

  try {
    const response = await fetch(`${agentUrl}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('Agent service not reachable, falling back to local chat flow.', error);
    return null;
  }
}

function getFallbackReply(sessionId: string, message?: string) {
  const count = sessions.get(sessionId) ?? 0;
  sessions.set(sessionId, count + 1);

  if (!message || !message.trim()) {
    return 'Hi! I am your ERM assistant. Ask me anything about RACI roles, workflow planning, or accountability.';
  }

  const normalized = message.trim().toLowerCase();

  if (normalized.includes('objective') || normalized.includes('goal')) {
    return 'A clear objective is essential. What is the primary business outcome you want to achieve?';
  }

  if (normalized.includes('site') || normalized.includes('url') || normalized.includes('location')) {
    return 'Please share the site name or URL so I can connect this to the right workflow context.';
  }

  if (normalized.includes('accountable') || normalized.includes('owner') || normalized.includes('responsible')) {
    return 'The accountable owner is critical. Who is the person or team responsible for this decision?';
  }

  if (normalized.includes('organization') || normalized.includes('team')) {
    return 'Which organization or team should be notified after this request completes?';
  }

  if (count === 0) {
    return 'Thanks for starting the conversation. What part of the ERM workflow would you like to discuss first?';
  }

  return 'I understand. Tell me more about the workflow or ask a follow-up question so I can help you further.';
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { command, sessionId, message } = payload;

  const id = (sessionId as string) || crypto.randomUUID();

  const external = await proxyToAgentService(payload);
  if (external) {
    const responseMessage =
      (external as any).message || (external as any).question || (external as any).answer || 'I am here to help.';
    return new Response(JSON.stringify({ sessionId: (external as any).sessionId ?? id, message: responseMessage }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (command === 'start') {
    const greeting = 'Hi! I am your ERM assistant. Ask me anything about RACI roles, workflows, or decision tracking.';
    sessions.set(id, 0);
    return new Response(JSON.stringify({ sessionId: id, message: greeting }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (command === 'chat') {
    const reply = getFallbackReply(id, message as string);
    return new Response(JSON.stringify({ sessionId: id, message: reply }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Invalid command' }), { status: 400 });
}
