import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, UserRound, Phone, MapPin, Mail, LockKeyhole,
  CheckCircle2, ShieldCheck, CarFront, Wrench, Building2,
  CalendarDays, BriefcaseBusiness, LogOut, ChevronRight,
  Eye, EyeOff, Save, Sparkles, LayoutDashboard, Upload, FileText, AlertCircle, ExternalLink
} from 'lucide-react';
import { cities } from './data';
import './role-dashboard.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const ROLE_INFO = {
  customer: {
    label: 'Customer',
    tagline: 'Book home services & drivers',
    icon: Sparkles,
    color: '#ef438b',
    bg: '#fff0f6'
  },
  driver: {
    label: 'Driver',
    tagline: 'Drive personal cars & accept trip bookings',
    icon: CarFront,
    color: '#0d9488',
    bg: '#f0fdfa'
  },
  provider: {
    label: 'Service Professional',
    tagline: 'Offer trade skills (cleaning, cooking, repair)',
    icon: Wrench,
    color: '#8b5cf6',
    bg: '#f5f3ff'
  },
  employer: {
    label: 'Employer / Recruiter',
    tagline: 'Post jobs & hire verified professionals',
    icon: Building2,
    color: '#ea580c',
    bg: '#fff7ed'
  }
};

export default function ProfilePage({ user, onBackHome, onOpenDashboard, onUserUpdated, onLogout }) {
  const token = localStorage.getItem('sevoraToken');
  const roles = user?.roles || ['customer'];
  const activeRole = roles[0] || 'customer';
  const isDriver = roles.includes('driver');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || localStorage.getItem('sevoraCity') || 'Rajpura');
  const [address, setAddress] = useState(user?.address || '');

  // Driver licence state
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseNotice, setLicenseNotice] = useState('');
  const [licenseError, setLicenseError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const loadDriverLicense = useCallback(async () => {
    if (!isDriver || !token) return;
    try {
      const res = await fetch(`${API_BASE}/providers/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const lic = data.profile?.driverLicense;
      if (lic && lic.status === 'uploaded') {
        setLicenseInfo(lic);

        // Fetch licence file to display preview
        try {
          const fileRes = await fetch(`${API_BASE}/providers/me/driver-license`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const objectUrl = URL.createObjectURL(blob);
            setLicensePreviewUrl(objectUrl);
          }
        } catch (e) {
          console.error("Could not load licence preview:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch driver profile:", err);
    }
  }, [isDriver, token]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCity(user.city || localStorage.getItem('sevoraCity') || 'Rajpura');
      setAddress(user.address || '');
    }
    if (isDriver) {
      loadDriverLicense();
    }
  }, [user, isDriver, loadDriverLicense]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileNotice('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    setProfileSaving(true);
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim()
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      const updated = data.user || data;
      const nextUser = { ...user, ...updated };
      localStorage.setItem('sevoraUser', JSON.stringify(nextUser));
      if (updated.city) localStorage.setItem('sevoraCity', updated.city);
      onUserUpdated?.(nextUser);
      setProfileNotice('Personal details saved successfully.');
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUploadLicense = async (e) => {
    e.preventDefault();
    setLicenseNotice('');
    setLicenseError('');

    if (!licenseFile) {
      setLicenseError('Please select a licence file first (PDF, JPG or PNG).');
      return;
    }

    setLicenseLoading(true);
    try {
      const formData = new FormData();
      formData.append('license', licenseFile);

      const response = await fetch(`${API_BASE}/providers/me/driver-license`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload driving licence.');
      }

      setLicenseNotice('Driving licence uploaded successfully.');
      setLicenseFile(null);
      await loadDriverLicense();
    } catch (err) {
      setLicenseError(err.message || 'Failed to upload driving licence.');
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordNotice('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Failed to change password.');

      setPasswordNotice('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const activeRoleMeta = ROLE_INFO[activeRole] || ROLE_INFO.customer;
  const RoleIcon = activeRoleMeta.icon;

  return (
    <div className="sev-dashboard">
      <header className="sev-dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="sev-button sev-button-outline"
            onClick={onBackHome}
            title="Return to Sevora Landing Page"
            style={{ fontWeight: 800, borderColor: '#f4c5dc', color: '#c72e74' }}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <button
            type="button"
            className="sev-brand"
            onClick={onBackHome}
            style={{ textDecoration: 'none' }}
          >
            <span className="sev-brand-symbol">s.</span>
            <span>sevora<span className="sev-brand-dot">.</span></span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="sev-button sev-button-primary"
            onClick={onOpenDashboard}
          >
            <LayoutDashboard size={15} /> Open {activeRoleMeta.label} Dashboard
          </button>

          <button
            type="button"
            className="sev-button sev-button-outline"
            onClick={onLogout}
            title="Log out"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        <div className="sev-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #fff0f6 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: activeRoleMeta.color,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '26px',
                  fontWeight: 900
                }}
              >
                {(user?.name || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <span className="sev-tag" style={{ background: activeRoleMeta.bg, color: activeRoleMeta.color, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <RoleIcon size={13} />
                  Registered Role: {activeRoleMeta.label}
                </span>
                <h1 style={{ margin: '6px 0 2px', fontSize: '26px', fontWeight: 850 }}>{user?.name || 'User'}</h1>
                <p style={{ margin: 0, color: '#887584', fontSize: '13px' }}>
                  {user?.email} · {city}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="sev-button sev-button-primary"
              onClick={onOpenDashboard}
            >
              Go to Workspace <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* DRIVER LICENCE SECTION - SHOWN SPECIFICALLY FOR DRIVER PROFILE */}
        {isDriver && (
          <section className="sev-panel" style={{ marginBottom: '24px' }}>
            <div className="sev-panel-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CarFront size={22} color="#0d9488" /> Driver Licence Document
                </h2>
                <p className="sev-muted">
                  Your official driving licence on file. This document is saved using Multer and attached to your driver profile.
                </p>
              </div>
              {licenseInfo && (
                <span className="sev-tag" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> Licence Uploaded
                </span>
              )}
            </div>

            {licenseNotice && (
              <div className="sev-alert sev-alert-success" style={{ margin: '14px 0' }}>
                <CheckCircle2 size={16} /> {licenseNotice}
              </div>
            )}
            {licenseError && (
              <div className="sev-alert sev-alert-error" style={{ margin: '14px 0' }}>
                <AlertCircle size={16} /> {licenseError}
              </div>
            )}

            {/* If NO licence uploaded yet, ask for licence prominently */}
            {!licenseInfo ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '14px', padding: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AlertCircle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px', color: '#92400e', fontSize: '16px' }}>Action Required: Upload Your Driving Licence</h3>
                    <p style={{ margin: '0 0 14px', color: '#78350f', fontSize: '13px', lineHeight: 1.6 }}>
                      To accept rides and trips on Sevora, please upload a clear scan or photo of your driving licence (PDF, JPG, or PNG up to 5 MB).
                    </p>
                    <form onSubmit={handleUploadLicense} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <label className="sev-file-label" style={{ flex: '1 1 240px', margin: 0 }}>
                        <Upload size={16} />
                        <span>{licenseFile ? licenseFile.name : 'Select Licence File (PDF, JPG, PNG)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                          onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <button
                        type="submit"
                        className="sev-button sev-button-primary"
                        disabled={licenseLoading || !licenseFile}
                      >
                        <Upload size={15} /> {licenseLoading ? 'Uploading…' : 'Upload Licence Now'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              /* If licence IS uploaded, SHOW THE LICENCE! */
              <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', display: 'grid', placeItems: 'center' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>
                        {licenseInfo.originalName || 'Driver_Licence_Document'}
                      </strong>
                      <small style={{ color: '#64748b', fontSize: '12px' }}>
                        Uploaded on {new Date(licenseInfo.uploadedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        {licenseInfo.size ? ` · ${(licenseInfo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </small>
                    </div>
                  </div>

                  {licensePreviewUrl && (
                    <a
                      href={licensePreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sev-button sev-button-outline"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} /> View Full Document
                    </a>
                  )}
                </div>

                {/* IMAGE PREVIEW IF JPG/PNG */}
                {licensePreviewUrl && (licenseInfo.mimeType?.startsWith('image/') || licenseInfo.originalName?.match(/\.(jpg|jpeg|png)$/i)) && (
                  <div style={{ marginTop: '14px', textAlign: 'center', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Licence Preview:</p>
                    <img
                      src={licensePreviewUrl}
                      alt="Driver Licence Preview"
                      style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                  </div>
                )}

                {/* PDF PREVIEW CARD */}
                {licenseInfo.mimeType === 'application/pdf' && (
                  <div style={{ marginTop: '12px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>PDF</span>
                      <span style={{ fontSize: '13px', color: '#334155' }}>PDF Document verified & securely saved</span>
                    </div>
                    {licensePreviewUrl && (
                      <a href={licensePreviewUrl} target="_blank" rel="noopener noreferrer" className="sev-button sev-button-primary" style={{ textDecoration: 'none' }}>
                        <ExternalLink size={14} /> Open PDF
                      </a>
                    )}
                  </div>
                )}

                {/* OPTION TO REPLACE LICENCE */}
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Replace with another file:</p>
                  <form onSubmit={handleUploadLicense} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <label className="sev-file-label" style={{ flex: '1 1 240px', margin: 0 }}>
                      <Upload size={16} />
                      <span>{licenseFile ? licenseFile.name : 'Choose new file to replace'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <button
                      type="submit"
                      className="sev-button sev-button-outline"
                      disabled={licenseLoading || !licenseFile}
                    >
                      <Upload size={14} /> {licenseLoading ? 'Uploading…' : 'Update Licence'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* PERSONAL DETAILS SECTION */}
        <section className="sev-panel" style={{ marginBottom: '24px' }}>
          <h2>Personal Information</h2>
          <p className="sev-muted">Update your contact details and default service area.</p>

          {profileNotice && (
            <div className="sev-alert sev-alert-success" style={{ margin: '14px 0' }}>
              <CheckCircle2 size={16} /> {profileNotice}
            </div>
          )}
          {profileError && (
            <div className="sev-alert sev-alert-error" style={{ margin: '14px 0' }}>
              {profileError}
            </div>
          )}

          <form className="sev-form-grid" onSubmit={handleSaveProfile}>
            <label>
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </label>

            <label>
              Email address
              <input disabled value={user?.email || ''} style={{ background: '#faf6f8', cursor: 'not-allowed' }} />
            </label>

            <label>
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </label>

            <label>
              Service City / Area
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </label>


            <label className="wide">
              Saved Address
              <textarea
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / flat number, street name, locality and landmark"
              />
            </label>

            <div className="wide" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                className="sev-button sev-button-primary"
                disabled={profileSaving}
              >
                <Save size={15} /> {profileSaving ? 'Saving…' : 'Save Details'}
              </button>
            </div>
          </form>
        </section>

        {/* PASSWORD SECTION */}
        <section className="sev-panel">
          <h2>Security & Password</h2>
          <p className="sev-muted">Change your Sevora login password.</p>

          {passwordNotice && (
            <div className="sev-alert sev-alert-success" style={{ margin: '14px 0' }}>
              <CheckCircle2 size={16} /> {passwordNotice}
            </div>
          )}
          {passwordError && (
            <div className="sev-alert sev-alert-error" style={{ margin: '14px 0' }}>
              {passwordError}
            </div>
          )}

          <form className="sev-form-grid" onSubmit={handleChangePassword}>
            <label className="wide">
              Current password
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            </label>

            <label>
              New password
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            <label>
              Confirm new password
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </label>

            <div className="wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="sev-button sev-button-outline"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>

              <button
                type="submit"
                className="sev-button sev-button-primary"
                disabled={passwordSaving}
              >
                <LockKeyhole size={15} /> {passwordSaving ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
