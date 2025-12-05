// frontend/src/pages/BookingConfirmation.jsx
import { useLocation, useNavigate } from "react-router-dom";

/** Helpers **/
function formatDateTime(dateStr, timeZone) {
  if (!dateStr) return { date: "", time: "" };
  const d = new Date(dateStr);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timeZone || undefined,
  }).format(d);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone || undefined,
  }).format(d);

  return { date, time };
}

/** Convert ISO to YYYYMMDDTHHMMSSZ for ICS (UTC) **/
function toICSDate(isoStr) {
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const minute = pad(d.getUTCMinutes());
  const second = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/** Build ICS string */
function buildICS(booking, event, host) {
  const uid = `booking-${booking.id}@bookmyslot`;
  const dtstamp = toICSDate(new Date().toISOString());
  const dtstart = toICSDate(booking.start);
  const dtend = toICSDate(booking.end);
  const summary = `${event.title} with ${host.name || host.username || ""}`.trim();
  const descriptionLines = [
    `Booked via BookMySlot`,
    `Event: ${event.title}`,
    `Host: ${host.name || host.username || ""}`,
    `Invitee: ${booking.inviteeName} <${booking.inviteeEmail}>`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter(Boolean);
  const description = descriptionLines.join("\\n");

  // Basic VEVENT
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookMySlot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `ORGANIZER:MAILTO:${escapeICSText(host.email || "")}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return icsLines.join("\r\n");
}

/** Escape newlines and commas and semicolons for ICS format */
function escapeICSText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Trigger download of ICS file */
function downloadICS(icsString, filename = "event.ics") {
  const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build Google Calendar quick link */
function buildGoogleCalendarUrl({ booking, event, host }) {
  const start = new Date(booking.start).toISOString().replace(/-|:|\.\d{3}Z/g, "");
  const end = new Date(booking.end).toISOString().replace(/-|:|\.\d{3}Z/g, "");
  // start/end in format YYYYMMDDTHHMMSSZ without punctuation (works)
  const text = `${event.title} with ${host.name || host.username || ""}`;
  const details = [
    `Event: ${event.title}`,
    `Host: ${host.name || host.username || ""}`,
    `Invitee: ${booking.inviteeName} <${booking.inviteeEmail}>`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: text,
    details: details,
    // location could be added here
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Component **/
export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const booking = state.booking;
  const event = state.event;
  const host = state.host || {};

  // Fallback if someone hits this URL directly
  if (!booking || !event || !host) {
    return (
      <div className="py-10 flex justify-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">
            Booking details not found
          </h1>
          <p className="text-sm text-slate-600">
            It looks like this confirmation page was opened without booking
            details. Please create a new booking from the invite link.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  const hostTimezone = host.timezone || booking.inviteeTimezone;
  const { date, time } = formatDateTime(booking.start, hostTimezone);

  // ICS + Google calendar handlers
  const handleDownloadICS = () => {
    const ics = buildICS(booking, event, host);
    const fileName = `${event.title.replace(/\s+/g, "_")}-${booking.id}.ics`;
    downloadICS(ics, fileName);
  };

  const googleUrl = buildGoogleCalendarUrl({ booking, event, host });

  return (
    <div className="py-10 flex justify-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl">
            ✓
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              You&apos;re booked! 🎉
            </h1>
            <p className="text-xs text-slate-500">
              We&apos;ve saved your meeting details.
            </p>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Event</p>
            <p className="text-sm font-semibold text-slate-900">
              {event.title}
            </p>
            {host?.name && (
              <p className="text-xs text-slate-500">
                with {host.name}
                {host.username ? ` (@${host.username})` : ""}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 text-sm text-slate-800">
            <div className="text-lg">🗓</div>
            <div>
              <div className="font-medium">{date}</div>
              <div className="text-slate-600">
                {time}{" "}
                {hostTimezone && (
                  <span className="text-xs text-slate-500">
                    ({hostTimezone})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-slate-800">
            <div className="text-lg">👤</div>
            <div>
              <div className="font-medium">{booking.inviteeName}</div>
              <div className="text-slate-600 text-xs">
                {booking.inviteeEmail}
              </div>
              {booking.inviteeTimezone && (
                <div className="text-[11px] text-slate-500">
                  Invitee timezone: {booking.inviteeTimezone}
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="flex items-start gap-3 text-sm text-slate-800">
              <div className="text-lg">📝</div>
              <p className="text-slate-700 whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* Add to calendar area */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500">Add to your calendar</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadICS}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700"
            >
              Download .ics
            </button>
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-center"
            >
              Open in Google Calendar
            </a>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
          >
            Back to homepage
          </button>
        </div>
      </div>
    </div>
  );
}
