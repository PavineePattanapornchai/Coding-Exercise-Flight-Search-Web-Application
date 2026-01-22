import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSearch, fetchStats, login, register } from "./api.js";
import headerImage from "./assets/signin-header.jpg";
import logo from "./assets/logo.png";

const emptySearch = { status: "idle", data: null, message: "" };

const supportedTypes = ["", "aircraft", "airline", "callsign"];

function SearchSection({ title, items, onSelect }) {
  return (
    <section className="section">
      <div className="section-title">{title}</div>
      <div className="card-grid">
        {items.length === 0 ? (
          <div className="card muted">No items available.</div>
        ) : (
          items.map((item) => (
            <button
              key={`${item.type}-${item.query}`}
              className="card card-button"
              onClick={() => onSelect(item)}
            >
              <div className="card-label">{item.query}</div>
              <div className="card-meta">Count: {item.count}</div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="card muted">
        Click a popular search to see flight details.
      </div>
    );
  }

  if (result.type === "callsign") {
    const route = result.data?.flightroute;
    if (!route) {
      return <div className="card muted">No route data available.</div>;
    }

    return (
      <div className="card">
        <div className="card-label">{route.callsign}</div>
        <div className="card-meta">
          {route.origin?.municipality} ({route.origin?.iata_code}) →{" "}
          {route.destination?.municipality} ({route.destination?.iata_code})
        </div>
        <div className="card-meta">Airline: {route.airline?.name}</div>
      </div>
    );
  }

  if (result.type === "aircraft") {
    const aircraft = result.data?.aircraft;
    if (!aircraft) {
      return <div className="card muted">No aircraft data available.</div>;
    }

    return (
      <div className="card">
        <div className="card-label">
          {aircraft.manufacturer} {aircraft.type}
        </div>
        <div className="card-meta">Registration: {aircraft.registration}</div>
        <div className="card-meta">
          Owner: {aircraft.registered_owner || "Unknown"}
        </div>
      </div>
    );
  }

  if (result.type === "airline") {
    const airline = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!airline) {
      return <div className="card muted">No airline data available.</div>;
    }

    return (
      <div className="card">
        <div className="card-label">{airline.name}</div>
        <div className="card-meta">
          ICAO: {airline.icao} | IATA: {airline.iata}
        </div>
        <div className="card-meta">
          Country: {airline.country} ({airline.country_iso})
        </div>
      </div>
    );
  }

  return <div className="card muted">Unsupported result type.</div>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({ callsign: [], aircraft: [], airline: [] });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [searchState, setSearchState] = useState(emptySearch);
  const emailInputRef = useRef(null);
  const resultsRef = useRef(null);
  const [manualSearch, setManualSearch] = useState("");
  const [manualType, setManualType] = useState("");

  const isAuthed = Boolean(token);

  const popular = useMemo(
    () => ({
      callsign: stats.callsign || [],
      aircraft: stats.aircraft || [],
      airline: stats.airline || []
    }),
    [stats]
  );

  useEffect(() => {
    if (!isAuthed) {
      setStats({ callsign: [], aircraft: [], airline: [] });
      return;
    }

    setStatsLoading(true);
    setStatsError("");

    fetchStats(token)
      .then((data) => setStats(data.popular || {}))
      .catch((err) => setStatsError(err.message))
      .finally(() => setStatsLoading(false));
  }, [isAuthed, token]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setToken("");
      setUser(null);
      setSearchState(emptySearch);
      setAuthForm({ email: "", password: "", confirmPassword: "" });
      setManualSearch("");
      setManualType("");
      setAuthError("");
      setAuthNotice("Session expired. Please sign in again.");
    };

    window.addEventListener("auth:logout", handleSessionExpired);
    return () => window.removeEventListener("auth:logout", handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!isAuthed && authMode === "login") {
      emailInputRef.current?.focus();
    }
  }, [authMode, isAuthed]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "register" && authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match");
        setAuthLoading(false);
        return;
      }

      const action = authMode === "login" ? login : register;
      const data = await action(authForm);
      setAuthForm({ email: "", password: "", confirmPassword: "" });

      if (authMode === "register") {
        setAuthMode("login");
        setAuthNotice("Account created successfully. Please sign in.");
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSearchState(emptySearch);
    setAuthForm({ email: "", password: "", confirmPassword: "" });
    setManualSearch("");
    setManualType("");
    setAuthError("");
    setAuthNotice("");
  };

  const handleSelect = async (item) => {
    setSearchState({ status: "loading", data: null, message: "" });
    setManualSearch("");
    setManualType("");
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const data = await fetchSearch({ query: item.query, type: item.type, token });
      setSearchState({ status: "success", data, message: "" });
    } catch (err) {
      setSearchState({ status: "error", data: null, message: err.message });
    }
  };

  const handleManualSearch = async (event) => {
    event.preventDefault();
    const query = manualSearch.trim();
    const type = manualType;

    if (!query) {
      setSearchState({ status: "error", data: null, message: "Enter a search query" });
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSearchState({ status: "loading", data: null, message: "" });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const data = await fetchSearch({ query, type, token });
      setSearchState({ status: "success", data, message: "" });
    } catch (err) {
      setSearchState({ status: "error", data: null, message: err.message });
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src={logo} alt="Flight Searches logo" />
          <span>Flight Searches</span>
        </div>
        {isAuthed && (
          <div className="topbar-actions">
            <span className="user-pill">{user?.email}</span>
            <button className="button secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>
      <main className={`container ${isAuthed ? "flight-container" : "auth-container"}`}>
        {!isAuthed ? (
          <>
            <div className="hero-full">
              <img src={headerImage} alt="Agoda travel inspiration" />
            </div>
            <div className="card auth-card">
              <h1>{authMode === "login" ? "Sign In" : "Register"}</h1>
              <form onSubmit={handleAuthSubmit} className="form">
                <label>
                  Email
                  <input
                    type="email"
                    value={authForm.email}
                    ref={emailInputRef}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                    autoFocus
                  />
                </label>
              <label>
                  Password
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                        <path
                          d="M4 20 20 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                </label>
                {authMode === "register" && (
                  <label>
                    Confirm Password
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authForm.confirmPassword}
                        onChange={(event) =>
                          setAuthForm((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value
                          }))
                        }
                        required
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                            <path
                              d="M4 20 20 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                )}
                {authError && <div className="error">{authError}</div>}
                {authNotice && <div className="success">{authNotice}</div>}
                <button className="button primary" type="submit" disabled={authLoading}>
                  {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Register"}
                </button>
              </form>
              <div className="divider" />
              <button
                className="button link"
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                  setAuthNotice("");
                  setAuthForm({ email: "", password: "", confirmPassword: "" });
                }}
              >
                {authMode === "login"
                  ? "Need an account? Register"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>Flight Search</h1>
            {statsError && <div className="error">{statsError}</div>}
            <section className="section">
              <div className="section-title">Search</div>
              <form className="search-bar" onSubmit={handleManualSearch}>
                <div className="select-field">
                  <select
                    value={manualType}
                    onChange={(event) => setManualType(event.target.value)}
                  >
                    <option value="">All types</option>
                    <option value="aircraft">Aircraft</option>
                    <option value="airline">Airline</option>
                    <option value="callsign">Callsign</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Search by callsign, aircraft, or airline"
                  value={manualSearch}
                  onChange={(event) => setManualSearch(event.target.value)}
                />
                <button className="button primary" type="submit">
                  Search
                </button>
              </form>
              <div className="search-hint">
                Tip: leave type as "All types" to auto-detect.
              </div>
            </section>
            {statsLoading ? (
              <div className="card muted">Loading popular searches...</div>
            ) : (
              <>
                <SearchSection
                  title="Popular Aircraft"
                  items={popular.aircraft}
                  onSelect={handleSelect}
                />
                <SearchSection
                  title="Popular Airlines"
                  items={popular.airline}
                  onSelect={handleSelect}
                />
                <SearchSection
                  title="Popular Callsigns"
                  items={popular.callsign}
                  onSelect={handleSelect}
                />
              </>
            )}

            <section className="section" ref={resultsRef}>
              <div className="section-title">Result</div>
              {searchState.status === "loading" && (
                <div className="card muted">Loading...</div>
              )}
              {searchState.status === "error" && (
                <div className="card muted">{searchState.message}</div>
              )}
              {searchState.status === "success" && (
                <ResultCard result={searchState.data} />
              )}
              {searchState.status === "idle" && <ResultCard result={null} />}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
