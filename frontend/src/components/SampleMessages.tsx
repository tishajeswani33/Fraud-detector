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
    label: 'Phishing URL',
    text: "http://secure-update-paypal.com/login",
    type: 'fraud',
  },
  {
    label: 'Bank Phishing',
    text: "https://bankofamerica-verify-acc.com/auth",
    type: 'fraud',
  },
  {
    label: 'Hinglish Scam',
    text: "Aapka bank account block ho gaya hai. Abhi KYC update karne ke liye is link par click karein.",
    type: 'fraud',
  },
  {
    label: 'Normal chat',
    text: "Hey, are you free for lunch tomorrow? I was thinking we could try that new Italian place downtown.",
    type: 'legit',
  },
  {
    label: 'Hinglish Chat',
    text: "Bhai kaha hai tu? Kitni der me aa raha hai?",
    type: 'legit',
  },
  {
    label: 'Legit URL',
    text: "https://www.google.com/search?q=technology",
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
