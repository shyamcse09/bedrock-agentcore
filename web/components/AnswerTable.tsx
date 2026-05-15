type AnswerRecord = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

type Props = {
  answers: AnswerRecord[];
};

export default function AnswerTable({ answers }: Props) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h2>Submitted Answers</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#cbd5e1' }}>
            <th style={{ padding: '12px 10px' }}>Question</th>
            <th style={{ padding: '12px 10px' }}>Answer</th>
            <th style={{ padding: '12px 10px' }}>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((record) => (
            <tr key={record.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <td style={{ padding: '12px 10px' }}>{record.question}</td>
              <td style={{ padding: '12px 10px' }}>{record.answer}</td>
              <td style={{ padding: '12px 10px' }}>{new Date(record.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
