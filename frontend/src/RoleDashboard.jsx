import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BriefcaseBusiness, CalendarClock, CheckCircle2, CircleUserRound,
  FileText, MapPin, Plus, RefreshCw, Save, Search, ShieldCheck, Star,
  UserRound, Wrench, CarFront, LogOut, Upload, Building2, ClipboardList,
  Phone, Check, X, Clock3
} from "lucide-react";
import { cities } from "./data";
import "./role-dashboard.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const categories = ["Driver", "Plumbing", "Electrician", "Maid / House Help", "Cleaning", "Cooking", "Delivery", "Carpentry", "Other"];
const employmentTypes = [
  ["full_time", "Full-time"], ["part_time", "Part-time"],
  ["contract", "Contract"], ["temporary", "Temporary"]
];
const futureDate = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const pretty = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
const money = (value) => value == null || value === "" ? "Price on request" : `₹${Number(value).toLocaleString("en-IN")}`;

const ROLE_LABELS = {
  customer: "Customer",
  driver: "Driver",
  provider: "Service Provider / Job Seeker",
  employer: "Employer / Hiring"
};

export default function RoleDashboard({ user, onLogout, onBackHome, onUserUpdated }) {
  const token = localStorage.getItem("sevoraToken");
  const roles = user?.roles || ["customer"];
  const initialRole = roles[0] || "customer";

  const [activeRole, setActiveRole] = useState(initialRole);
  const isEmployer = activeRole === "employer";
  const isDriver = activeRole === "driver";
  const isProvider = activeRole === "provider";
  const isCustomer = activeRole === "customer";
  const isWorker = isDriver || isProvider;
  const workerType = isDriver ? "driver" : "home_service";

  const [tab, setTab] = useState("overview");
  const [city, setCity] = useState(user?.city || localStorage.getItem("sevoraCity") || "Rajpura");
  const [profile, setProfile] = useState({
    name: user?.name || "", phone: user?.phone || "",
    address: user?.address || "", city: user?.city || city
  });
  const [workerProfile, setWorkerProfile] = useState({
    skills: "", serviceCategories: isDriver ? "Driver" : "Plumbing, Electrical",
    serviceAreas: city, basePrice: "", availability: "available"
  });
  const [license, setLicense] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState(null);

  const loadLicensePreview = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/providers/me/driver-license`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        setLicensePreviewUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error("Could not fetch licence preview", e);
    }
  }, [token]);
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [receivedApplications, setReceivedApplications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState(city);
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [coverLetters, setCoverLetters] = useState({});
  const [jobForm, setJobForm] = useState({ title: "", description: "", category: "Driver", locality: city, employmentType: "part_time", salaryMin: "", salaryMax: "", business: "" });
  const [businessForm, setBusinessForm] = useState({ name: "", description: "", category: "Local Services", address: "", locality: city });
  const [requestForm, setRequestForm] = useState({ requestType: "home_service", category: "Plumbing", title: "", description: "", locality: city, address: user?.address || "", scheduledAt: futureDate(), estimatedPrice: "", pickup: "", destination: "", tripType: "one_way", vehicleTransmission: "manual" });
  const [bookingForm, setBookingForm] = useState({ serviceId: "", bookingType: "home_service", city, address: user?.address || "", scheduledAt: futureDate(), durationMinutes: "60", serviceDescription: "", pickup: "", destination: "", tripType: "one_way", note: "" });
  const [reviewDrafts, setReviewDrafts] = useState({});

  useEffect(() => {
    if (user?.roles?.[0] && user.roles[0] !== activeRole && !roles.includes(activeRole)) {
      setActiveRole(user.roles[0]);
    }
  }, [user?.roles]);

  const api = useCallback(async (path, options = {}) => {
    const headers = { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.message || `Request failed (${response.status})`); error.status = response.status; throw error; }
    return data;
  }, [token]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    const tasks = [
      ["jobs", `/jobs?locality=${encodeURIComponent(filterCity)}&q=${encodeURIComponent(search)}${filterCategory ? `&category=${encodeURIComponent(filterCategory)}` : ""}`, (d) => setJobs(d.jobs || [])],
      ["apps", "/applications/my", (d) => setMyApplications(d.applications || [])],
      ["bookings", "/bookings/my", (d) => setBookings(d.bookings || [])],
      ["requests", `/service-requests?locality=${encodeURIComponent(filterCity)}`, (d) => setRequests(d.requests || [])],
      ["myRequests", "/service-requests/my", (d) => setMyRequests(d.requests || [])],
      ["services", "/services?limit=100", (d) => setServices(d.services || [])]
    ];
    if (isEmployer) {
      tasks.push(["businesses", "/businesses/my", (d) => {
        const list = d.businesses || []; setBusinesses(list);
        setJobForm((p) => ({ ...p, business: p.business || (list[0]?._id || "") }));
      }]);
      tasks.push(["myJobs", "/jobs/my", (d) => setMyJobs(d.jobs || [])]);
      tasks.push(["received", "/applications/received", (d) => setReceivedApplications(d.applications || [])]);
    }
    if (isWorker) {
      tasks.push(["workerProfile", "/providers/me", (d) => {
        const p = d.profile;
        if (p) {
          setWorkerProfile({
            skills: (p.skills || []).join(", "),
            serviceCategories: (p.serviceCategories || []).join(", "),
            serviceAreas: (p.serviceAreas || []).join(", "),
            basePrice: p.basePrice ?? "",
            availability: p.availability || "available"
          });
          setLicenseInfo(p.driverLicense || null);
          if (p.driverLicense?.status === "uploaded") loadLicensePreview();
        }
      }]);
    }
    const results = await Promise.allSettled(tasks.map(async ([key, path, apply]) => {
      try {
        const data = await api(path);
        apply(data);
        return key;
      } catch (error) {
        if (key === "workerProfile" && error.status === 404) return key;
        throw error;
      }
    }));
    const failures = results.map((r, i) => r.status === "rejected" ? `${tasks[i][0]}: ${r.reason.message}` : null).filter(Boolean);
    if (failures.length) setError(failures.join(" · "));
    setLoading(false);
  }, [api, token, filterCity, search, filterCategory, isEmployer, isWorker]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const visibleJobs = useMemo(() => jobs.filter((j) => {
    const q = search.trim().toLowerCase();
    const text = [j.title, j.description, j.category, j.locality, j.business?.name].join(" ").toLowerCase();
    return !q || text.includes(q);
  }), [jobs, search]);

  async function runAction(key, action, success) {
    setBusy(key); setError(""); setNotice("");
    try { await action(); setNotice(success); await loadAll(); }
    catch (e) { setError(e.message || "Something went wrong."); }
    finally { setBusy(""); }
  }

  async function handleSwitchRole(newRole) {
    setActiveRole(newRole);
    setTab("overview");
    await runAction("switch-role", async () => {
      const data = await api("/auth/me", { method: "PATCH", body: JSON.stringify({ role: newRole }) });
      const updated = data.user || data;
      const nextUser = { ...user, ...updated, roles: [newRole, ...roles.filter(r => r !== newRole)] };
      localStorage.setItem("sevoraUser", JSON.stringify(nextUser));
      onUserUpdated?.(nextUser);
    }, `Switched to ${ROLE_LABELS[newRole]} workspace.`);
  }

  async function saveProfile(e) {
    e.preventDefault();
    await runAction("profile", async () => {
      const data = await api("/auth/me", { method: "PATCH", body: JSON.stringify(profile) });
      const updated = data.user || data;
      const next = { ...user, ...updated };
      localStorage.setItem("sevoraUser", JSON.stringify(next));
      onUserUpdated?.(next);
      setProfile({ name: next.name || "", phone: next.phone || "", address: next.address || "", city: next.city || city });
      setCity(next.city || city); localStorage.setItem("sevoraCity", next.city || city);
    }, "Profile saved successfully.");
  }

  async function saveWorkerProfile(e) {
    e.preventDefault();
    await runAction("worker", async () => {
      await api("/providers/me", { method: "POST", body: JSON.stringify({
        providerType: workerType,
        skills: workerProfile.skills.split(",").map(s => s.trim()).filter(Boolean),
        serviceCategories: workerProfile.serviceCategories.split(",").map(s => s.trim()).filter(Boolean),
        serviceAreas: workerProfile.serviceAreas.split(",").map(s => s.trim()).filter(Boolean),
        basePrice: workerProfile.basePrice === "" ? null : Number(workerProfile.basePrice),
        availability: workerProfile.availability
      }) });
    }, "Worker profile saved.");
  }

  async function uploadLicense(e) {
    e.preventDefault();
    if (!license) { setError("Choose a driving licence file first."); return; }
    await runAction("license", async () => {
      const form = new FormData(); form.append("license", license);
      const data = await api("/providers/me/driver-license", { method: "POST", body: form });
      setLicense(null); setLicenseInfo(data.license || data.driverLicense || { uploadedAt: new Date().toISOString() });
      await loadLicensePreview();
    }, "Driving licence uploaded successfully.");
  }

  async function createBusiness(e) {
    e.preventDefault();
    await runAction("business", async () => {
      const data = await api("/businesses", { method: "POST", body: JSON.stringify(businessForm) });
      const business = data.business;
      if (business?._id) setJobForm(p => ({ ...p, business: business._id }));
      setBusinessForm({ name: "", description: "", category: "Local Services", address: "", locality: city });
    }, "Business added successfully.");
  }

  async function postJob(e) {
    e.preventDefault();
    if (!jobForm.business) { setError("Create or select a business before posting a job."); setTab("business"); return; }
    await runAction("post-job", async () => {
      await api("/jobs", { method: "POST", body: JSON.stringify({
        ...jobForm, salaryMin: jobForm.salaryMin === "" ? undefined : Number(jobForm.salaryMin),
        salaryMax: jobForm.salaryMax === "" ? undefined : Number(jobForm.salaryMax)
      }) });
      setJobForm(p => ({ ...p, title: "", description: "", salaryMin: "", salaryMax: "" }));
    }, "Job posted successfully.");
  }

  async function applyToJob(job) {
    await runAction(`apply-${job._id}`, async () => {
      await api("/applications", { method: "POST", body: JSON.stringify({
        jobId: job._id, city: filterCity, coverLetter: coverLetters[job._id] || ""
      }) });
      setCoverLetters(p => ({ ...p, [job._id]: "" }));
    }, "Application submitted successfully.");
  }

  async function updateApplication(id, status) {
    await runAction(`application-${id}`, async () => {
      await api(`/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    }, `Application marked ${pretty(status).toLowerCase()}.`);
  }

  async function createRequest(e) {
    e.preventDefault();
    await runAction("request", async () => {
      const payload = {
        requestType: requestForm.requestType, category: requestForm.category,
        title: requestForm.title, description: requestForm.description,
        locality: requestForm.locality, scheduledAt: new Date(requestForm.scheduledAt).toISOString(),
        ...(requestForm.estimatedPrice !== "" ? { estimatedPrice: Number(requestForm.estimatedPrice) } : {}),
        ...(requestForm.requestType === "home_service" ? { address: requestForm.address } : {
          trip: { pickup: requestForm.pickup, destination: requestForm.destination, tripType: requestForm.tripType, vehicleTransmission: requestForm.vehicleTransmission }
        })
      };
      await api("/service-requests", { method: "POST", body: JSON.stringify(payload) });
      setRequestForm(p => ({ ...p, title: "", description: "", estimatedPrice: "", scheduledAt: futureDate() }));
    }, "Service request posted successfully.");
  }

  async function acceptRequest(request) {
    await runAction(`accept-${request._id}`, async () => {
      await api(`/service-requests/${request._id}/accept`, { method: "POST", body: JSON.stringify({}) });
    }, "Request accepted.");
  }

  async function updateRequestStatus(request, status) {
    await runAction(`request-status-${request._id}`, async () => {
      await api(`/service-requests/${request._id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    }, `Request updated to ${pretty(status)}.`);
  }

  async function createBooking(e) {
    e.preventDefault();
    await runAction("booking", async () => {
      const service = services.find(s => s._id === bookingForm.serviceId);
      const payload = {
        ...(bookingForm.serviceId ? { serviceId: bookingForm.serviceId } : {}),
        bookingType: bookingForm.bookingType, city: bookingForm.city,
        scheduledAt: new Date(bookingForm.scheduledAt).toISOString(),
        durationMinutes: Number(bookingForm.durationMinutes),
        address: bookingForm.address, serviceDescription: service?.name || bookingForm.serviceDescription,
        note: bookingForm.note,
        ...(bookingForm.bookingType === "driver" ? {
          trip: { pickup: bookingForm.pickup, destination: bookingForm.destination, tripType: bookingForm.tripType }
        } : {})
      };
      await api("/bookings", { method: "POST", body: JSON.stringify(payload) });
      setBookingForm(p => ({ ...p, serviceId: "", serviceDescription: "", note: "", scheduledAt: futureDate() }));
    }, "Booking appointment confirmed.");
  }

  async function updateBooking(booking, status) {
    await runAction(`booking-${booking._id}`, async () => {
      await api(`/bookings/${booking._id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    }, `Booking updated to ${pretty(status)}.`);
  }

  async function submitReview(booking) {
    const draft = reviewDrafts[booking._id] || {};
    await runAction(`review-${booking._id}`, async () => {
      await api("/reviews", { method: "POST", body: JSON.stringify({ bookingId: booking._id, rating: Number(draft.rating || 5), comment: draft.comment || "" }) });
    }, "Review submitted successfully.");
  }

  // Define role-specific navigation menus
  const nav = useMemo(() => {
    if (isDriver) {
      return [
        ["overview", "Driver Overview", CircleUserRound],
        ["activity", "Ride Bookings & Trips", CarFront],
        ["requests", "Available Ride Requests", CalendarClock],
        ["worker", "Driver Licence & Profile", Upload],
        ["profile", "Personal Profile", UserRound]
      ];
    }
    if (isProvider) {
      return [
        ["overview", "Pro Overview", CircleUserRound],
        ["activity", "My Service Bookings", ClipboardList],
        ["requests", "Open Service Requests", CalendarClock],
        ["jobs", "Find Jobs", BriefcaseBusiness],
        ["applications", "My Applications", FileText],
        ["worker", "Skills & Availability", Wrench],
        ["profile", "Personal Profile", UserRound]
      ];
    }
    if (isEmployer) {
      return [
        ["overview", "Hiring Overview", CircleUserRound],
        ["business", "My Business", Building2],
        ["post-job", "Post a Job", Plus],
        ["applicants", "Review Applicants", ClipboardList],
        ["profile", "Personal Profile", UserRound]
      ];
    }
    // Default is Customer
    return [
      ["overview", "Customer Overview", CircleUserRound],
      ["activity", "My Bookings", CalendarClock],
      ["book", "Book a Service", Plus],
      ["post-request", "Request a Worker", FileText],
      ["profile", "Personal Profile", UserRound]
    ];
  }, [isDriver, isProvider, isEmployer]);

  const tabLabel = nav.find(n => n[0] === tab)?.[1] || "Dashboard";
  const currentUserCity = city || "Choose city";

  return (
    <div className="sev-dashboard">
      <header className="sev-dash-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="sev-button sev-button-outline"
            onClick={onBackHome}
            title="Return to Sevora Home"
            style={{ fontWeight: 800, borderColor: "#f4c5dc", color: "#c72e74" }}
          >
            <ArrowLeft size={16}/> Back to Home
          </button>
          <button className="sev-brand" onClick={onBackHome} type="button" title="Back to Sevora Home">
            <span className="sev-brand-symbol">s.</span>
            <span>sevora<span className="sev-brand-dot">.</span></span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="sev-dash-location" title="Switch your primary city">
            <MapPin size={16}/>
            <select aria-label="Current city" value={city} onChange={e => { setCity(e.target.value); setFilterCity(e.target.value); setProfile(p => ({ ...p, city: e.target.value })); localStorage.setItem("sevoraCity", e.target.value); }}>
              <option value="">Choose city</option>
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <span className="sev-tag" style={{ background: "#fff0f6", color: "#c72e74", fontWeight: 800, padding: "7px 14px", borderRadius: "20px", border: "1px solid #f8d7e6", fontSize: "11px" }}>
            {ROLE_LABELS[activeRole] || pretty(activeRole)} Workspace
          </span>
        </div>

        <div className="sev-dash-user">
          <span className="sev-avatar">{(user?.name || "S").slice(0,1).toUpperCase()}</span>
          <span>
            <strong>{user?.name || "User"}</strong>
            <small>{ROLE_LABELS[activeRole] || pretty(activeRole)}</small>
          </span>
          <button className="sev-icon-button" onClick={onLogout} title="Log out">
            <LogOut size={17}/>
          </button>
        </div>
      </header>

      <div className="sev-dash-layout">
        <aside className="sev-dash-sidebar">
          <button
            type="button"
            className="sev-dash-nav"
            onClick={onBackHome}
            style={{ color: "#ef438b", fontWeight: 800, marginBottom: "8px", background: "#fff5f9" }}
          >
            <ArrowLeft size={16}/> Back to Sevora Home
          </button>

          <p className="sev-eyebrow">{ROLE_LABELS[activeRole]?.toUpperCase()} WORKSPACE</p>
          {nav.map(([key, label, Icon]) => (
            <button
              type="button"
              key={key}
              className={`sev-dash-nav ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={17}/>{label}
            </button>
          ))}
          <div className="sev-sidebar-bottom">
            <ShieldCheck size={18}/>
            <span>
              <strong>Sevora Trust</strong>
              <small>Local appointments & verified community work.</small>
            </span>
          </div>
        </aside>

        <main className="sev-dash-main">
          <div className="sev-dash-title-row">
            <div>
              <p className="sev-eyebrow">{ROLE_LABELS[activeRole]?.toUpperCase()} PORTAL</p>
              <h1>{tab === "overview" ? `Welcome, ${user?.name?.split(" ")[0] || "there"}` : tabLabel}</h1>
              <p className="sev-muted">
                {tab === "overview"
                  ? isDriver
                    ? "Manage your driving appointments, license documents and trip requests."
                    : isProvider
                    ? "Manage your service appointments, customer requests, and job opportunities."
                    : isEmployer
                    ? "Post job vacancies, manage your business, and hire verified local talent."
                    : "Track your booked services, arrange home help, and view appointments."
                  : `Manage your ${tabLabel.toLowerCase()} in ${currentUserCity}.`}
              </p>
            </div>
            <button className="sev-button sev-button-outline" onClick={loadAll} disabled={loading}>
              <RefreshCw size={15}/> {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {error && <div className="sev-alert sev-alert-error">{error}</div>}
          {notice && <div className="sev-alert sev-alert-success"><CheckCircle2 size={17}/>{notice}</div>}

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <section className="sev-dash-section">
              <div className="sev-stat-grid">
                {isDriver ? (
                  <>
                    <article><span>Assigned Trips</span><strong>{bookings.length}</strong><small>Ride appointments</small></article>
                    <article><span>Open Requests</span><strong>{requests.length}</strong><small>Driver tasks in {filterCity}</small></article>
                    <article><span>Licence Status</span><strong style={{ fontSize: "18px" }}>{licenseInfo?.uploadedAt ? "Uploaded" : "Pending"}</strong><small>Verification record</small></article>
                    <article><span>Availability</span><strong style={{ fontSize: "18px" }}>{pretty(workerProfile.availability)}</strong><small>Driver status</small></article>
                  </>
                ) : isProvider ? (
                  <>
                    <article><span>Active Bookings</span><strong>{bookings.length}</strong><small>Customer appointments</small></article>
                    <article><span>Service Requests</span><strong>{requests.length}</strong><small>In {filterCity}</small></article>
                    <article><span>Applications</span><strong>{myApplications.length}</strong><small>Job applications</small></article>
                    <article><span>Availability</span><strong style={{ fontSize: "18px" }}>{pretty(workerProfile.availability)}</strong><small>Worker status</small></article>
                  </>
                ) : isEmployer ? (
                  <>
                    <article><span>Businesses</span><strong>{businesses.length}</strong><small>Registered businesses</small></article>
                    <article><span>Active Jobs</span><strong>{myJobs.length}</strong><small>Posted vacancies</small></article>
                    <article><span>Applicants</span><strong>{receivedApplications.length}</strong><small>Candidate submissions</small></article>
                    <article><span>City</span><strong style={{ fontSize: "20px" }}>{city}</strong><small>Hiring region</small></article>
                  </>
                ) : (
                  <>
                    <article><span>My Bookings</span><strong>{bookings.length}</strong><small>Service appointments</small></article>
                    <article><span>My Requests</span><strong>{myRequests.length}</strong><small>Custom requests</small></article>
                    <article><span>Available Services</span><strong>{services.length}</strong><small>Catalogue options</small></article>
                    <article><span>Area</span><strong style={{ fontSize: "20px" }}>{city}</strong><small>Current city</small></article>
                  </>
                )}
              </div>

              <div className="sev-dash-cards">
                {isCustomer && (
                  <>
                    <article className="sev-dash-card sev-dash-card-feature">
                      <span className="sev-card-icon"><CalendarClock size={20}/></span>
                      <h3>Your Booked Appointments</h3>
                      <p>View confirmed bookings, matched professionals, and their contact details.</p>
                      <button className="sev-button sev-button-primary" onClick={() => setTab("activity")}>
                        View My Bookings ({bookings.length})
                      </button>
                    </article>
                    <article className="sev-dash-card">
                      <span className="sev-card-icon lavender"><Plus size={20}/></span>
                      <h3>Book Home Service or Driver</h3>
                      <p>Choose household help, cleaning, cooking, plumbing, or a personal driver.</p>
                      <div className="sev-inline-actions">
                        <button className="sev-button sev-button-primary" onClick={() => setTab("book")}>Book Service</button>
                        <button className="sev-button sev-button-outline" onClick={onBackHome}>Explore Catalogue</button>
                      </div>
                    </article>
                  </>
                )}

                {isDriver && (
                  <>
                    <article className="sev-dash-card sev-dash-card-feature">
                      <span className="sev-card-icon"><CarFront size={20}/></span>
                      <h3>Driver Trips & Bookings</h3>
                      <p>View upcoming customer rides, update trip progress, and complete journeys.</p>
                      <button className="sev-button sev-button-primary" onClick={() => setTab("activity")}>
                        View Rides ({bookings.length})
                      </button>
                    </article>
                    <article className="sev-dash-card">
                      <span className="sev-card-icon lavender"><Upload size={20}/></span>
                      <h3>Driving Licence on File</h3>
                      {licenseInfo?.uploadedAt ? (
                        <>
                          <p style={{ color: "#047857", fontWeight: 700, margin: "6px 0" }}>✓ Licence Document Uploaded via Multer</p>
                          <small style={{ color: "#64748b", display: "block", marginBottom: "10px" }}>Uploaded on {new Date(licenseInfo.uploadedAt).toLocaleDateString()}</small>
                          <button className="sev-button sev-button-outline" onClick={() => setTab("worker")}>
                            View / Manage Licence
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ color: "#b45309", fontWeight: 700, margin: "6px 0" }}>⚠️ Action Required: Upload Licence</p>
                          <small style={{ color: "#78350f", display: "block", marginBottom: "10px" }}>Upload your licence to start accepting driver rides.</small>
                          <button className="sev-button sev-button-primary" onClick={() => setTab("worker")}>
                            Upload Licence Now
                          </button>
                        </>
                      )}
                    </article>
                  </>
                )}

                {isProvider && (
                  <>
                    <article className="sev-dash-card sev-dash-card-feature">
                      <span className="sev-card-icon"><ClipboardList size={20}/></span>
                      <h3>Service Appointments</h3>
                      <p>Accept new customer bookings, view addresses, and update job status.</p>
                      <button className="sev-button sev-button-primary" onClick={() => setTab("activity")}>
                        View Appointments ({bookings.length})
                      </button>
                    </article>
                    <article className="sev-dash-card">
                      <span className="sev-card-icon lavender"><BriefcaseBusiness size={20}/></span>
                      <h3>Find Local Jobs</h3>
                      <p>Browse job vacancies posted by local employers in {city}.</p>
                      <button className="sev-button sev-button-outline" onClick={() => setTab("jobs")}>
                        Browse Jobs ({jobs.length})
                      </button>
                    </article>
                  </>
                )}

                {isEmployer && (
                  <>
                    <article className="sev-dash-card sev-dash-card-feature">
                      <span className="sev-card-icon"><Plus size={20}/></span>
                      <h3>Post a New Vacancy</h3>
                      <p>Publish an open position for drivers, house help, or skilled workers.</p>
                      <button className="sev-button sev-button-primary" onClick={() => setTab("post-job")}>
                        Post a Job Now
                      </button>
                    </article>
                    <article className="sev-dash-card">
                      <span className="sev-card-icon lavender"><ClipboardList size={20}/></span>
                      <h3>Candidate Applicants</h3>
                      <p>Review applicants, contact details, and shortlist candidates.</p>
                      <button className="sev-button sev-button-outline" onClick={() => setTab("applicants")}>
                        View Applicants ({receivedApplications.length})
                      </button>
                    </article>
                  </>
                )}
              </div>
            </section>
          )}

          {/* BOOKINGS & ACTIVITY TAB */}
          {tab === "activity" && (
            <section className="sev-panel">
              <div className="sev-panel-head">
                <div>
                  <h2>{isDriver ? "Assigned Rides & Bookings" : isProvider ? "Assigned Service Bookings" : "My Bookings"}</h2>
                  <p className="sev-muted">Real-time appointments saved in the Sevora database.</p>
                </div>
                {isCustomer && (
                  <button className="sev-button sev-button-primary" onClick={() => setTab("book")}>
                    <Plus size={15}/> Book New Service
                  </button>
                )}
              </div>

              <div className="sev-list">
                {bookings.map((b) => {
                  const providerName = b.provider?.user?.name || "Matched Professional";
                  const providerPhone = b.providerPhone || b.provider?.user?.phone || "";
                  const customerName = b.customer?.name || "Customer";
                  const customerPhone = b.customerPhone || b.customer?.phone || "";

                  return (
                    <article className="sev-item-card" key={b._id}>
                      <div className="sev-item-top">
                        <span className={`sev-tag status-${b.status}`}>
                          {pretty(b.status)}
                        </span>
                        <small>{new Date(b.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
                      </div>

                      <h3>{b.service?.name || b.serviceDescription || pretty(b.bookingType)}</h3>
                      
                      {b.bookingType === "driver" && b.trip ? (
                        <p><strong>Pickup:</strong> {b.trip.pickup} → <strong>Destination:</strong> {b.trip.destination} ({pretty(b.trip.tripType)})</p>
                      ) : (
                        <p><strong>Address:</strong> {b.address || b.city || "Service location"}</p>
                      )}

                      <div className="sev-item-meta">
                        {isWorker ? (
                          <>
                            <span><UserRound size={14}/> Customer: {customerName}</span>
                            {customerPhone && (
                              <span><Phone size={14}/> <a href={`tel:${customerPhone}`}>{customerPhone}</a></span>
                            )}
                          </>
                        ) : (
                          <>
                            <span><UserRound size={14}/> Professional: {providerName}</span>
                            {providerPhone && (
                              <span><Phone size={14}/> <a href={`tel:${providerPhone}`}>{providerPhone}</a></span>
                            )}
                          </>
                        )}
                        {b.quotedPrice != null && <strong>₹{Number(b.quotedPrice).toLocaleString("en-IN")}</strong>}
                        <span>ID: {b._id.slice(-6)}</span>
                      </div>

                      {/* WORKER WORKFLOW CONTROLS */}
                      {isWorker && b.status === "pending" && (
                        <div className="sev-inline-actions">
                          <button className="sev-button sev-button-primary" onClick={() => updateBooking(b, "accepted")}>Accept Booking</button>
                          <button className="sev-button sev-button-outline" onClick={() => updateBooking(b, "rejected")}>Decline</button>
                        </div>
                      )}
                      {isWorker && b.status === "accepted" && (
                        <div className="sev-inline-actions">
                          {b.bookingType === "driver" ? (
                            <button className="sev-button sev-button-primary" onClick={() => updateBooking(b, "driver_arrived")}>Driver Arrived</button>
                          ) : (
                            <button className="sev-button sev-button-primary" onClick={() => updateBooking(b, "in_progress")}>Start Service</button>
                          )}
                        </div>
                      )}
                      {isWorker && b.status === "driver_arrived" && (
                        <button className="sev-button sev-button-primary" onClick={() => updateBooking(b, "trip_started")}>Start Trip</button>
                      )}
                      {isWorker && ["in_progress", "trip_started"].includes(b.status) && (
                        <button className="sev-button sev-button-primary" onClick={() => updateBooking(b, "completed")}>Mark Completed</button>
                      )}

                      {/* CUSTOMER CONTROLS */}
                      {!isWorker && ["pending", "accepted"].includes(b.status) && (
                        <button className="sev-button sev-button-outline" onClick={() => updateBooking(b, "cancelled")}>
                          Cancel Booking
                        </button>
                      )}

                      {/* STAR REVIEW SYSTEM */}
                      {b.status === "completed" && isCustomer && (
                        <div className="sev-review-form">
                          <label>
                            Rating
                            <select value={reviewDrafts[b._id]?.rating || "5"} onChange={e => setReviewDrafts(p => ({ ...p, [b._id]: { ...p[b._id], rating: e.target.value } }))}>
                              <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                              <option value="4">⭐⭐⭐⭐ (4 stars)</option>
                              <option value="3">⭐⭐⭐ (3 stars)</option>
                              <option value="2">⭐⭐ (2 stars)</option>
                              <option value="1">⭐ (1 star)</option>
                            </select>
                          </label>
                          <input
                            placeholder="Write a review for this professional (optional)"
                            value={reviewDrafts[b._id]?.comment || ""}
                            onChange={e => setReviewDrafts(p => ({ ...p, [b._id]: { ...p[b._id], comment: e.target.value } }))}
                          />
                          <button className="sev-button sev-button-primary" onClick={() => submitReview(b)}>
                            <Star size={14}/> Submit Review
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}

                {!bookings.length && (
                  <Empty message={isWorker ? "No bookings assigned to you yet." : "You have no bookings yet. Book a service to get started!"}/>
                )}
              </div>
            </section>
          )}

          {/* BOOK A SERVICE TAB */}
          {tab === "book" && (
            <section className="sev-panel">
              <h2>Book a Service</h2>
              <p className="sev-muted">Choose your service type and city. Sevora matches an available provider in that area.</p>
              <form className="sev-form-grid" onSubmit={createBooking}>
                <label>
                  Service type
                  <select value={bookingForm.bookingType} onChange={e => setBookingForm(p => ({ ...p, bookingType: e.target.value, serviceId: "" }))}>
                    <option value="home_service">Home service (plumbing, cleaning, cook, etc.)</option>
                    <option value="driver">Personal Driver (drives your car)</option>
                  </select>
                </label>
                <label>
                  City
                  <select value={bookingForm.city} onChange={e => setBookingForm(p => ({ ...p, city: e.target.value }))}>
                    {cities.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </label>
                <label>
                  Catalogue service
                  <select value={bookingForm.serviceId} onChange={e => setBookingForm(p => ({ ...p, serviceId: e.target.value }))}>
                    <option value="">Choose a service…</option>
                    {services.filter(s => s.providerType === bookingForm.bookingType).map(s => (
                      <option key={s._id} value={s._id}>{s.name} · {money(s.basePrice)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Appointment Date & Time
                  <input type="datetime-local" min={futureDate()} required value={bookingForm.scheduledAt} onChange={e => setBookingForm(p => ({ ...p, scheduledAt: e.target.value }))}/>
                </label>
                <label>
                  Duration (minutes)
                  <input type="number" min="15" max="1440" step="15" required value={bookingForm.durationMinutes} onChange={e => setBookingForm(p => ({ ...p, durationMinutes: e.target.value }))}/>
                </label>

                {bookingForm.bookingType === "home_service" ? (
                  <label className="wide">
                    Service Address
                    <input required value={bookingForm.address} onChange={e => setBookingForm(p => ({ ...p, address: e.target.value }))} placeholder="House/Flat number, Street, Locality"/>
                  </label>
                ) : (
                  <>
                    <label>Pickup Location<input required value={bookingForm.pickup} onChange={e => setBookingForm(p => ({ ...p, pickup: e.target.value }))} placeholder="Pickup address"/></label>
                    <label>Destination<input required value={bookingForm.destination} onChange={e => setBookingForm(p => ({ ...p, destination: e.target.value }))} placeholder="Drop-off destination"/></label>
                    <label>Trip Type
                      <select value={bookingForm.tripType} onChange={e => setBookingForm(p => ({ ...p, tripType: e.target.value }))}>
                        <option value="one_way">One way</option>
                        <option value="round_trip">Round trip</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </label>
                  </>
                )}

                <label className="wide">
                  Special Notes
                  <textarea rows="3" value={bookingForm.note} onChange={e => setBookingForm(p => ({ ...p, note: e.target.value }))} placeholder="Any specific requirements or instructions…"/>
                </label>
                
                <div className="wide">
                  <button className="sev-button sev-button-primary" disabled={busy === "booking"}>
                    <CalendarClock size={15}/> Confirm Appointment
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* PERSONAL PROFILE TAB */}
          {tab === "profile" && (
            <section className="sev-panel">
              <h2>Personal Details & Settings</h2>
              <p className="sev-muted">Update your contact details and default location.</p>
              <form className="sev-form-grid" onSubmit={saveProfile}>
                <label>Full name<input required value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}/></label>
                <label>Email address<input disabled value={user?.email || ""} style={{ background: "#f8f5f7" }}/></label>
                <label>Phone number<input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit number"/></label>
                <label>City<select value={profile.city || city} onChange={e => { setProfile(p => ({ ...p, city: e.target.value })); setCity(e.target.value); setFilterCity(e.target.value); }}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
                <label className="wide">Saved Address<textarea rows="3" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Complete address for service visits"/></label>
                <div className="wide">
                  <button className="sev-button sev-button-primary" disabled={busy === "profile"}>
                    <Save size={15}/> Save Details
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* WORKER / DRIVER PROFILE TAB */}
          {tab === "worker" && (
            <section className="sev-panel">
              <h2>{isDriver ? "Driver Profile & Licence" : "Professional Trade Profile"}</h2>
              <p className="sev-muted">
                {isDriver
                  ? "Upload your driving licence file and vehicle skills for assignment."
                  : "Add your trade skills, service categories and local service areas."}
              </p>
              <form className="sev-form-grid" onSubmit={saveWorkerProfile}>
                <label>Skills (comma separated)<input value={workerProfile.skills} onChange={e => setWorkerProfile(p => ({ ...p, skills: e.target.value }))} placeholder={isDriver ? "Manual, Automatic, City driving" : "Pipe repair, wiring, deep clean"}/></label>
                <label>Service categories<input value={workerProfile.serviceCategories} onChange={e => setWorkerProfile(p => ({ ...p, serviceCategories: e.target.value }))}/></label>
                <label className="wide">Service areas (comma separated)<input value={workerProfile.serviceAreas} onChange={e => setWorkerProfile(p => ({ ...p, serviceAreas: e.target.value }))} placeholder="Rajpura, Patiala, Chandigarh"/></label>
                <label>Starting price (₹)<input type="number" min="0" value={workerProfile.basePrice} onChange={e => setWorkerProfile(p => ({ ...p, basePrice: e.target.value }))}/></label>
                <label>Availability status
                  <select value={workerProfile.availability} onChange={e => setWorkerProfile(p => ({ ...p, availability: e.target.value }))}>
                    <option value="available">Available for bookings</option>
                    <option value="busy">Busy right now</option>
                    <option value="unavailable">Unavailable / Offline</option>
                  </select>
                </label>
                <div className="wide">
                  <button className="sev-button sev-button-primary" disabled={busy === "worker"}>
                    <Save size={15}/> Save Profile
                  </button>
                </div>
              </form>

              {isDriver && (
                <div className="sev-license-box" style={{ marginTop: "24px", display: "block" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <h3>Driving Licence Document</h3>
                    <p className="sev-muted">Saved securely on the backend server using Multer.</p>
                    {licenseInfo?.uploadedAt ? (
                      <div style={{ marginTop: "12px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <p className="sev-license-status" style={{ color: "#047857", fontWeight: 700, margin: "0 0 8px" }}>
                          <CheckCircle2 size={16}/> Driving licence is uploaded and active
                        </p>
                        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
                          File: <strong>{licenseInfo.originalName || "driver_licence"}</strong> · Uploaded: {new Date(licenseInfo.uploadedAt).toLocaleDateString()}
                        </p>
                        {licensePreviewUrl && (
                          <div style={{ textAlign: "center", margin: "14px 0", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Licence Preview:</p>
                            <img
                              src={licensePreviewUrl}
                              alt="Licence Preview"
                              style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "6px", objectFit: "contain" }}
                            />
                            <div style={{ marginTop: "10px" }}>
                              <a
                                href={licensePreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sev-button sev-button-outline"
                                style={{ textDecoration: "none" }}
                              >
                                Open Full Document
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: "#b45309", background: "#fffbeb", padding: "10px 14px", borderRadius: "8px", border: "1px solid #fef3c7", fontSize: "13px", marginTop: "10px" }}>
                        ⚠️ You haven't uploaded your driving licence yet. Please select and upload your licence below.
                      </p>
                    )}
                  </div>
                  <form onSubmit={uploadLicense} style={{ marginTop: "12px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                      {licenseInfo ? "Replace / upload new licence file:" : "Choose licence file (PDF, JPG, PNG up to 5 MB):"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      <label className="sev-file-label" style={{ flex: "1 1 240px", margin: 0 }}>
                        <Upload size={17}/>
                        <span>{license?.name || (licenseInfo ? "Choose new file to replace" : "Select licence file")}</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf" onChange={e => setLicense(e.target.files?.[0] || null)}/>
                      </label>
                      <button className="sev-button sev-button-primary" disabled={busy === "license" || !license}>
                        <Upload size={15}/> {busy === "license" ? "Uploading…" : licenseInfo ? "Update Licence" : "Upload Licence"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* REQUESTS TAB */}
          {tab === "requests" && (
            <section className="sev-panel">
              <h2>Open Service Requests in {filterCity}</h2>
              <p className="sev-muted">Browse custom requests posted by local customers.</p>
              <div className="sev-filter-row">
                <label><MapPin size={16}/><select value={filterCity} onChange={e => setFilterCity(e.target.value)}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
                <button className="sev-button sev-button-outline" onClick={loadAll}>Refresh Requests</button>
              </div>
              <div className="sev-list">
                {requests.filter(r => r.locality?.toLowerCase() === filterCity.toLowerCase()).map(r => (
                  <article className="sev-item-card" key={r._id}>
                    <div className="sev-item-top">
                      <span className="sev-tag">{pretty(r.requestType)} · {r.category}</span>
                      <small>{new Date(r.scheduledAt).toLocaleString()}</small>
                    </div>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <div className="sev-item-meta">
                      <span><MapPin size={14}/>{r.locality}</span>
                      <strong>{money(r.estimatedPrice)}</strong>
                    </div>
                    <button className="sev-button sev-button-primary" disabled={busy === `accept-${r._id}`} onClick={() => acceptRequest(r)}>
                      Accept Request
                    </button>
                  </article>
                ))}
                {!requests.filter(r => r.locality?.toLowerCase() === filterCity.toLowerCase()).length && (
                  <Empty message="No open service requests in this area currently."/>
                )}
              </div>
            </section>
          )}

          {/* POST REQUEST TAB */}
          {tab === "post-request" && (
            <section className="sev-panel">
              <h2>Post a Custom Task Request</h2>
              <p className="sev-muted">Describe what you need so matching verified local professionals can respond.</p>
              <form className="sev-form-grid" onSubmit={createRequest}>
                <label>
                  Request type
                  <select value={requestForm.requestType} onChange={e => setRequestForm(p => ({ ...p, requestType: e.target.value, category: e.target.value === "driver" ? "Driver" : "Plumbing" }))}>
                    <option value="home_service">Home service</option>
                    <option value="driver">Driver for my car</option>
                  </select>
                </label>
                <label>Category<select value={requestForm.category} onChange={e => setRequestForm(p => ({ ...p, category: e.target.value }))}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
                <label>Title<input required value={requestForm.title} onChange={e => setRequestForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Deep cleaning before Diwali"/></label>
                <label>City/locality<select value={requestForm.locality} onChange={e => setRequestForm(p => ({ ...p, locality: e.target.value }))}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
                <label>Schedule<input required type="datetime-local" min={futureDate()} value={requestForm.scheduledAt} onChange={e => setRequestForm(p => ({ ...p, scheduledAt: e.target.value }))}/></label>
                <label>Estimated budget (₹)<input type="number" min="0" value={requestForm.estimatedPrice} onChange={e => setRequestForm(p => ({ ...p, estimatedPrice: e.target.value }))}/></label>
                {requestForm.requestType === "home_service" ? (
                  <label className="wide">Address<input required value={requestForm.address} onChange={e => setRequestForm(p => ({ ...p, address: e.target.value }))} placeholder="Service address"/></label>
                ) : (
                  <>
                    <label>Pickup<input required value={requestForm.pickup} onChange={e => setRequestForm(p => ({ ...p, pickup: e.target.value }))}/></label>
                    <label>Destination<input required value={requestForm.destination} onChange={e => setRequestForm(p => ({ ...p, destination: e.target.value }))}/></label>
                    <label>Trip type<select value={requestForm.tripType} onChange={e => setRequestForm(p => ({ ...p, tripType: e.target.value }))}><option value="one_way">One way</option><option value="round_trip">Round trip</option><option value="hourly">Hourly</option></select></label>
                    <label>Vehicle transmission<select value={requestForm.vehicleTransmission} onChange={e => setRequestForm(p => ({ ...p, vehicleTransmission: e.target.value }))}><option value="manual">Manual</option><option value="automatic">Automatic</option></select></label>
                  </>
                )}
                <label className="wide">Details<textarea required rows="4" value={requestForm.description} onChange={e => setRequestForm(p => ({ ...p, description: e.target.value }))}/></label>
                <div className="wide"><button className="sev-button sev-button-primary" disabled={busy === "request"}><Plus size={15}/> Publish Request</button></div>
              </form>
            </section>
          )}

          {/* JOBS TAB (FOR WORKERS) */}
          {tab === "jobs" && (
            <section className="sev-panel">
              <div className="sev-panel-head">
                <div><h2>Local Job Opportunities</h2><p className="sev-muted">Search vacancies and apply directly.</p></div>
              </div>
              <div className="sev-filter-row">
                <label><Search size={16}/><input placeholder="Search title, trade or employer" value={search} onChange={e => setSearch(e.target.value)}/></label>
                <select value={filterCity} onChange={e => setFilterCity(e.target.value)}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
                <button className="sev-button sev-button-outline" onClick={loadAll}>Search</button>
              </div>
              <div className="sev-list">
                {visibleJobs.map(job => (
                  <article className="sev-item-card" key={job._id}>
                    <div className="sev-item-top"><span className="sev-tag">{pretty(job.employmentType)}</span><small>{job.locality}</small></div>
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <div className="sev-item-meta">
                      <span><Building2 size={14}/>{job.business?.name || "Employer"}</span>
                      <span><MapPin size={14}/>{job.locality}</span>
                      <strong>{money(job.salaryMin)}{job.salaryMax ? ` – ${money(job.salaryMax)}` : ""}</strong>
                    </div>
                    <textarea placeholder="Brief note / cover letter (optional)" rows="2" value={coverLetters[job._id] || ""} onChange={e => setCoverLetters(p => ({ ...p, [job._id]: e.target.value }))}/>
                    <button className="sev-button sev-button-primary" disabled={busy === `apply-${job._id}`} onClick={() => applyToJob(job)}>Apply Now</button>
                  </article>
                ))}
                {!visibleJobs.length && <Empty message="No open jobs found in this city yet."/>}
              </div>
            </section>
          )}

          {/* MY APPLICATIONS TAB */}
          {tab === "applications" && (
            <section className="sev-panel">
              <h2>My Job Applications</h2>
              <div className="sev-list">
                {myApplications.map(a => (
                  <article className="sev-item-card" key={a._id}>
                    <div className="sev-item-top"><span className="sev-tag">{pretty(a.status)}</span><small>{new Date(a.createdAt).toLocaleDateString()}</small></div>
                    <h3>{a.job?.title || "Job Opportunity"}</h3>
                    <p>{a.job?.business?.name || "Employer"} · {a.job?.locality || ""}</p>
                    <p>{a.coverLetter || "No note attached."}</p>
                    {["submitted", "shortlisted"].includes(a.status) && (
                      <button className="sev-button sev-button-outline" onClick={() => runAction(`withdraw-${a._id}`, () => api(`/applications/${a._id}/withdraw`, { method: "PATCH", body: JSON.stringify({}) }), "Application withdrawn.")}>
                        Withdraw Application
                      </button>
                    )}
                  </article>
                ))}
                {!myApplications.length && <Empty message="You haven't submitted any job applications yet."/>}
              </div>
            </section>
          )}

          {/* EMPLOYER BUSINESS TAB */}
          {tab === "business" && (
            <section className="sev-panel">
              <h2>Your Business Profile</h2>
              <p className="sev-muted">Jobs must be published under a registered business entity.</p>
              <div className="sev-list">
                {businesses.map(b => (
                  <article className="sev-item-card" key={b._id}>
                    <h3>{b.name}</h3>
                    <p>{b.category} · {b.locality}</p>
                    <small>{b.address}</small>
                  </article>
                ))}
              </div>
              <h3 className="sev-form-heading">Add a Business</h3>
              <form className="sev-form-grid" onSubmit={createBusiness}>
                <label>Business name<input required value={businessForm.name} onChange={e => setBusinessForm(p => ({ ...p, name: e.target.value }))}/></label>
                <label>Category<input required value={businessForm.category} onChange={e => setBusinessForm(p => ({ ...p, category: e.target.value }))}/></label>
                <label>City/locality<select value={businessForm.locality} onChange={e => setBusinessForm(p => ({ ...p, locality: e.target.value }))}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
                <label>Address<input required value={businessForm.address} onChange={e => setBusinessForm(p => ({ ...p, address: e.target.value }))}/></label>
                <label className="wide">Description<textarea value={businessForm.description} onChange={e => setBusinessForm(p => ({ ...p, description: e.target.value }))}/></label>
                <div className="wide"><button className="sev-button sev-button-primary" disabled={busy === "business"}><Plus size={15}/> Save Business</button></div>
              </form>
            </section>
          )}

          {/* POST JOB TAB */}
          {tab === "post-job" && (
            <section className="sev-panel">
              <h2>Post a New Job</h2>
              <p className="sev-muted">Select your business and publish an open vacancy.</p>
              {!businesses.length && <div className="sev-alert">Add your business first in the "My Business" tab.</div>}
              <form className="sev-form-grid" onSubmit={postJob}>
                <label>Business<select required value={jobForm.business} onChange={e => setJobForm(p => ({ ...p, business: e.target.value }))}><option value="">Choose business</option>{businesses.map(b => <option value={b._id} key={b._id}>{b.name} — {b.locality}</option>)}</select></label>
                <label>Job title<input required value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}/></label>
                <label>Category<select value={jobForm.category} onChange={e => setJobForm(p => ({ ...p, category: e.target.value }))}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
                <label>Employment type<select value={jobForm.employmentType} onChange={e => setJobForm(p => ({ ...p, employmentType: e.target.value }))}>{employmentTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label>City/locality<select value={jobForm.locality} onChange={e => setJobForm(p => ({ ...p, locality: e.target.value }))}>{cities.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
                <label>Min salary (₹)<input type="number" min="0" value={jobForm.salaryMin} onChange={e => setJobForm(p => ({ ...p, salaryMin: e.target.value }))}/></label>
                <label>Max salary (₹)<input type="number" min="0" value={jobForm.salaryMax} onChange={e => setJobForm(p => ({ ...p, salaryMax: e.target.value }))}/></label>
                <label className="wide">Job description<textarea required rows="4" value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}/></label>
                <div className="wide"><button className="sev-button sev-button-primary" disabled={busy === "post-job"}><Plus size={15}/> Publish Job</button></div>
              </form>
            </section>
          )}

          {/* APPLICANTS TAB */}
          {tab === "applicants" && (
            <section className="sev-panel">
              <h2>Applicants for Your Jobs</h2>
              <div className="sev-list">
                {receivedApplications.map(a => (
                  <article className="sev-item-card" key={a._id}>
                    <div className="sev-item-top"><span className="sev-tag">{pretty(a.status)}</span><small>{a.applicant?.city || "Area not provided"}</small></div>
                    <h3>{a.applicant?.name || "Candidate"}</h3>
                    <p>{a.job?.title} · {a.job?.locality}</p>
                    <p>{a.coverLetter || "No note attached."}</p>
                    <div className="sev-inline-actions">
                      {["shortlisted", "selected", "rejected"].map(s => (
                        <button key={s} className="sev-button sev-button-outline" disabled={busy === `application-${a._id}`} onClick={() => updateApplication(a._id, s)}>
                          {pretty(s)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
                {!receivedApplications.length && <Empty message="No candidate applications received yet."/>}
              </div>

              <h3 className="sev-form-heading">Your Active Job Listings</h3>
              <div className="sev-list">
                {myJobs.map(j => (
                  <article className="sev-item-card" key={j._id}>
                    <div className="sev-item-top"><span className="sev-tag">{pretty(j.status)}</span><small>{j.locality}</small></div>
                    <h3>{j.title}</h3>
                    <p>{j.description}</p>
                    {j.status === "open" && (
                      <button className="sev-button sev-button-outline" onClick={() => runAction(`close-${j._id}`, () => api(`/jobs/${j._id}/close`, { method: "PATCH", body: JSON.stringify({}) }), "Job vacancy closed.")}>
                        Close Job Listing
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Empty({ message }) {
  return (
    <div className="sev-empty">
      <span><Search size={20}/></span>
      <p>{message}</p>
    </div>
  );
}
