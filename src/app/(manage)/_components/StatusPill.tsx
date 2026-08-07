import { statusPill } from '@/lib/manage/vocabulary'

/**
 * The status, as a pill.
 *
 * The tones match src/payload/components/Dashboard.tsx so the figure a person
 * clicks on the dashboard and the row they land on read as the same thing.
 * Written as whole class strings rather than composed from fragments, because
 * Tailwind only ships classes it can see in the source.
 */
const TONE: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#DBEAFE] text-[#1E40AF]',
  processing: 'bg-[#E0E7FF] text-[#3730A3]',
  shipped: 'bg-[#D1FAE5] text-[#065F46]',
  delivered: 'bg-[#BBF7D0] text-[#14532D]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
}

export function StatusPill({ status }: { status: string | null }) {
  const tone = TONE[status ?? ''] ?? 'bg-ink-08 text-ink-70'

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2 py-[3px] text-[11.5px] font-semibold rounded-full ${tone}`}
    >
      {statusPill(status)}
    </span>
  )
}
