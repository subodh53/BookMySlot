import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchEventTypes,
  createEventType,
  deleteEventType,
} from "../features/eventTypes/eventTypeSlice.js";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, status, creating, error } = useSelector(
    (state) => state.eventTypes
  );

  const [form, setForm] = useState({
    title: "",
    slug: "",
    durationMinutes: 30,
  });

  useEffect(() => {
    dispatch(fetchEventTypes());
  }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createEventType(form));
    if (createEventType.rejected.match(result)) {
      alert(result.payload || "Failed to create event type");
    } else {
      setForm({ title: "", slug: "", durationMinutes: 30 });
      dispatch(fetchEventTypes());
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event type?")) return;
    const result = await dispatch(deleteEventType(id));
    if (deleteEventType.rejected.match(result)) {
      alert(result.payload || "Failed to delete event type");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Dashboard
        </h1>
        {user && (
          <p className="text-sm text-slate-600">
            Welcome, <span className="font-medium">{user.name}</span> — your
            public prefix:{" "}
            <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">
              /u/{user.username}
            </code>
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-medium text-slate-900 mb-3">
          Create an event type
        </h2>
        <form
          className="grid md:grid-cols-4 gap-3 items-end"
          onSubmit={handleCreate}
        >
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              name="title"
              placeholder="30 min meeting"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Slug
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              name="slug"
              placeholder="30-min"
              value={form.slug}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={480}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              name="durationMinutes"
              value={form.durationMinutes}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-medium text-slate-900 mb-3">
          Your event types
        </h2>

        {status === "loading" ? (
          <div className="text-sm text-slate-500">Loading event types...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">
            You don’t have any event types yet. Create your first one above.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((et) => (
              <li
                key={et._id}
                className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {et.title}{" "}
                    <span className="text-xs text-slate-500">
                      ({et.durationMinutes} mins)
                    </span>
                  </div>
                  {user && (
                    <div className="text-xs text-slate-500">
                      Public link:{" "}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                        /u/{user.username}/event/{et.slug}
                      </code>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(et._id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
