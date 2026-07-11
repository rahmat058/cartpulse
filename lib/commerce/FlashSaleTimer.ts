export interface CountdownParts {
  hours: number
  minutes: number
  seconds: number
  expired: boolean
  label: string
}

/** OOP countdown — flash sale strip / hero urgency */
export class FlashSaleTimer {
  constructor(private readonly endsAt: Date) {}

  static untilHoursFromNow(hours: number): FlashSaleTimer {
    return new FlashSaleTimer(new Date(Date.now() + hours * 60 * 60 * 1000))
  }

  getRemaining(): CountdownParts {
    const diff = Math.max(0, this.endsAt.getTime() - Date.now())
    const totalSeconds = Math.floor(diff / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const expired = diff <= 0

    return {
      hours,
      minutes,
      seconds,
      expired,
      label: expired
        ? 'Sale ended'
        : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    }
  }
}
