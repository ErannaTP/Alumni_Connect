// App.jsx
import React, { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { Star, Search, User, LogIn, LogOut, Bell, MessageSquare, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Alumni Connect - Student Portal (Single File)
 * - Demo backend uses localStorage (for quick demo + to impress your madam)
 * - Features: Login / Register / Forgot Reset, Profile, Search & Filters, Alumni list, Connect requests, Notifications, Messaging
 *
 * Note: This is a demo. For production, replace localStorage code with secure server APIs.
 */

/* -------------------------
   LocalStorage keys / Mock DB
   ------------------------- */
const KEY_USERS = "ac_users_v2";
const KEY_SESSION = "ac_session_v2";
const KEY_ALUMNI = "ac_alumni_v2";
const KEY_CONNECTIONS = "ac_conns_v2";
const KEY_MESSAGES = "ac_msgs_v2";
const KEY_GUIDES = "ac_guides_v2";

/* -------------------------
   Small data helper (localStorage)
   ------------------------- */
const storage = {
  get(key) {
    const val = localStorage.getItem(key) || "[]";
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
};

/* -------------------------
   Mock API (localStorage)
   ------------------------- */
const api = {
  /* users (students) */
  async getUsers() { return storage.get(KEY_USERS); },
  async saveUsers(users) { storage.set(KEY_USERS, users); },

  async registerStudent({ name, email, password, branch, year, domain, description }) {
    const users = await this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    const hash = bcrypt.hashSync(password, 8);
    const user = {
      id: Date.now() + Math.floor(Math.random()*1000),
      role: "student",
      name,
      email: email.toLowerCase(),
      passwordHash: hash,
      branch: branch || "",
      year: year || "",
      domain: domain || "",
      description: description || "",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    await this.saveUsers(users);
    return { ...user, passwordHash: undefined };
  },

  async loginStudent({ email, password }) {
    const users = await this.getUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.role === "student");
    if (!u) throw new Error("No student found with this email");
    if (!bcrypt.compareSync(password, u.passwordHash)) throw new Error("Invalid credentials");
    return { ...u, passwordHash: undefined };
  },

  async updateStudentProfile(id, updates) {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx] = { ...users[idx], ...updates };
    await this.saveUsers(users);
    return { ...users[idx], passwordHash: undefined };
  },

  /* alumni (pre-populated sample data) */
  async getAlumni() {
    let list = storage.get(KEY_ALUMNI);
    if (!Array.isArray(list) || list.length === 0) {
      // seed some alumni
      list = [
        { id: 2001, name: "Kriti P", batch: "2023", role: "Data Analyst", domain: "Data Science", dept: "CS", bio: "Data enthusiast & mentor", rating: 4.8, linkedin: "https://linkedin.com/in/kritip" },
        { id: 2002, name: "Swapnil T", batch: "2021", role: "Software Engineer", domain: "Web Development", dept: "CS", bio: "Full-stack developer", rating: 4.6, linkedin: "https://linkedin.com/in/swapnilt" },
        { id: 2003, name: "Sneha R", batch: "2020", role: "Security Analyst", domain: "Cybersecurity", dept: "IT", bio: "Security specialist", rating: 4.9, linkedin: "https://linkedin.com/in/snehar" },
      ];
      storage.set(KEY_ALUMNI, list);
    }
    return list;
  },

  /* connections (student -> alumni requests) */
  async getConnections() { return storage.get(KEY_CONNECTIONS); },
  async saveConnections(conns) { storage.set(KEY_CONNECTIONS, conns); },

  async sendConnectionRequest(studentId, alumniId) {
    const conns = await this.getConnections();
    if (conns.find(c => c.studentId === studentId && c.alumniId === alumniId)) {
      throw new Error("Connection request already exists");
    }
    const rec = { id: Date.now() + Math.floor(Math.random()*1000), studentId, alumniId, status: "Pending", createdAt: new Date().toISOString() };
    conns.push(rec);
    await this.saveConnections(conns);
    return rec;
  },

  async respondToConnection(requestId, newStatus) {
    const conns = await this.getConnections();
    const idx = conns.findIndex(c => c.id === requestId);
    if (idx === -1) throw new Error("Request not found");
    conns[idx].status = newStatus;
    await this.saveConnections(conns);
    return conns[idx];
  },

  /* messages */
  async getMessages() { return storage.get(KEY_MESSAGES); },
  async saveMessages(msgs) { storage.set(KEY_MESSAGES, msgs); },

  async sendMessage(fromId, toId, text) {
    const msgs = await this.getMessages();
    const m = { id: Date.now() + Math.floor(Math.random()*1000), fromId, toId, text, createdAt: new Date().toISOString() };
    msgs.push(m);
    await this.saveMessages(msgs);
    return m;
  },

  /* guidance requests */
  async getGuides() { return storage.get(KEY_GUIDES); },
  async saveGuides(g) { storage.set(KEY_GUIDES, g); },

  async requestGuidance(studentId, alumniId, topic) {
    const guides = await this.getGuides();
    const rec = { id: Date.now()+Math.floor(Math.random()*1000), studentId, alumniId, topic, status: "Pending", createdAt: new Date().toISOString() };
    guides.push(rec);
    await this.saveGuides(guides);
    return rec;
  },

  /* update alumni rating (student feedback) */
  async rateAlumni(alumniId, newRating) {
    const list = storage.get(KEY_ALUMNI);
    const idx = list.findIndex(a => a.id === alumniId);
    if (idx === -1) throw new Error("Alumni not found");
    // simple: average stored rating by combining
    const old = list[idx].rating || 4.0;
    list[idx].rating = Math.round(((old + newRating) / 2) * 10) / 10;
    storage.set(KEY_ALUMNI, list);
    return list[idx];
  }
};

/* -------------------------
   Utilities
   ------------------------- */
function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}
const DOMAIN_OPTIONS = ["Data Science", "Web Development", "Cybersecurity", "IoT & Big Data", "AI/ML", "DevOps", "Cloud", "Mobile Dev"];

/* -------------------------
   UI Components
   ------------------------- */

function Navbar({ session, onNav, active }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600 text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold">AC</div>
        <div>
          <div className="font-semibold text-lg">Alumni Connect</div>
          <div className="text-xs text-slate-500">Student Portal</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {session && (
          <>
            <button onClick={() => onNav("home")} className={px-3 py-2 rounded-md ${active === "home" ? "bg-indigo-50" : ""}}>Home</button>
            <button onClick={() => onNav("alumni")} className={px-3 py-2 rounded-md ${active === "alumni" ? "bg-indigo-50" : ""}}>Alumni</button>
            <button onClick={() => onNav("requests")} className={px-3 py-2 rounded-md ${active === "requests" ? "bg-indigo-50" : ""}}>My Requests</button>
            <button onClick={() => onNav("profile")} className={px-3 py-2 rounded-md ${active === "profile" ? "bg-indigo-50" : ""}}>Profile</button>
          </>
        )}
        {!session ? (
          <div className="text-sm text-slate-600">Please login / register</div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-sm">{session.name}</div>
            <div className="text-xs text-slate-500">{session.email}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Main App */
export default function App() {
  const [session, setSession] = useState(() => {
    const s = localStorage.getItem(KEY_SESSION);
    if (s) return JSON.parse(s);
    return null;
  });
  const [page, setPage] = useState("login"); // login, register, forgot, reset, home, alumni, requests, profile
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) {
      localStorage.setItem(KEY_SESSION, JSON.stringify(session));
      // default landing page for logged-in
      setPage("home");
    } else {
      localStorage.removeItem(KEY_SESSION);
    }
  }, [session]);

  function handleNav(p) {
    setPage(p);
    setNotice(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Navbar session={session} onNav={handleNav} active={page} />

        {notice && <div className="p-3 rounded-md bg-green-50 text-green-700">{notice}</div>}
        {error && <div className="p-3 rounded-md bg-red-50 text-red-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {!session && page === "login" && (
              <LoginCard onLogin={(u) => setSession(u)} onSwitchRegister={() => setPage("register")} onForgot={() => setPage("forgot")} setError={setError} setNotice={setNotice} />
            )}

            {!session && page === "register" && (
              <RegisterCard onRegistered={() => { setNotice("Registered — please login"); setPage("login"); }} onSwitchLogin={() => setPage("login")} setError={setError} />
            )}

            {!session && page === "forgot" && (
              <ForgotCard onBack={() => setPage("login")} setNotice={setNotice} setError={setError} />
            )}

            {session && (page === "home") && (
              <HomePage session={session} setError={setError} setNotice={setNotice} />
            )}

            {session && (page === "alumni") && (
              <AlumniPage session={session} setError={setError} setNotice={setNotice} />
            )}

            {session && (page === "requests") && (
              <RequestsPage session={session} setError={setError} setNotice={setNotice} />
            )}

            {session && (page === "profile") && (
              <ProfilePage session={session} setSession={setSession} setError={setError} setNotice={setNotice} />
            )}
          </div>

          <div>
            <RightPanel session={session} setNotice={setNotice} setError={setError} />
          </div>
        </div>

        <footer className="text-center text-sm text-slate-500">Alumni Connect — Student Demo (localStorage)</footer>
      </div>
    </div>
  );
}

/* -------------------------
   Login / Register / Forgot Components
   ------------------------- */

function LoginCard({ onLogin, onSwitchRegister, onForgot, setError, setNotice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const u = await api.loginStudent({ email, password });
      onLogin(u);
      setNotice(Welcome back, ${u.name.split(" ")[0]}!);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="bg-white rounded-xl p-6 shadow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-semibold">Welcome back</h2>
      <p className="text-sm text-slate-500 mt-1">Sign in to Alumni Connect</p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="text-xs">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="you@college.edu" required />
        </div>

        <div>
          <label className="text-xs">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Your password" required />
        </div>

        <div className="flex items-center justify-between">
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
          <div className="flex gap-3 items-center">
            <button type="button" onClick={onForgot} className="text-sm text-slate-600 underline">Forgot?</button>
            <button type="button" onClick={onSwitchRegister} className="text-sm text-slate-600 underline">Create account</button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

function RegisterCard({ onRegistered, onSwitchLogin, setError }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Full name required");
    if (!validateEmail(email)) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== password2) return setError("Passwords do not match");

    try {
      setLoading(true);
      await api.registerStudent({ name, email, password, branch, year, domain, description });
      onRegistered();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="bg-white rounded-xl p-6 shadow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-semibold">Alumni Connect — Create Account</h2>
      <p className="text-sm text-slate-500 mt-1">Join as a student to connect with alumni</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full rounded-md border px-3 py-2" required />
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-md border px-3 py-2" required />
          <input value={password2} onChange={e => setPassword2(e.target.value)} type="password" placeholder="Confirm password" className="w-full rounded-md border px-3 py-2" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="Branch (department)" className="rounded-md border px-3 py-2" />
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="Graduation year" className="rounded-md border px-3 py-2" />
          <select value={domain} onChange={e => setDomain(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Interested domain</option>
            {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description / skills / about you" className="w-full rounded-md border px-3 py-2" rows={3} />

        <div className="flex items-center justify-between">
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white">Register</button>
          <button type="button" onClick={onSwitchLogin} className="text-sm underline text-slate-600">Already have account? Login</button>
        </div>
      </form>
    </motion.div>
  );
}

function ForgotCard({ onBack, setNotice, setError }) {
  const [email, setEmail] = useState("");
  const [sentCode, setSentCode] = useState(null);
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError(null);
    if (!validateEmail(email)) return setError("Enter a valid email");
    // Demo: we "send" a code by showing it on UI
    const c = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(c);
    setNotice(Reset code sent (demo): ${c});
  }

  async function reset() {
    setError(null);
    if (!sentCode) return setError("Please request a reset code first");
    if (code !== sentCode) return setError("Invalid code");
    if (newPass.length < 6) return setError("Password at least 6 chars");
    try {
      setLoading(true);
      const users = await api.getUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) throw new Error("Email not registered");
      users[idx].passwordHash = bcrypt.hashSync(newPass, 8);
      await api.saveUsers(users);
      setNotice("Password updated — please login");
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-xl font-semibold">Forgot Password</h2>
      <p className="text-sm text-slate-500">Enter your registered email</p>

      <div className="mt-4 space-y-3">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Registered email" className="w-full rounded-md border px-3 py-2" />
        {!sentCode ? (
          <div className="flex gap-3">
            <button onClick={sendCode} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Send reset code</button>
            <button onClick={onBack} className="px-3 py-2 rounded-md border">Back</button>
          </div>
        ) : (
          <div className="space-y-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter reset code (demo shown above)" className="w-full rounded-md border px-3 py-2" />
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" className="w-full rounded-md border px-3 py-2" />
            <div className="flex gap-3">
              <button onClick={reset} className="px-3 py-2 rounded-md bg-indigo-600 text-white" disabled={loading}>{loading ? "Resetting..." : "Reset password"}</button>
              <button onClick={onBack} className="px-3 py-2 rounded-md border">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------
   Pages: Home / Alumni / Requests / Profile
   ------------------------- */

function HomePage({ session, setNotice, setError }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold">Home</h2>
      <p className="text-sm text-slate-500 mt-1">Welcome to Alumni Connect. Use the Alumni section to search and connect.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold">Quick Actions</h4>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 rounded-md bg-indigo-600 text-white" onClick={() => setNotice("Try the Alumni tab to search mentors")}>Find Alumni</button>
            <button className="px-3 py-2 rounded-md border" onClick={() => setNotice("Use Profile to update your details")}>Update Profile</button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold">Top Rated Alumni</h4>
          <TopRatedPreview />
        </div>
      </div>
    </div>
  );
}

/* Top rated preview (small) */
function TopRatedPreview() {
  const [list, setList] = useState([]);
  useEffect(() => {
    async function load() {
      const a = await api.getAlumni();
      setList(a.sort((x, y) => (y.rating || 0) - (x.rating || 0)).slice(0, 3));
    }
    load();
  }, []);
  return (
    <div className="mt-3 space-y-3">
      {list.map(al => (
        <div key={al.id} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold">{al.name.charAt(0)}</div>
          <div>
            <div className="font-medium">{al.name} <span className="text-xs text-slate-400">({al.batch})</span></div>
            <div className="text-xs text-slate-500">{al.role} • {al.domain}</div>
          </div>
          <div className="ml-auto flex items-center gap-1"><Star size={16} className="text-amber-500" /> <span className="font-semibold">{al.rating}</span></div>
        </div>
      ))}
    </div>
  );
}

/* Alumni Page: Search, Filters, List */
function AlumniPage({ session, setError, setNotice }) {
  const [alumni, setAlumni] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ dept: "", year: "", domain: "" });
  const [selected, setSelected] = useState(null);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      const a = await api.getAlumni();
      setAlumni(a);
      setResults(a.sort((x,y)=> (y.rating||0)-(x.rating||0)));
      const c = await api.getConnections();
      setConnections(c);
      const m = await api.getMessages();
      setMessages(m);
    }
    load();
  }, []);

  useEffect(() => {
    // search + filters
    const q = query.trim().toLowerCase();
    let r = alumni.filter(a => (a.name.toLowerCase().includes(q) || a.domain.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)));
    if (filters.dept) r = r.filter(a => (a.dept || "").toLowerCase().includes(filters.dept.toLowerCase()));
    if (filters.year) r = r.filter(a => (a.batch || "") === filters.year);
    if (filters.domain) r = r.filter(a => (a.domain || "").toLowerCase().includes(filters.domain.toLowerCase()));
    r = r.sort((x, y) => (y.rating || 0) - (x.rating || 0));
    setResults(r);
  }, [query, filters, alumni]);

  async function sendRequest(alumniId) {
    setError(null);
    try {
      const req = await api.sendConnectionRequest(session.id, alumniId);
      setConnections(prev => [...prev, req]);
      setNotice("Connection request sent");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Search Guidance</h2>
          <p className="text-sm text-slate-500">Filter by Dept, Year, Domain — results sorted by top ratings</p>
        </div>

        <div className="flex gap-2 items-center">
          <input placeholder="Search by name or domain" value={query} onChange={e => setQuery(e.target.value)} className="rounded-md border px-3 py-2" />
          <button className="px-3 py-2 rounded-md border" onClick={() => { /no-op, live search/ }}>Search</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input placeholder="Department" value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))} className="rounded-md border px-3 py-2" />
        <input placeholder="Year" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="rounded-md border px-3 py-2" />
        <select value={filters.domain} onChange={e => setFilters(f => ({ ...f, domain: e.target.value }))} className="rounded-md border px-3 py-2">
          <option value="">Domain (all)</option>
          {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select onChange={e => {
          const v = e.target.value;
          if (v === "rating") setResults(prev => [...prev].sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        }} className="rounded-md border px-3 py-2">
          <option value="">Sort</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {results.map(a => (
            <div key={a.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center font-semibold text-indigo-700">{a.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold">{a.name} <span className="text-xs text-slate-400">({a.batch})</span></div>
                  <div className="text-sm text-slate-600">{a.role} • {a.domain}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.bio}</div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  <div className="font-semibold">{a.rating}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(a)} className="px-3 py-1 border rounded-md">Profile</button>
                  <button onClick={() => sendRequest(a.id)} className="px-3 py-1 rounded-md bg-indigo-600 text-white">Connect</button>
                </div>
                <div className="flex gap-2 items-center mt-1 text-xs">
                  <a href={a.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline text-slate-600">
                    <LinkIcon size={14} /> LinkedIn
                  </a>
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-xs">Alumni ★</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="p-3 rounded-lg border">
            <h4 className="font-semibold">My Requests</h4>
            <MyRequestList studentId={session.id} />
          </div>

          <div className="mt-3 p-3 rounded-lg border">
            <h4 className="font-semibold">Recommendations</h4>
            <RecommendationsPanel studentDomain={session.domain} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <AlumniProfileModal alumni={selected} onClose={() => setSelected(null)} currentStudent={session} />
      </div>
    </div>
  );
}

/* My Requests: shows requests where student is requester or (for demo) shows pending to be accepted by alumni (simulate acceptance) */
function MyRequestList({ studentId }) {
  const [conns, setConns] = useState([]);

  useEffect(() => {
    async function load() {
      const cs = await api.getConnections();
      setConns(cs.filter(c => c.studentId === studentId));
    }
    load();
  }, [studentId]);

  return (
    <div className="space-y-2 mt-2">
      {conns.length === 0 && <div className="text-sm text-slate-500">No requests sent.</div>}
      {conns.map(c => (
        <div key={c.id} className="p-2 rounded-md bg-slate-50 border flex items-center justify-between">
          <div>
            <div className="text-sm">To alumni ID: {c.alumniId}</div>
            <div className="text-xs text-slate-500">Status: {c.status}</div>
          </div>
          <div className="text-xs text-slate-400">Sent: {new Date(c.createdAt).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsPanel({ studentDomain }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    async function load() {
      const a = await api.getAlumni();
      if (studentDomain) {
        setList(a.filter(x => x.domain?.toLowerCase().includes(studentDomain.toLowerCase())).slice(0, 3));
      } else {
        setList(a.slice(0, 3));
      }
    }
    load();
  }, [studentDomain]);

  return (
    <div className="mt-2 space-y-2">
      {list.map(r => (
        <div key={r.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-slate-500">{r.role} • {r.domain}</div>
          </div>
          <div className="text-xs">{r.rating} ★</div>
        </div>
      ))}
    </div>
  );
}

/* Modal showing alumni profile and messaging + guidance */
function AlumniProfileModal({ alumni, onClose, currentStudent }) {
  const [msg, setMsg] = useState("");
  const [guideTopic, setGuideTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    async function load() {
      if (!alumni) return;
      const m = await api.getMessages();
      setMessages(m.filter(mm => (mm.fromId === alumni.id && mm.toId === currentStudent.id) || (mm.fromId === currentStudent.id && mm.toId === alumni.id)));
      const c = await api.getConnections();
      setConnections(c);
    }
    load();
  }, [alumni, currentStudent]);

  async function sendMessage() {
    if (!msg.trim()) return;
    await api.sendMessage(currentStudent.id, alumni.id, msg.trim());
    setMsg("");
    // reload
    const m = await api.getMessages();
    setMessages(m.filter(mm => (mm.fromId === alumni.id && mm.toId === currentStudent.id) || (mm.fromId === currentStudent.id && mm.toId === alumni.id)));
  }

  async function requestGuide() {
    if (!guideTopic.trim()) return;
    await api.requestGuidance(currentStudent.id, alumni.id, guideTopic.trim());
    setGuideTopic("");
    alert("Guidance request submitted (demo)");
  }

  if (!alumni) return null;
  return (
    <div className="mt-4 p-4 rounded-lg border bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center font-semibold text-indigo-700 text-xl">{alumni.name.charAt(0)}</div>
          <div>
            <div className="text-lg font-semibold">{alumni.name} <span className="text-xs text-slate-400">({alumni.batch})</span></div>
            <div className="text-sm text-slate-600">{alumni.role} • {alumni.domain}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href={alumni.linkedin} className="text-indigo-600 underline flex items-center gap-1" target="_blank" rel="noreferrer"><LinkIcon size={14} /> LinkedIn</a>
          <span className="px-2 py-1 bg-slate-100 rounded-md">Alumni ★</span>
          <button onClick={onClose} className="px-3 py-1 rounded-md border">Close</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">About</h4>
          <div className="text-sm text-slate-600 mt-1">{alumni.bio}</div>

          <div className="mt-4">
            <h5 className="font-semibold">Request Guidance</h5>
            <div className="flex gap-2 mt-2">
              <input value={guideTopic} onChange={e => setGuideTopic(e.target.value)} placeholder="Topic e.g. resume review" className="rounded-md border px-3 py-2 w-full" />
              <button onClick={requestGuide} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Request</button>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold">Message</h5>
          <div className="border rounded-md p-2 h-44 overflow-auto bg-slate-50 mt-2">
            {messages.length === 0 && <div className="text-sm text-slate-500">No messages yet</div>}
            {messages.map(m => (
              <div key={m.id} className={mb-2 p-2 rounded-md ${m.fromId === currentStudent.id ? "bg-indigo-50 self-end" : "bg-white"}}>
                <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
                <div className="mt-1">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Write your message" className="rounded-md border px-3 py-2 w-full" />
            <button onClick={sendMessage} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Requests page: shows incoming notifications for a student (in this demo, student sees outgoing requests) 
   For demo: We'll show both outgoing (student->alumni) and allow a simulated 'accept' by clicking Accept (which would normally be done by alumni).
*/
function RequestsPage({ session, setError, setNotice }) {
  const [reqs, setReqs] = useState([]);
  const [alumni, setAlumni] = useState([]);

  useEffect(() => {
    async function load() {
      const c = await api.getConnections();
      setReqs(c.filter(r => r.studentId === session.id || r.alumniId === session.id)); // demo
      const a = await api.getAlumni();
      setAlumni(a);
    }
    load();
  }, [session]);

  async function accept(reqId) {
    try {
      await api.respondToConnection(reqId, "Accepted");
      setNotice("Connection accepted (simulated)");
      const c = await api.getConnections();
      setReqs(c.filter(r => r.studentId === session.id || r.alumniId === session.id));
    } catch (err) { setError(err.message); }
  }

  async function reject(reqId) {
    try {
      await api.respondToConnection(reqId, "Rejected");
      setNotice("Connection rejected (simulated)");
      const c = await api.getConnections();
      setReqs(c.filter(r => r.studentId === session.id || r.alumniId === session.id));
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold">My Requests</h2>
      <p className="text-sm text-slate-500 mt-1">Track requests and notifications. Accept or Reject (simulated) friend requests.</p>

      <div className="mt-4 space-y-3">
        {reqs.length === 0 && <div className="text-sm text-slate-500">No requests yet.</div>}
        {reqs.map(r => {
          const al = alumni.find(a => a.id === r.alumniId) || { name: Alumni ${r.alumniId} };
          return (
            <div key={r.id} className="p-3 rounded-md border flex items-center justify-between">
              <div>
                <div className="font-medium">{al.name} <span className="text-xs text-slate-400">({al.batch || "N/A"})</span></div>
                <div className="text-xs text-slate-500">Status: {r.status}</div>
              </div>
              <div className="flex gap-2">
                {r.status === "Pending" && <button onClick={() => accept(r.id)} className="px-3 py-1 rounded-md bg-indigo-600 text-white">Accept</button>}
                {r.status === "Pending" && <button onClick={() => reject(r.id)} className="px-3 py-1 rounded-md border">Reject</button>}
                <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Profile page: view & update student profile */
function ProfilePage({ session, setSession, setError, setNotice }) {
  const [name, setName] = useState(session.name || "");
  const [email] = useState(session.email || "");
  const [branch, setBranch] = useState(session.branch || "");
  const [year, setYear] = useState(session.year || "");
  const [domain, setDomain] = useState(session.domain || "");
  const [description, setDescription] = useState(session.description || "");
  const [loading, setLoading] = useState(false);

  async function updateProfile(e) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const updated = await api.updateStudentProfile(session.id, { name, branch, year, domain, description });
      setSession(updated);
      setNotice("Profile updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold">Profile Information</h2>
      <p className="text-sm text-slate-500 mt-1">Update your details so alumni can find you.</p>

      <form onSubmit={updateProfile} className="mt-4 space-y-3">
        <div>
          <label className="text-xs">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <label className="text-xs">Email (readonly)</label>
          <input value={email} readOnly className="mt-1 w-full rounded-md border px-3 py-2 bg-slate-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="Branch / Department" className="rounded-md border px-3 py-2" />
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="Graduation year" className="rounded-md border px-3 py-2" />
          <select value={domain} onChange={e => setDomain(e.target.value)} className="rounded-md border px-3 py-2">
            <option value="">Interested domain</option>
            {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs">Description / Skills</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border px-3 py-2" rows={3} />
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white" disabled={loading}>{loading ? "Updating..." : "Update profile"}</button>
          <button type="button" onClick={() => { setName(session.name); setBranch(session.branch || ""); setYear(session.year || ""); setDomain(session.domain || ""); setDescription(session.description || ""); }} className="px-3 py-2 rounded-md border">Reset</button>
        </div>
      </form>
    </div>
  );
}

/* Right panel showing notifications and quick actions */
function RightPanel({ session, setNotice, setError }) {
  const [connections, setConnections] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      const cs = await api.getConnections();
      setConnections(cs);
      const a = await api.getAlumni();
      setAlumni(a);
      const m = await api.getMessages();
      setMessages(m);
    }
    load();
  }, []);

  // incoming requests for this user (if user is alumni they would be receiver)
  const incoming = session ? connections.filter(c => c.alumniId === session.id && c.status === "Pending") : [];

  // outgoing to-alumni for the student
  const outgoing = session ? connections.filter(c => c.studentId === session.id) : [];

  return (
    <div className="sticky top-6 space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">{session ? session.name.charAt(0) : "S"}</div>
          <div>
            <div className="font-semibold">{session ? session.name : "Guest"}</div>
            <div className="text-xs text-slate-500">{session ? session.email : "Please login"}</div>
          </div>
        </div>

        <div className="mt-3">
          <h5 className="font-semibold">Notifications</h5>
          <div className="text-sm text-slate-500 mt-2">You will see connection responses and messages here (demo)</div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border">
        <h5 className="font-semibold">Requests</h5>
        <div className="mt-2 text-sm text-slate-500">
          Sent: {outgoing.length} • Incoming (as alumni): {incoming.length} (demo)
        </div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded-md bg-indigo-600 text-white w-full" onClick={() => setNotice("Check the Requests page to manage connections")}>Manage Requests</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border">
        <h5 className="font-semibold">Quick Tips</h5>
        <ul className="text-sm text-slate-500 mt-2 space-y-1">
          <li>Search using filters to find relevant alumni.</li>
          <li>Send connection requests and track status in My Requests.</li>
          <li>View alumni profiles and message them after connecting.</li>
        </ul>
      </div>
    </div>
  );
}