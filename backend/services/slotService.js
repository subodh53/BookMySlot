// backend/services/slotService.js
import { DateTime, Interval } from "luxon";

/**
 * Generate available slots for a given period.
 *
 * @param {
 *  timezone: string,
 *  weeklyRules: [{ weekday: 0-6, startTime: "HH:mm", endTime: "HH:mm" }],
 *  exceptions: [{ start: Date, end: Date, isAvailable: boolean }],
 *  startDate: "YYYY-MM-DD" (in host's timezone),
 *  endDate: "YYYY-MM-DD" (in host's timezone),
 *  durationMinutes: number,
 *  bufferBefore?: number,
 *  bufferAfter?: number,
 *  minNoticeMinutes?: number
 * } opts
 */
export const generateSlots = (opts) => {
  const {
    timezone,
    weeklyRules,
    exceptions,
    startDate,
    endDate,
    durationMinutes,
    bufferBefore = 0,
    bufferAfter = 0,
    minNoticeMinutes = 60,
  } = opts || {};

  if (!timezone || !durationMinutes || !weeklyRules || weeklyRules.length === 0) {
    return [];
  }

  const zone = timezone;
  const slots = [];

  const startDay = DateTime.fromISO(startDate, { zone }).startOf("day");
  const endDay = DateTime.fromISO(endDate, { zone }).endOf("day");

  // Luxon: Monday = 1, Sunday = 7
  const mapLuxonWeekdayToRule = (luxonWeekday) => luxonWeekday % 7; // 1..6 -> 1..6, 7 -> 0 (Sunday)

  const now = DateTime.now().setZone(zone).plus({ minutes: minNoticeMinutes });

  // Preprocess exceptions to intervals
  const exceptionIntervals =
    (exceptions || []).map((ex) => ({
      interval: Interval.fromDateTimes(
        DateTime.fromJSDate(ex.start).setZone(zone),
        DateTime.fromJSDate(ex.end).setZone(zone)
      ),
      isAvailable: ex.isAvailable,
    })) || [];

  let day = startDay;

  while (day <= endDay) {
    const ruleWeekday = mapLuxonWeekdayToRule(day.weekday); // 0–6
    const dayRules = (weeklyRules || []).filter(
      (r) => r.weekday === ruleWeekday
    );

    for (const rule of dayRules) {
      const [startHour, startMinute] = rule.startTime.split(":").map(Number);
      const [endHour, endMinute] = rule.endTime.split(":").map(Number);

      let windowStart = day.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
      let windowEnd = day.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });

      // Adjust for buffers (simple version: keep meeting fully inside window minus buffers)
      windowStart = windowStart.plus({ minutes: bufferBefore });
      windowEnd = windowEnd.minus({ minutes: bufferAfter });

      if (windowEnd <= windowStart) continue;

      let cursor = windowStart;

      while (true) {
        const slotStart = cursor;
        const slotEnd = slotStart.plus({ minutes: durationMinutes });

        if (slotEnd > windowEnd) break;

        // Respect min notice
        if (slotStart >= now) {
          const meetingInterval = Interval.fromDateTimes(slotStart, slotEnd);

          // Apply blocking exceptions (isAvailable === false)
          let blocked = false;
          for (const ex of exceptionIntervals) {
            if (!ex.isAvailable && ex.interval.overlaps(meetingInterval)) {
              blocked = true;
              break;
            }
          }

          if (!blocked) {
            slots.push({
              start: slotStart.toUTC().toISO(),
              end: slotEnd.toUTC().toISO(),
            });
          }
        }

        // Step by event duration (could later change to a smaller step, e.g. 15 min)
        cursor = cursor.plus({ minutes: durationMinutes });
      }
    }

    day = day.plus({ days: 1 });
  }

  return slots;
};
