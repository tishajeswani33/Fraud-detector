interface Sample {
  label: string
  text: string
  type: 'fraud' | 'legit'
}

const SAMPLES: Sample[] = [
  {
    label: 'Prize scam',
    text: "WINNER!! As a valued network customer you have been selected to receive a £900 prize reward! To claim call 09061701461. Claim code KL341. Valid 12 hours only.",
    type: 'fraud',
  },
  {
    label: 'Cash bait',
    text: "Congratulations! You've won a cash prize of $5000. Click here to claim immediately before it expires!",
    type: 'fraud',
  },
  {
    label: 'Urgent loan',
    text: "URGENT: Your account needs verification. Text back YES to receive your approved loan of $10,000 now. Act fast!",
    type: 'fraud',
  },
  {
    label: 'Normal chat',
    text: "Hey, are you free for lunch tomorrow? I was thinking we could try that new Italian place downtown.",
    type: 'legit',
  },
  {
    label: 'Work message',
    text: "Hi, just a reminder that our team meeting is scheduled for 3pm today in Conference Room B. Please bring your Q3 reports.",
    type: 'legit',
  },
]

interface SampleMessagesProps {
  onSelect: (text: string) => void
}

export function SampleMessages({ onSelect }: SampleMessagesProps) {
  return (
    <div className="mt-4">
      <p className="text-muted text-xs font-mono uppercase tracking-widest mb-3">
        Try a sample message
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map(({ label, text, type }) => (
          <button
            key={label}
            onClick={() => onSelect(text)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-150 hover:scale-105 active:scale-95 ${
              type === 'fraud'
                ? 'border-danger/40 bg-danger/5 text-danger hover:bg-danger/15'
                : 'border-safe/40 bg-safe/5 text-safe hover:bg-safe/15'
            }`}
          >
            {type === 'fraud' ? '⚠ ' : '✓ '}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
