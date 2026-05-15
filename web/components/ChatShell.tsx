"use client";

import { useEffect, useState } from 'react';

type ChatMessage = {
  role: 'system' | 'assistant' | 'user';
  text: string;
};

type ChatResponse = {
  sessionId?: string;
  message: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: 'system',
    text: 'You are an ERM workflow assistant. Ask anything about RACI roles, process decisions, or workflow planning.',
  },
];

export default function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function startChat() {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'start' }),
      });
      const data: ChatResponse = await response.json();
      setSessionId(data.sessionId ?? crypto.randomUUID());
      setMessages((prev) => [...prev, { role: 'assistant', text: data.message }]);
    }

    startChat();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsSubmitting(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'chat', sessionId, message: trimmed }),
    });
    const data: ChatResponse = await response.json();
    setSessionId(data.sessionId ?? sessionId);
    setMessages((prev) => [...prev, { role: 'assistant', text: data.message }]);
    setIsSubmitting(false);
  }

  function clearChat() {
    const id = crypto.randomUUID();
    setSessionId(id);
    setMessages(initialMessages);
    setInput('');
    setIsSubmitting(false);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'start', sessionId: id }),
    })
      .then((res) => res.json())
      .then((data: ChatResponse) => {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.message }]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Hi! I am your ERM assistant. Ask me anything about your workflow.' }]);
      });
  }

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>ERM Chatbot</h1>
            <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Start a conversation with the workflow assistant.</p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(56, 189, 248, 0.4)', background: 'transparent', color: '#38bdf8', cursor: 'pointer' }}
          >
            New chat
          </button>
        </header>

        <section style={{ flex: 1, overflowY: 'auto', paddingRight: 10, marginBottom: 24 }}>
          {messages.map((message, index) => (
            <div key={index} style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>{message.role.toUpperCase()}</div>
              <div
                style={{
                  marginTop: 6,
                  padding: '16px 20px',
                  borderRadius: 18,
                  background: message.role === 'user' ? '#1e293b' : '#111827',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}
              </div>
            </div>
          ))}
        </section>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ color: '#cbd5e1' }}>Type your message</span>
            <input
              value={input}
              disabled={isSubmitting}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about RACI, workflow roles, or your next step..."
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.2)', background: '#020617', color: '#e2e8f0' }}
            />
          </label>
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            style={{ padding: '14px 22px', borderRadius: 12, border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
          >
            {isSubmitting ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  );
}
