// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Landing() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Left: Text */}
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wide text-sky-600 uppercase mb-2">
            Simple scheduling, for everyone
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight mb-4">
            Let people book your time
            <span className="text-sky-600"> without the back-and-forth.</span>
          </h1>
          <p className="text-slate-600 mb-8 text-sm md:text-base">
            Create event types, share a single link, and let clients, patients,
            or teammates pick a time that works for everyone. A lightweight
            Calendly-style scheduler built with the MERN stack.
          </p>

          {user ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                Go to Dashboard
              </Link>
              <p className="text-xs text-slate-500">
                Logged in as{" "}
                <span className="font-medium">{user.name}</span> (@
                {user.username})
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                Get started for free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                Log in
              </Link>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            No credit card. Just a clean scheduling experience built by you. ✨
          </p>
        </div>

        {/* Right: Simple preview card */}
        <div className="flex-1 w-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">Example event type</p>
                <p className="text-sm font-semibold text-slate-900">
                  30 min intro call
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                Available
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4 text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                <div
                  key={idx}
                  className={`py-1 rounded-lg ${
                    idx === 2
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 mb-2">Today&apos;s slots</p>
            <div className="flex flex-wrap gap-2">
              {["10:00", "10:30", "11:00", "11:30", "12:00"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:border-sky-500 hover:text-sky-700 cursor-pointer"
                >
                  {t}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-400">
                + more
              </span>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              This is just a preview UI. Your real booking pages will use your
              username and event types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
