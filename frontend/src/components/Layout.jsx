import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice.js";

export default function Layout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg">
              C
            </span>
            <span className="font-semibold text-slate-800">
              Calendly Clone
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-700">
                  {user.name} (@{user.username})
                </span>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-sm text-sky-700 hover:text-sky-900"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : !isAuthPage ? (
              <>
                <Link
                  to="/login"
                  className="text-sm text-slate-700 hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 rounded-lg"
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      <footer className="border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Built with React, Tailwind, Redux Toolkit, and Node.js
      </footer>
    </div>
  );
}
