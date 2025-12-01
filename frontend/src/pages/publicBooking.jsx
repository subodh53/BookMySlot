import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
// e.g. "http://localhost:5000/api" -> "http://localhost:5000"
const PUBLIC_BASE = new URL(API_BASE).origin;

function buildAvailabilityUrl(username, slug) {
  // Let backend choose default start/end (today -> +6 days)
  return `${PUBLIC_BASE}/u/${username}/event/${slug}/availability`;
}

function buildBookingUrl(username, slug) {
  return `${PUBLIC_BASE}/u/${username}/event/${slug}/book`;
}

// Helper to build an array of YYYY-MM-DD strings from start to end (inclusive)
function buildDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return [];
  const start = new Date(startDateStr + "T00:00:00Z");
  const end = new Date(endDateStr + "T00:00:00Z");

  const days = [];
  let current = start;
  while (current <= end) {
    const iso = current.toISOString().slice(0, 10); // YYYY-MM-DD
    days.push(iso);
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

function formatDateHuman(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// timezone-aware time formatter
function formatTimeFromIso(isoStr, timeZone) {
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // change to true if you want 12-hour format
    timeZone: timeZone, // host's timezone from backend
  }).format(d);
}

// timezone-aware date formatter for grouping
function getDateInTimeZone(isoStr, timeZone) {
  const d = new Date(isoStr);
  // en-CA gives YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timeZone,
  }).format(d); // e.g. "2025-11-27"
}

export default function PublicBooking() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [eventInfo, setEventInfo] = useState(null);
  const [hostInfo, setHostInfo] = useState(null);
  const [timezone, setTimezone] = useState("");
  const [slots, setSlots] = useState([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // 🔹 Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { start, end }
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    timezone: "",
    notes: "",
  });
  const [bookingStatus, setBookingStatus] = useState("idle"); // idle | loading | succeeded | failed
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setApiError("");
      setNotFound(false);

      try {
        const url = buildAvailabilityUrl(username, slug);
        const res = await fetch(url);

        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load availability");
        }

        const data = await res.json();

        console.log("DATA:", data);
        // Expected shape:
        // { success, event, host, timezone, startDate, endDate, slots }
        setEventInfo(data.event);
        setHostInfo(data.host);
        setTimezone(data.timezone);
        setSlots(data.slots || []);
        setRangeStart(data.startDate);
        setRangeEnd(data.endDate);

        // default selected date
        if (data.startDate) {
          setSelectedDate(data.startDate);
        }
      } catch (err) {
        console.error("Error fetching public availability:", err);
        setApiError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) {
      fetchAvailability();
    }
  }, [username, slug]);

  const dateOptions = useMemo(
    () => buildDateRange(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );

  const slotsForSelectedDate = useMemo(
    () =>
      slots.filter((slot) => {
        if (!selectedDate) return false;
        const slotDate = getDateInTimeZone(slot.start, timezone);
        return slotDate === selectedDate;
      }),
    [slots, selectedDate, timezone]
  );

  console.log("SLOTS FOR SELECTED DATE:", slotsForSelectedDate);

  // 🔹 Booking handlers
  const openBookingModal = (slot) => {
    setSelectedSlot(slot);
    setBookingForm((prev) => ({
      ...prev,
      timezone: prev.timezone || timezone || "",
    }));
    setBookingError("");
    setBookingSuccessMessage("");
    setBookingStatus("idle");
    setIsBookingOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setSelectedSlot(null);
    setBookingStatus("idle");
    setBookingError("");
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!bookingForm.name || !bookingForm.email) {
      setBookingError("Name and email are required.");
      return;
    }

    setBookingStatus("loading");
    setBookingError("");
    setBookingSuccessMessage("");

    try {
      const res = await fetch(buildBookingUrl(username, slug), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: selectedSlot.start,
          inviteeName: bookingForm.name,
          inviteeEmail: bookingForm.email,
          inviteeTimezone: bookingForm.timezone || undefined,
          notes: bookingForm.notes || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        const msg = data.message || "Failed to create booking";
        throw new Error(msg);
      }

      // setBookingStatus("succeeded");
      // setBookingSuccessMessage("Your meeting is booked! 🎉");

      navigate("/booking/confirmed", {
      state: {
        booking: data.booking,
        event: data.event,
        host: data.host,
      },
    });
    } catch (err) {
      console.error("Booking error:", err);
      setBookingStatus("failed");
      setBookingError(err.message || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-sm text-slate-600">Loading availability...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex justify-center py-16">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Scheduling page not found
          </h1>
          <p className="text-sm text-slate-600">
            This event link may be incorrect or no longer active.
          </p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex justify-center py-16">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-red-600 mb-2">{apiError}</p>
          <p className="text-xs text-slate-500">
            Try refreshing the page or contact the host if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  if (!eventInfo || !hostInfo) {
    return null; // should not happen normally
  }

  const selectedSlotTimeLabel =
    selectedSlot && timezone
      ? `${formatTimeFromIso(selectedSlot.start, timezone)} – ${formatTimeFromIso(
          selectedSlot.end,
          timezone
        )}`
      : "";

  return (
    <div className="py-10 flex flex-col md:flex-row gap-8">
      {/* Left: Event info */}
      <div className="md:w-1/2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-1">
            {hostInfo.name} · @{hostInfo.username}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {eventInfo.title}
          </h1>
          {eventInfo.description && (
            <p className="text-sm text-slate-600 mb-4">
              {eventInfo.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100">
              ⏱ {eventInfo.durationMinutes} min
            </span>
            {timezone && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100">
                🌍 {timezone}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
          Select a date and time on the right to book this event.
        </div>
      </div>

      {/* Right: Date + slots */}
      <div className="md:w-1/2 space-y-4">
        {/* Date picker */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-medium text-slate-900 mb-3">
            Select a date
          </h2>

          {dateOptions.length === 0 ? (
            <p className="text-xs text-slate-500">
              This host hasn&apos;t set up availability yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Day buttons */}
              <div className="flex flex-wrap gap-2">
                {dateOptions.map((date) => {
                  const isSelected = date === selectedDate;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                        isSelected
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-700"
                      }`}
                    >
                      <div>{formatDateHuman(date)}</div>
                    </button>
                  );
                })}
              </div>

              {/* Also allow manual selection via input[type=date] */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">
                  Or pick a date:
                </label>
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={selectedDate || ""}
                  min={rangeStart || undefined}
                  max={rangeEnd || undefined}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Slots for selected date */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-medium text-slate-900 mb-3">
            Available times
          </h2>

          {!selectedDate ? (
            <p className="text-xs text-slate-500">
              Choose a date to see available time slots.
            </p>
          ) : slotsForSelectedDate.length === 0 ? (
            <p className="text-xs text-slate-500">
              No available times for{" "}
              <span className="font-medium">
                {formatDateHuman(selectedDate)}
              </span>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slotsForSelectedDate.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:border-sky-500 hover:text-sky-700"
                  onClick={() => openBookingModal(slot)}
                >
                  {formatTimeFromIso(slot.start, timezone)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && selectedSlot && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4 p-5 relative">
            <button
              type="button"
              onClick={closeBookingModal}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Confirm your booking
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {formatDateHuman(
                getDateInTimeZone(selectedSlot.start, timezone)
              )}{" "}
              · {selectedSlotTimeLabel}
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bookingForm.name}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bookingForm.email}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Your timezone (optional)
                </label>
                <input
                  type="text"
                  name="timezone"
                  placeholder="e.g. Asia/Kolkata"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bookingForm.timezone}
                  onChange={handleBookingChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  placeholder="Anything you'd like the host to know?"
                />
              </div>

              {bookingError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {bookingError}
                </div>
              )}

              {bookingStatus === "succeeded" && bookingSuccessMessage && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                  {bookingSuccessMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingStatus === "loading"}
                  className="text-xs px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {bookingStatus === "loading"
                    ? "Booking..."
                    : "Confirm booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
