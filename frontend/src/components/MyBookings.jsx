import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyBookings } from "../features/bookings/bookingsSlice";

function formatDateTime(dateStr, timeZone) {
  const d = new Date(dateStr);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
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

export default function MyBookings() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.bookings);
  const hostTimezone = useSelector((state) => state.auth.user?.timezone);

  useEffect(() => {
    dispatch(getMyBookings());
  }, [dispatch]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-slate-900">
          Upcoming bookings
        </h2>
        {status === "loading" && (
          <span className="text-xs text-slate-500">Loading...</span>
        )}
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {status === "succeeded" && items.length === 0 && (
        <p className="text-xs text-slate-500">
          You don&apos;t have any upcoming bookings yet.
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Invitee</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => {
                const { date, time } = formatDateTime(
                  booking.start,
                  hostTimezone
                );

                return (
                  <tr
                    key={booking.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-800">{date}</div>
                      <div className="text-slate-500">{time}</div>
                      {hostTimezone && (
                        <div className="text-[10px] text-slate-400">
                          {hostTimezone}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {booking.event?.title || "Event"}
                      </div>
                      {booking.status && (
                        <div className="text-[10px] text-emerald-700">
                          {booking.status}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-slate-800">
                        {booking.inviteeName}
                      </div>
                      {booking.inviteeTimezone && (
                        <div className="text-[10px] text-slate-400">
                          {booking.inviteeTimezone}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-slate-700">
                        {booking.inviteeEmail}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top max-w-xs">
                      <div className="text-slate-600 line-clamp-2">
                        {booking.notes || "-"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-400">
        Showing upcoming confirmed bookings. In future we can add filters for
        past / cancelled.
      </p>
    </div>
  );
}
