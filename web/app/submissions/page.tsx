'use client';

import { useEffect, useState } from 'react';
import AnswerTable from '@/components/AnswerTable';

type AnswerRecord = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

export default function SubmissionsPage() {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  useEffect(() => {
    async function loadAnswers() {
      const res = await fetch('/api/answers', { cache: 'no-store' });
      if (res.ok) {
        setAnswers(await res.json());
      }
    }

    loadAnswers();
  }, []);

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <div className="card">
          <h1>Submissions</h1>
          <p style={{ marginTop: 8, color: '#94a3b8' }}>View saved answers from the chatbot workflow.</p>
        </div>

        <AnswerTable answers={answers} />
      </div>
    </main>
  );
}
