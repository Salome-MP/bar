interface RecurrenceRule {
  frequency: string
  days_of_week: string[]
  end_date?: string | null
}

const DAY_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
}

/**
 * Generate occurrence dates from a recurrence rule.
 * For SINGLE events, returns just [startDate].
 * For RECURRING events, generates dates based on frequency + days_of_week.
 * Generates up to 3 months ahead if no end_date is set.
 */
export function generateOccurrenceDates(
  startDate: Date,
  eventType: string,
  recurrenceRule: RecurrenceRule | null
): Date[] {
  if (eventType !== 'RECURRING' || !recurrenceRule) {
    return [startDate]
  }

  const { frequency, days_of_week, end_date } = recurrenceRule
  const targetDays = days_of_week
    .map((d) => DAY_MAP[d])
    .filter((d) => d !== undefined)

  if (targetDays.length === 0) {
    return [startDate]
  }

  const maxDate = end_date
    ? new Date(end_date)
    : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months

  const dates: Date[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  const startWeek = getWeekNumber(startDate)

  while (current <= maxDate && dates.length < 365) {
    if (targetDays.includes(current.getDay())) {
      const weeksDiff = weeksBetween(startDate, current)

      let include = false
      if (frequency === 'WEEKLY') {
        include = true
      } else if (frequency === 'BIWEEKLY') {
        include = weeksDiff % 2 === 0
      } else if (frequency === 'MONTHLY') {
        // Same week-of-month as start date
        include = getWeekOfMonth(current) === getWeekOfMonth(startDate)
      }

      if (include) {
        // Use the event's original time for each occurrence
        const occDate = new Date(current)
        occDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)
        dates.push(occDate)
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function weeksBetween(a: Date, b: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const startOfWeekA = getMonday(a)
  const startOfWeekB = getMonday(b)
  return Math.round((startOfWeekB.getTime() - startOfWeekA.getTime()) / msPerWeek)
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function getWeekOfMonth(d: Date): number {
  return Math.ceil(d.getDate() / 7)
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - start.getTime()
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
}
