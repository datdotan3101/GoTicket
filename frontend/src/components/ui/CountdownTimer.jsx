import { useCountdown } from '../../hooks/useCountdown'

export default function CountdownTimer({ targetDate }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  if (isExpired) return <span>Open now</span>

  return (
    <span>
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  )
}
