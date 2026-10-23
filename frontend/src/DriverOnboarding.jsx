
import { useCallback, useEffect, useState } from "react";
import { CarFront, FileUp, ShieldCheck, MapPin, LogOut, RefreshCw } from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function DriverOnboarding({ user, onLogout }) {
  const [city, setCity] = useState(user?.city || "Rajpura");
  const [vehicle, setVehicle] = useState("");
  const [license, setLicense] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("sevoraToken");

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/providers/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setProfile(null);
        return;
      }
      if (!response.ok) {
        throw new Error(data.message || "Could not load your driver profile.");
      }

      setProfile(data.profile);
      setCity(data.profile?.serviceAreas?.[0] || user?.city || "Rajpura");
      setVehicle(data.profile?.skills?.[0] || "");
    } catch (err) {
      setError(err.message || "Could not load your driver profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [token, user?.city]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function submitOnboarding(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!license && !profile?.driverLicense?.status) {
      setError("Please select your driving licence file.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const profileResponse = await fetch(`${API_BASE}/providers/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          providerType: "driver",
          skills: vehicle.trim() ? [vehicle.trim()] : [],
          serviceCategories: ["Driver"],
          serviceAreas: [city.trim()],
          availability: "unavailable"
        })
      });

      const profileData = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Could not save your driver profile.");
      }

      if (license) {
        const formData = new FormData();
        formData.append("license", license);

        const uploadResponse = await fetch(
          `${API_BASE}/providers/me/driver-license`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          }
        );

        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Licence upload failed.");
        }

        setMessage(uploadData.message || "Licence submitted for verification.");
        setLicense(null);
      } else {
        setMessage("Driver profile saved.");
      }

      await loadProfile();
      event.target.reset();
    } catch (err) {
      setError(err.message || "Could not complete driver onboarding.");
    } finally {
      setLoading(false);
    }
  }

  const licenseStatus = profile?.driverLicense?.status || "not_submitted";
  const verificationStatus = profile?.verificationStatus || "unverified";

  return (
    <main className="driver-page">
      <header className="driver-topbar">
        <a className="driver-brand" href="#driver-home">sevora<span>.</span></a>
        <button className="driver-logout" onClick={onLogout}>
          <LogOut size={17} /> Log out
        </button>
      </header>

      <section className="driver-content" id="driver-home">
        <div className="driver-welcome">
          <span className="driver-kicker"><CarFront size={17} /> DRIVER PARTNER</span>
          <h1>Welcome, {user?.name || "Driver"}.</h1>
          <p>Manage your profile and licence verification here. You do not need to log out to complete onboarding.</p>
        </div>

        <div className="driver-card">
          <div className="driver-card-heading">
            <div className="driver-icon"><ShieldCheck size={25} /></div>
            <div>
              <h2>Driver verification</h2>
              <p>Licence and profile status</p>
            </div>
            <button type="button" className="driver-refresh" onClick={loadProfile} disabled={loadingProfile}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loadingProfile ? (
            <p>Loading your saved profile…</p>
          ) : (
            <>
              <div className="driver-status-list">
                <p><strong>Profile review:</strong> {verificationStatus.replaceAll("_", " ")}</p>
                <p><strong>Driving licence:</strong> {licenseStatus.replaceAll("_", " ")}</p>
              </div>

              <form onSubmit={submitOnboarding} className="driver-form">
                <label>
                  Full name
                  <input value={user?.name || ""} readOnly />
                </label>

                <label>
                  Email address
                  <input value={user?.email || ""} readOnly />
                </label>

                <label>
                  City / operating area
                  <span className="driver-input-icon">
                    <MapPin size={17} />
                    <input value={city} onChange={(e) => setCity(e.target.value)} required maxLength={100} />
                  </span>
                </label>

                <label>
                  Vehicle details
                  <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} maxLength={100} placeholder="e.g. Hatchback, manual" />
                </label>

                {licenseStatus !== "verified" && (
                  <label className="driver-upload">
                    <span className="driver-upload-icon"><FileUp size={25} /></span>
                    <strong>{licenseStatus === "pending" ? "Replace licence document" : "Upload driving licence"}</strong>
                    <span>PDF, JPG or PNG · Maximum 5 MB</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) => setLicense(e.target.files?.[0] || null)}
                    />
                    {license && <span className="driver-file-name">Selected: {license.name}</span>}
                  </label>
                )}

                {error && <p className="driver-message driver-error" role="alert">{error}</p>}
                {message && <p className="driver-message driver-success" role="status">{message}</p>}

                <button type="submit" className="driver-submit" disabled={loading}>
                  {loading ? "Saving…" : license ? "Save profile and submit licence" : "Save driver profile"}
                </button>
                <p className="driver-privacy">
                  Uploading a licence does not automatically verify it. You remain unavailable for bookings until an authorised reviewer approves your profile.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
