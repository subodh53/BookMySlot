import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-7xl font-bold text-slate-800 mb-4">404</h1>
      <p className="text-slate-600 text-sm md:text-base mb-6">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>

      <Link
        to="/"
        className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
      >
        Go back home
      </Link>

      <p className="text-xs text-slate-400 mt-4">
        Error code: <span className="font-semibold">404_PAGE_NOT_FOUND</span>
      </p>
    </div>
  );
}
