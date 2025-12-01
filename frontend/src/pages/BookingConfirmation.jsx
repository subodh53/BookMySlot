import { useLocation, useNavigate } from "react-router-dom";

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

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const booking = state.booking;
  const event = state.event;
  const host = state.host;

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

        {/* Placeholder for future "Add to calendar" */}
        <div className="flex flex-col gap-2 text-xs text-slate-500">
          <p>
            You can add this to your calendar or look for a confirmation email
            once email notifications are enabled.
          </p>
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
