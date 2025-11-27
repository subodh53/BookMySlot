// frontend/src/components/AvailabilitySettings.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailability,
  saveAvailability,
} from "../features/availability/availabilitySlice";

const WEEKDAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

export default function AvailabilitySettings() {
  const dispatch = useDispatch();
  const { weekly, status, saving, error } = useSelector(
    (state) => state.availability
  );

  const [localWeekly, setLocalWeekly] = useState([]);

  // Load availability on mount
  useEffect(() => {
    dispatch(fetchAvailability());
  }, [dispatch]);

  // Sync local state when weekly changes
  useEffect(() => {
    const map = new Map();
    weekly.forEach((w) => {
      map.set(w.weekday, { ...w });
    });

    const rows = WEEKDAYS.map((wd) => {
      const existing = map.get(wd.value);
      return {
        weekday: wd.value,
        label: wd.label,
        enabled: !!existing,                      // enabled if it exists in DB
        startTime: existing?.startTime || "",
        endTime: existing?.endTime || "",
      };
    });

    setLocalWeekly(rows);
  }, [weekly]);

  const handleTimeChange = (weekday, field, value) => {
    setLocalWeekly((prev) =>
      prev.map((row) =>
        row.weekday === weekday ? { ...row, [field]: value, enabled: true } : row
      )
    );
  };

  const handleToggleEnabled = (weekday) => {
    setLocalWeekly((prev) =>
      prev.map((row) =>
        row.weekday === weekday
          ? {
              ...row,
              enabled: !row.enabled,
              // if disabling, clear times
              startTime: !row.enabled ? row.startTime : "",
              endTime: !row.enabled ? row.endTime : "",
            }
          : row
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Only send days that are enabled AND have start+end time
    const cleaned = localWeekly
      .filter((row) => row.enabled && row.startTime && row.endTime)
      .map((row) => ({
        weekday: row.weekday,
        startTime: row.startTime,
        endTime: row.endTime,
      }));

    const result = await dispatch(
      saveAvailability({
        weekly: cleaned,
        // exceptions can be added later
      })
    );

    dispatch(fetchAvailability());

    if (saveAvailability.rejected.match(result)) {
      alert(result.payload || "Failed to save availability");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-slate-900">
          Weekly availability
        </h2>
        {status === "loading" && (
          <span className="text-xs text-slate-500">Loading...</span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Set your regular weekly hours. Disable a day to mark yourself as not
        available.
      </p>

      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          {localWeekly.map((row) => (
            <div
              key={row.weekday}
              className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-3">
                {/* Enabled toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleEnabled(row.weekday)}
                  className={`w-9 h-5 flex items-center rounded-full px-0.5 transition ${
                    row.enabled ? "bg-sky-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 bg-white rounded-full shadow transform transition ${
                      row.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="text-sm text-slate-800">{row.label}</div>
              </div>

              {row.enabled ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">From</span>
                    <input
                      type="time"
                      className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={row.startTime}
                      onChange={(e) =>
                        handleTimeChange(
                          row.weekday,
                          "startTime",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">to</span>
                    <input
                      type="time"
                      className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={row.endTime}
                      onChange={(e) =>
                        handleTimeChange(
                          row.weekday,
                          "endTime",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Not available
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>
      </form>
    </div>
  );
}
