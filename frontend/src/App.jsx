import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthModal from './AuthModal';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness,
  Check, ChevronDown, ChevronRight, Clock3, HeartHandshake, House, MapPin,
  Menu, Search, ShieldCheck, Sparkles, Star, Wrench, X, Zap, CookingPot,
  CarFront, CalendarDays, HandHeart, UsersRound, MessageCircle, CircleHelp,
  Leaf, Hammer, Building2, Navigation, CheckCircle2, Phone
} from 'lucide-react';
import { cities, fallbackServices, faqItems, servicePhotos } from './data';
import CityIllustration from "./CityIllustration";
import RoleDashboard from "./RoleDashboard";
import ReviewsCarousel from "./ReviewsCarousel";
import ProfilePage from "./ProfilePage";

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const categoryMeta = [
  { name: 'Household Help', label: 'House help', icon: HandHeart, color: 'rose' },
  { name: 'Cleaning', label: 'Cleaning', icon: Sparkles, color: 'peach' },
  { name: 'Cooking', label: 'Home cook', icon: CookingPot, color: 'lavender' },
  { name: 'Plumbing', label: 'Plumbing', icon: Wrench, color: 'blue' },
  { name: 'Electrical', label: 'Electrical', icon: Zap, color: 'yellow' },
  { name: 'Driver', label: 'Driver', icon: CarFront, color: 'mint' }
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function getServiceImage(service) {
  if (service?.imageUrl) return service.imageUrl;
  if (service?.imageKey && servicePhotos[service.imageKey]) return servicePhotos[service.imageKey];
  const description = [service?.name, service?.slug, service?.category, ...(service?.tags || [])].filter(Boolean).join(' ').toLowerCase();
  if (/driver|chauffeur|trip|car/.test(description)) return servicePhotos.driver;
  if (/cook|cooking|meal|kitchen/.test(description)) return servicePhotos.cook;
  if (/electric|appliance|ac service|air conditioner/.test(description)) return servicePhotos.electrical;
  if (/plumb|pipe|tap|leak/.test(description)) return servicePhotos.plumbing;
  if (/clean|deep clean|bathroom|laundry/.test(description)) return servicePhotos.cleaning;
  return servicePhotos.house;
}

function Brand({ light = false }) {
  return (
    <a href="#home" className={`brand-mark ${light ? 'brand-mark-light' : ''}`} aria-label="Sevora home">
      <span className="brand-symbol"><span /><span /><span /></span>
      <span>sevora<span className="brand-dot">.</span></span>
    </a>
  );
}

function SectionHeading({ eyebrow, title, accent, subtitle, align = 'center' }) {
  return (
    <div className={`section-heading ${align === 'left' ? 'text-left' : 'text-center'}`}>
      {eyebrow && <div className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</div>}
      <h2>{title} {accent && <span>{accent}</span>}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Header({ onLocationClick, selectedCity, onAuthClick, currentUser, onLogout, onBookingsClick, onDashboardClick, onProfileClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = [
    ['Services', '#services'], ['Service areas', '#cities'], ['How it works', '#how-it-works'], ['Find work', '#work']
  ];
  return (
    <header className="site-header">
      <div className="header-inner shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {items.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <button className="location-trigger" onClick={onLocationClick} aria-label="Choose your city">
            <MapPin size={16} strokeWidth={2.2} /> <span>{selectedCity || 'Choose area'}</span><ChevronDown size={14} />
          </button>
          <button className="button button-pink button-small header-cta" onClick={() => scrollTo('services')}>Explore services <ArrowUpRight size={16} /></button>
          {currentUser && (
            <>
              <button
                className="button button-small button-outline auth-header-button"
                onClick={onBookingsClick}
              >
                My bookings
              </button>
              <button
                className="button button-small button-outline auth-header-button"
                onClick={onDashboardClick}
              >
                Dashboard
              </button>
              <button
                className="button button-small button-outline auth-header-button"
                onClick={onProfileClick}
              >
                My Profile
              </button>
            </>
          )}
          {currentUser ? (
            <button className="button button-small button-outline auth-header-button" onClick={onLogout}>Logout</button>
          ) : (
            <button className="button button-small button-outline auth-header-button" onClick={onAuthClick}>Login / Sign up</button>
          )}
          <button className="mobile-menu-button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0, y: -7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} className="mobile-nav shell">
          {items.map(([label, href]) => <a key={label} href={href} onClick={() => setMobileOpen(false)}>{label}<ChevronRight size={16} /></a>)}
          {currentUser && (
            <>
              <button className="button button-outline w-full" onClick={() => { setMobileOpen(false); onBookingsClick(); }}>My bookings</button>
              <button className="button button-outline w-full" onClick={() => { setMobileOpen(false); onDashboardClick(); }}>Dashboard</button>
              <button className="button button-outline w-full" onClick={() => { setMobileOpen(false); onProfileClick(); }}>My Profile</button>
            </>
          )}
          {!currentUser ? (
            <button className="button button-outline w-full" onClick={() => { setMobileOpen(false); onAuthClick(); }}>Login / Sign up</button>
          ) : (
            <button className="button button-outline w-full" onClick={() => { setMobileOpen(false); onLogout(); }}>Logout</button>
          )}
          <button className="button button-pink w-full" onClick={() => { setMobileOpen(false); scrollTo('services'); }}>Explore services <ArrowRight size={16} /></button>
        </motion.div>}
      </AnimatePresence>
    </header>
  );
}

function CityPicker({ open, onClose, selectedCity, onSelect }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => cities.filter(city => `${city.name} ${city.region}`.toLowerCase().includes(query.toLowerCase())), [query]);
  useEffect(() => {
    if (!open) setQuery('');
    if (!open) return;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <motion.div className="city-picker-modal" role="dialog" aria-modal="true" aria-labelledby="city-modal-title" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ duration: .2 }}>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
          <div className="modal-icon"><MapPin size={22} /></div>
          <p className="eyebrow">LOCAL, NOT FAR AWAY</p>
          <h3 id="city-modal-title">Where do you need a hand?</h3>
          <p className="modal-muted">Choose a city to personalise the Sevora experience.</p>
          <label className="city-search"><Search size={18} /><input autoFocus placeholder="Search cities or areas" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="picker-city-list">
            {filtered.map(city => <button className={`picker-city ${selectedCity === city.name ? 'selected' : ''}`} key={city.name} onClick={() => { onSelect(city.name); onClose(); }}>
              <span className="city-initials">{city.mark}</span><span className="picker-city-label"><strong>{city.name}</strong><small>{city.region}</small></span>
              {selectedCity === city.name ? <CheckCircle2 size={18} /> : <ChevronRight size={17} />}
            </button>)}
            {filtered.length === 0 && <p className="empty-state">We couldn't find that area. Try another nearby city.</p>}
          </div>
          <p className="tiny-disclaimer">Location list is for the project preview; live service availability may vary.</p>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

function ServiceCard({ service, index, onExplore }) {
  const image = getServiceImage(service);
  const price = typeof service.basePrice === 'number' ? `₹${service.basePrice.toLocaleString('en-IN')}` : null;
  const priceSuffix = service.pricingType === 'hourly' ? '/ hour' : service.pricingType === 'fixed' ? 'fixed' : 'onwards';
  return (
    <motion.article className="service-card" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .38, delay: (index % 3) * .06 }}>
      <div className="service-image-wrap">
        <img src={image} alt={service.name} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
        <span className="service-image-shade" />
        <span className="service-category-pill">{service.category || 'Home services'}</span>
        <button className="service-arrow" onClick={() => onExplore(service)} aria-label={`Explore ${service.name}`}><ArrowUpRight size={18} /></button>
      </div>
      <div className="service-card-content">
        <div className="service-title-row"><h3>{service.name}</h3>{service.providerType === 'driver' ? <CarFront size={19} /> : <House size={19} />}</div>
        <p>{service.description}</p>
        <div className="service-card-bottom">
          <div className="service-price">{price ? <><strong>{price}</strong> <span>{priceSuffix}</span></> : <span>Custom quote</span>}</div>
          <button className="text-link" onClick={() => onExplore(service)}>Explore <ArrowRight size={15} /></button>
        </div>
      </div>
    </motion.article>
  );
}


function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function firstUsefulDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDateKey(date);
}

const BOOKING_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:30', label: '6:30 PM' }
];

function ServiceModal({
  service,
  onClose,
  selectedCity,
  onLocationClick,
  currentUser,
  onNeedLogin,
  onBooked
}) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [note, setNote] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState(firstUsefulDate);
  const [bookingTime, setBookingTime] = useState('10:30');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [pickup, setPickup] = useState(currentUser?.address || '');
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState(service?.tripType || 'one_way');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bookingMessage, setBookingMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!service) return;
    // Reset appointment-specific fields only when the selected service changes.
    // Logging in while this modal is open must not reset the user's date/time choices.
    setDurationMinutes(Number(service.estimatedDurationMinutes) || 60);
    setNote('');
    setShowBookingForm(false);
    setBookingDate(firstUsefulDate());
    setBookingTime('10:30');
    setAddress(currentUser?.address || '');
    setPickup(currentUser?.address || '');
    setDestination('');
    setTripType(service?.tripType || 'one_way');
    setPhone(currentUser?.phone || '');
    setBookingMessage('');
    setSubmitting(false);
  }, [service?._id, service?.slug]);

  useEffect(() => {
    // If the customer logs in from this modal, fill missing contact fields
    // without overwriting anything they have already typed.
    if (!currentUser) return;
    if (currentUser.address) {
      setAddress((previous) => previous.trim() ? previous : currentUser.address);
      setPickup((previous) => previous.trim() ? previous : currentUser.address);
    }
    if (currentUser.phone) {
      setPhone((previous) => previous.trim() ? previous : currentUser.phone);
    }
  }, [currentUser?.address, currentUser?.phone]);

  useEffect(() => {
    if (!service) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !submitting) {
        if (showBookingForm) setShowBookingForm(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [service, onClose, showBookingForm, submitting]);

  const dateOptions = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return {
      key: localDateKey(date),
      day: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    };
  }), []);

  const allowedSlots = BOOKING_SLOTS.filter((slot) => {
    if (bookingDate !== localDateKey(new Date())) return true;
    const [hours, minutes] = slot.value.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate.getTime() > Date.now() + 30 * 60 * 1000;
  });

  useEffect(() => {
    if (!allowedSlots.some((slot) => slot.value === bookingTime)) {
      setBookingTime(allowedSlots[0]?.value || '');
    }
  }, [bookingDate, bookingTime, allowedSlots]);

  const price = typeof service?.basePrice === 'number'
    ? (service.pricingType === 'hourly'
      ? service.basePrice * Math.ceil(durationMinutes / 60)
      : service.basePrice)
    : null;

  const createBooking = async (event) => {
    event.preventDefault();
    setBookingMessage('');

    const token = localStorage.getItem('sevoraToken');
    if (!token) {
      onNeedLogin();
      return;
    }

    if (!bookingDate || !bookingTime) {
      setBookingMessage('Choose a date and an available time slot.');
      return;
    }
    const isDriver = service.providerType === 'driver';
    if (!isDriver && !address.trim()) {
      setBookingMessage('Add your service address. You can save it in your profile during sign-up.');
      return;
    }
    if (isDriver && (!pickup.trim() || !destination.trim())) {
      setBookingMessage('Enter a pickup and destination for the driver.');
      return;
    }
    if (!phone.trim()) {
      setBookingMessage('Add a contact number so the professional can reach you.');
      return;
    }

    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setBookingMessage('That time has passed. Please choose a future slot.');
      return;
    }

    const providerType = service.providerType === 'driver' ? 'driver' : 'home_service';
    const payload = {
      bookingType: providerType,
      serviceSlug: service.slug,
      ...( /^[a-f\d]{24}$/i.test(String(service._id || '')) ? { serviceId: service._id } : {}),
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: Number(durationMinutes),
      city: selectedCity,
      ...(isDriver ? { address: pickup.trim() } : { address: address.trim() }),
      customerPhone: phone.trim(),
      serviceDescription: service.name,
      note: note.trim()
    };

    if (providerType === 'driver') {
      payload.trip = {
        pickup: pickup.trim(),
        destination: destination.trim(),
        tripType: service.tripType || tripType
      };
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Booking failed (${response.status}).`);
      if (!data.booking?._id) throw new Error('The server did not confirm that a booking record was saved.');
      onBooked(data.booking);
    } catch (error) {
      setBookingMessage(error.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {service && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}>
          <motion.div className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ duration: 0.2 }}>
            <button className="icon-button modal-close" onClick={onClose} aria-label="Close" disabled={submitting}><X size={19} /></button>
            <div className="service-modal-image"><img src={getServiceImage(service)} alt={service.name} /></div>
            <div className="service-modal-content">
              <span className="eyebrow"><span className="eyebrow-dot" />{showBookingForm ? 'BOOK YOUR SERVICE' : 'YOUR LOCAL SERVICE'}</span>
              <h3 id="service-modal-title">{showBookingForm ? `Book ${service.name}` : service.name}</h3>
              <p className="modal-muted">{service.description}</p>
              {!showBookingForm ? (
                <>
                  <div className="modal-detail-row"><span><MapPin size={16} /> Your area</span><button className="subtle-action" onClick={onLocationClick}>{selectedCity || 'Choose city'} <ChevronDown size={14} /></button></div>
                  <div className="modal-detail-row"><span><Clock3 size={16} /> Typical duration</span><strong>{Math.round((Number(service.estimatedDurationMinutes) || 60) / 60 * 10) / 10} hr</strong></div>
                  <div className="modal-price-row"><span>{service.pricingType === 'quote' ? 'Final price after assessment' : 'Estimated price'}</span><strong>{price !== null ? `₹${price.toLocaleString('en-IN')}` : 'Quote required'}</strong></div>
                  <p className="tiny-disclaimer">Sevora will match your service to an available professional in {selectedCity}. You do not need to choose a plumber or provider manually.</p>
                  <button className="button button-pink button-full" onClick={() => setShowBookingForm(true)}>Choose appointment <ArrowRight size={17} /></button>
                </>
              ) : (
                <form className="booking-form" onSubmit={createBooking}>
                  <div className="booking-context-row"><span><MapPin size={15} />{selectedCity}</span><span><ShieldCheck size={15} />Auto-matched professional</span></div>
                  <label className="modal-note-label">Choose a day</label>
                  <div className="booking-date-grid">
                    {dateOptions.map((date) => <button type="button" key={date.key} className={`booking-date-option ${bookingDate === date.key ? 'active' : ''}`} onClick={() => setBookingDate(date.key)}><span>{date.day}</span><strong>{date.date}</strong></button>)}
                  </div>
                  <label className="modal-note-label">Available time</label>
                  <div className="booking-slot-grid">
                    {allowedSlots.map((slot) => <button type="button" key={slot.value} className={`booking-slot ${bookingTime === slot.value ? 'active' : ''}`} onClick={() => setBookingTime(slot.value)}>{slot.label}</button>)}
                    {!allowedSlots.length && <p className="empty-state">No time slots left today. Choose another date.</p>}
                  </div>
                  <label className="booking-field">How long do you need help?
                    <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
                      <option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option>
                    </select>
                  </label>
                  {service.providerType === 'driver' ? (
                    <>
                      <label className="booking-field">Pickup location
                        <textarea rows="2" value={pickup} onChange={(event) => setPickup(event.target.value)} placeholder="Your pickup location" autoComplete="street-address" required />
                      </label>
                      <label className="booking-field">Destination
                        <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Where should the driver take you?" required />
                      </label>
                      {!service.tripType && <label className="booking-field">Trip type
                        <select value={tripType} onChange={(event) => setTripType(event.target.value)}><option value="one_way">One way</option><option value="round_trip">Round trip</option><option value="hourly">Hourly</option></select>
                      </label>}
                    </>
                  ) : (
                    <label className="booking-field">Service address
                      <textarea rows="2" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Your saved address" autoComplete="street-address" required />
                    </label>
                  )}
                  <label className="booking-field">Contact number
                    <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="Phone number" required />
                    <small className="booking-help">Shared with your matched professional for this appointment.</small>
                  </label>
                  <label className="booking-field">Anything we should know? <span className="optional-label">Optional</span>
                    <textarea rows="2" value={note} onChange={(event) => setNote(event.target.value)} placeholder="A quick note about the task…" />
                  </label>
                  <div className="modal-price-row"><span>{service.pricingType === 'quote' ? 'Final price after assessment' : 'Estimated price'}</span><strong>{price !== null ? `₹${price.toLocaleString('en-IN')}` : 'Quote required'}</strong></div>
                  {bookingMessage && <p className="booking-error" role="alert">{bookingMessage}</p>}
                  <button type="submit" className="button button-pink button-full" disabled={submitting || !allowedSlots.length}>
  {submitting ? 'Finding a professional…' : 'Confirm appointment'}
  <ArrowRight size={17} />
</button>
                  <button type="button" className="button button-outline button-full" disabled={submitting} onClick={() => setShowBookingForm(false)}>Back</button>
                  <p className="tiny-disclaimer">Your appointment is saved to your Sevora account. The professional’s contact details will appear in My Bookings.</p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BookingHistoryModal({ open, onClose, refreshKey }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('sevoraToken');
        if (!token) throw new Error('Log in to view your appointments.');
        const response = await fetch(`${API_BASE}/bookings/my`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not load bookings.');
        if (!controller.signal.aborted) setBookings(data.bookings || []);
      } catch (err) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) setError(err.message || 'Could not load bookings.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [open, refreshKey]);
  return (
    <AnimatePresence>
      {open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <motion.section className="bookings-modal" role="dialog" aria-modal="true" aria-labelledby="bookings-title" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close bookings"><X size={19} /></button>
          <p className="eyebrow"><span className="eyebrow-dot" />YOUR SEVORA ACCOUNT</p><h3 id="bookings-title">My bookings<span>.</span></h3><p className="modal-muted">Real appointments saved to the database.</p>
          {loading && <p className="booking-help">Loading your appointments…</p>}{error && <p className="booking-error" role="alert">{error}</p>}
          {!loading && !error && bookings.length === 0 && <div className="bookings-empty"><CalendarDays size={28} /><strong>No bookings yet</strong><p>Your appointments will appear here after you book a service.</p></div>}
          <div className="my-bookings-list">{bookings.map((booking) => {
            const providerName = booking.provider?.user?.name || 'Matched professional';
            const providerPhone = booking.providerPhone || booking.provider?.user?.phone || '';
            const customerPhone = booking.customerPhone || booking.customer?.phone || '';
            return <article className="my-booking-row" key={booking._id}>
              <div className="my-booking-icon">{booking.bookingType === 'driver' ? <CarFront size={20} /> : <House size={20} />}</div>
              <div className="my-booking-info"><strong>{booking.service?.name || booking.serviceDescription || 'Sevora service'}</strong><span>{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time not specified'} · {booking.city || booking.address || 'Local service'}</span><small>Professional: {providerName}</small>{providerPhone && <small><Phone size={12} /> Professional: <a href={`tel:${providerPhone}`}>{providerPhone}</a></small>}{customerPhone && <small><Phone size={12} /> Customer contact: <a href={`tel:${customerPhone}`}>{customerPhone}</a></small>}{booking._id && <small className="my-booking-id">Booking ID: {booking._id}</small>}</div>
              <div className="my-booking-right"><span className={`booking-status status-${booking.status}`}>{String(booking.status || 'pending').replaceAll('_', ' ')}</span>{typeof booking.quotedPrice === 'number' && <strong>₹{booking.quotedPrice.toLocaleString('en-IN')}</strong>}</div>
            </article>;
          })}</div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  );
}

function WorkModal({ open, onClose, selectedCity, currentUser, onNeedLogin, onToast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverLetters, setCoverLetters] = useState({});
  const [applyingId, setApplyingId] = useState('');
  const [appliedIds, setAppliedIds] = useState([]);
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    async function loadJobs() {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ locality: selectedCity || 'Rajpura', limit: '30' });
        const response = await fetch(`${API_BASE}/jobs?${params.toString()}`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not load local jobs.');
        if (!controller.signal.aborted) setJobs(data.jobs || []);
      } catch (err) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) setError(err.message || 'Could not load jobs.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadJobs();
    return () => controller.abort();
  }, [open, selectedCity]);

  const applyToJob = async (job) => {
    const token = localStorage.getItem('sevoraToken');
    if (!token) { onNeedLogin(); return; }
    const roles = currentUser?.roles || [];
    if (!roles.some((role) => ['customer', 'provider', 'driver'].includes(role))) {
      setError('This account is set up as an employer. Use a job-seeker or customer account to apply.');
      return;
    }
    setApplyingId(job._id); setError('');
    try {
      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job._id, coverLetter: (coverLetters[job._id] || '').trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Application could not be submitted.');
      setAppliedIds((ids) => [...new Set([...ids, job._id])]);
      onToast('Application submitted successfully.');
    } catch (err) { setError(err.message || 'Application failed.'); }
    finally { setApplyingId(''); }
  };

  return <AnimatePresence>{open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.section className="bookings-modal work-modal" role="dialog" aria-modal="true" aria-labelledby="work-modal-title" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close job opportunities"><X size={19} /></button><p className="eyebrow"><span className="eyebrow-dot" />WORK CLOSE TO HOME</p><h3 id="work-modal-title">Local opportunities<span>.</span></h3><p className="modal-muted">Open jobs around {selectedCity}. Contact details are shown when the employer has provided a number.</p>
      {loading && <p className="booking-help">Finding local jobs…</p>}{error && <p role="alert" className="booking-error">{error}</p>}
      {!loading && !error && jobs.length === 0 && <div className="bookings-empty"><BriefcaseBusiness size={28} /><strong>No open jobs found for {selectedCity}</strong><p>Try another nearby area using the city picker.</p></div>}
      <div className="jobs-list">{jobs.map((job) => <article className="job-card" key={job._id}>
        <div className="job-card-top"><div><span className="job-category-pill">{job.category || 'Local work'}</span><h4>{job.title}</h4><p>{job.business?.name || 'Local employer'} · {job.locality}</p></div><span className="job-type-pill">{String(job.employmentType || '').replaceAll('_', ' ')}</span></div>
        <p className="job-description">{job.description}</p>
        <div className="job-pay">{job.salaryMin != null || job.salaryMax != null ? `₹${Number(job.salaryMin || 0).toLocaleString('en-IN')} – ₹${Number(job.salaryMax || 0).toLocaleString('en-IN')} / month` : 'Salary discussed with employer'}</div>
        <div className="job-contact-row"><span><UsersRound size={14} /> {job.postedBy?.name || 'Employer'}</span>{job.postedBy?.phone ? <a href={`tel:${job.postedBy.phone}`}><Phone size={14} /> {job.postedBy.phone}</a> : <span className="booking-help">Contact number not provided</span>}</div>
        <label className="booking-field">Message to employer <span className="optional-label">Optional</span><textarea rows="2" value={coverLetters[job._id] || ''} onChange={(event) => setCoverLetters((items) => ({ ...items, [job._id]: event.target.value }))} placeholder="Briefly tell them why you're interested…" /></label>
        <button className="button button-pink button-full" disabled={applyingId === job._id || appliedIds.includes(job._id)} onClick={() => applyToJob(job)}>{appliedIds.includes(job._id) ? 'Application sent' : applyingId === job._id ? 'Applying…' : 'Apply for this job'} {appliedIds.includes(job._id) ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}</button>
      </article>)}</div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

function Toast({ toast, onClose }) {
  return <AnimatePresence>{toast && <motion.div className="toast-message" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }}><CheckCircle2 size={19} /><span>{toast}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></motion.div>}</AnimatePresence>;
}

function App() {
  const [view, setView] = useState('home'); // 'home' | 'dashboard' | 'profile'
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('sevoraCity') || 'Rajpura');
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [workOpen, setWorkOpen] = useState(false);
  const [services, setServices] = useState(fallbackServices);
  const [source, setSource] = useState('demo');
  const [activeCategory, setActiveCategory] = useState('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showAllCities, setShowAllCities] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [toast, setToast] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [apiMessage, setApiMessage] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sevoraUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });


  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE}/services?limit=100`);
        if (!response.ok) throw new Error(`Catalogue returned ${response.status}`);
        const data = await response.json();
        const remote = Array.isArray(data.services) ? data.services : [];
        if (!cancelled && remote.length) {
          setServices(remote);
          setSource('api');
          setApiMessage('Live catalogue connected');
        } else if (!cancelled) {
          setApiMessage('Showing starter catalogue');
        }
      } catch {
        if (!cancelled) {
          setSource('demo');
          setApiMessage('Preview catalogue');
        }
      }
    }
    loadServices();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('sevoraToken');
    if (savedToken && !document.cookie.includes('token=')) {
      document.cookie = `token=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `sevora_token=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const existing = [...new Set(services.map(service => service.category).filter(Boolean))];
    return ['All', ...existing];
  }, [services]);

  const filteredServices = useMemo(() => services.filter(service => {
    const categoryMatch = activeCategory === 'All' || service.category?.toLowerCase() === activeCategory.toLowerCase();
    const query = serviceSearch.trim().toLowerCase();
    const textMatch = !query || [service.name, service.description, service.category, ...(service.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(query);
    return categoryMatch && textMatch;
  }), [services, activeCategory, serviceSearch]);

  const filteredCities = useMemo(() => cities.filter(city => `${city.name} ${city.region}`.toLowerCase().includes(citySearch.toLowerCase())), [citySearch]);
  const visibleCities = showAllCities || citySearch ? filteredCities : filteredCities.slice(0, 9);

  const handleSelectCity = (cityName, shouldScroll = false) => {
    setSelectedCity(cityName);
    localStorage.setItem('sevoraCity', cityName);
    setCurrentUser((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, city: cityName };
      localStorage.setItem('sevoraUser', JSON.stringify(updated));
      return updated;
    });
    setToast(`Your area is now ${cityName}.`);
    if (shouldScroll) window.setTimeout(() => scrollTo('services'), 80);
  };

  const handleBookingCreated = (booking) => {
    setSelectedService(null);
    setBookingsRefreshKey((value) => value + 1);
    setBookingsOpen(true);
    setToast(`Appointment saved. Status: ${booking.status || 'pending'}.`);
  };

  const handleLogin = (data) => {
    const user = data?.user;
    const token = data?.token;
    if (!user || !token) {
      setToast('Login response incomplete. Please try again.');
      return;
    }
    localStorage.setItem('sevoraToken', token);
    localStorage.setItem('sevoraUser', JSON.stringify(user));
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `sevora_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    setCurrentUser(user);
    if (user.city) {
      setSelectedCity(user.city);
      localStorage.setItem('sevoraCity', user.city);
    }
    setAuthOpen(false);
    setToast(`Welcome to Sevora, ${user.name || 'there'}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('sevoraToken');
    localStorage.removeItem('sevoraUser');
    document.cookie = 'token=; path=/; max-age=0;';
    document.cookie = 'sevora_token=; path=/; max-age=0;';
    setCurrentUser(null);
    setView('home');
    setToast('You have logged out successfully.');
  };
  

  const categoryIcon = (category) => {
    const name = (category || '').toLowerCase();
    if (name.includes('clean')) return Sparkles;
    if (name.includes('cook')) return CookingPot;
    if (name.includes('driver')) return CarFront;
    if (name.includes('electric')) return Zap;
    if (name.includes('plumb')) return Wrench;
    if (name.includes('house') || name.includes('household')) return HandHeart;
    return House;
  };

  

  if (view === 'dashboard' && currentUser) {
    return (
      <RoleDashboard
        user={currentUser}
        onLogout={handleLogout}
        onBackHome={() => setView('home')}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />
    );
  }

  if (view === 'profile' && currentUser) {
    return (
      <ProfilePage
        user={currentUser}
        onBackHome={() => setView('home')}
        onOpenDashboard={() => setView('dashboard')}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app-shell" id="home">
      <Header
        selectedCity={selectedCity}
        onLocationClick={() => setCityPickerOpen(true)}
        onAuthClick={() => setAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onBookingsClick={() => setBookingsOpen(true)}
        onDashboardClick={() => setView('dashboard')}
        onProfileClick={() => setView('profile')}
      />

      <main>
        <section className="hero-section">
          <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
          <div className="hero-layout shell">
            <motion.div className="hero-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
              <div className="hero-kicker"><span className="sparkle-circle"><Sparkles size={14} /></span> A little help goes a long way</div>
              <h1>Your home.<br />Your people.<br /><span>Sorted.</span></h1>
              <p className="hero-subtitle">From everyday home help to skilled professionals and personal drivers — good help should feel close to home.</p>
              <div className="hero-search-card">
                <div className="hero-search-field"><span className="search-field-icon"><Search size={18} /></span><label><small>WHAT DO YOU NEED?</small><input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Try cleaning, a cook, a driver…" onKeyDown={e => e.key === 'Enter' && scrollTo('services')} /></label></div>
                <span className="search-divider" />
                <button className="hero-location-field" onClick={() => setCityPickerOpen(true)}><MapPin size={18} /><span><small>YOUR AREA</small><strong>{selectedCity || 'Choose a city'}</strong></span><ChevronDown size={15} /></button>
                <button className="button button-pink hero-search-button" onClick={() => scrollTo('services')}>Find help <ArrowRight size={17} /></button>
              </div>
              <div className="hero-under-search"><span className="avatar-stack"><span>N</span><span>S</span><span>+</span></span><p><strong>Local people. Real-world help.</strong><br />Built around your everyday routine.</p><div className="hero-trust-note"><ShieldCheck size={17} /> Trust comes first</div></div>
            </motion.div>
            <motion.div className="hero-art" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .75, delay: .1 }}>
              <div className="hero-photo-main"><img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1300&q=90" alt="A bright, tidy home with cleaning supplies ready" onError={e => { e.currentTarget.style.display = 'none'; }} /><div className="hero-photo-overlay" /><div className="hero-photo-caption"><span>THE SEVORA FEELING</span><strong>One less thing<br />on your mind.</strong></div><div className="hero-photo-sticker"><div className="sticker-icon"><HeartHandshake size={24} /></div><div><strong>Help that fits your life</strong><small>From quick tasks to skilled work</small></div></div></div>
              <div className="hero-floating-card floating-top"><span className="floating-icon pink-icon"><BadgeCheck size={20} /></span><span><strong>People-first</strong><small>Everyday help, made easier</small></span></div>
              <div className="hero-floating-card floating-bottom"><span className="floating-icon purple-icon"><MapPin size={20} /></span><span><strong>Close to home</strong><small>Punjab · Chandigarh · Haryana</small></span></div>
              <div className="hero-doodle"><span>✳</span><i>✦</i></div>
            </motion.div>
          </div>
          <div className="hero-bottom-strip"><div className="shell hero-strip-inner"><span>LESS CHAOS</span><span className="strip-star">✳</span><span>MORE YOU-TIME</span><span className="strip-star">✳</span><span>HELP CLOSE TO HOME</span><span className="strip-star">✳</span><span>THAT'S SEVORA</span></div></div>
        </section>

        <section className="trust-ribbon" aria-label="Sevora values"><div className="shell trust-ribbon-inner"><div><span className="trust-icon"><ShieldCheck size={20} /></span><span><strong>Safety-minded</strong><small>Built around trust</small></span></div><div><span className="trust-icon"><Clock3 size={20} /></span><span><strong>Your schedule</strong><small>Help on your terms</small></span></div><div><span className="trust-icon"><MapPin size={20} /></span><span><strong>Local-first</strong><small>Neighbourhood by neighbourhood</small></span></div><div><span className="trust-icon"><HeartHandshake size={20} /></span><span><strong>People matter</strong><small>For homes and workers</small></span></div></div></section>

        <section className="services-section section-pad" id="services">
          <div className="shell">
            <div className="services-topline"><div><SectionHeading eyebrow="YOUR DAY, MADE LIGHTER" title="A little help with" accent="a lot of life." subtitle="Browse the essentials, find your kind of help, and build a routine that works for you." align="left" /></div><div className="catalogue-status"><span className={`status-dot ${source === 'api' ? 'status-connected' : ''}`} />{apiMessage || 'Loading catalogue'}<span className="status-separator">·</span><span>{services.length} services</span></div></div>
            <div className="category-quick-row" aria-label="Filter service categories">
              <button className={`category-chip ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}><Sparkles size={16} /> Everything</button>
              {categories.filter(category => category !== 'All').map(category => { const Icon = categoryIcon(category); return <button key={category} className={`category-chip ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}><Icon size={16} /> {category}</button>; })}
            </div>
            <div className="services-search-line"><div className="inline-search"><Search size={18} /><input aria-label="Search services" placeholder="Search all services…" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} /><kbd>⌕</kbd></div><span className="results-count">Showing <strong>{filteredServices.length}</strong> {filteredServices.length === 1 ? 'service' : 'services'}</span></div>
            {filteredServices.length ? <div className="services-grid">{filteredServices.map((service, index) => <ServiceCard key={service._id || service.slug || service.name} service={service} index={index} onExplore={setSelectedService} />)}</div> : <div className="empty-catalogue"><div className="empty-icon"><Search size={24} /></div><h3>No services found just yet</h3><p>Try a different search or choose another category.</p><button className="button button-outline" onClick={() => { setActiveCategory('All'); setServiceSearch(''); }}>Clear filters</button></div>}
            <div className="services-footer-note"><span><CheckCircle2 size={17} /> Prices shown are indicative and may vary by task.</span><span>Browsing the catalogue doesn't confirm a booking.</span></div>
          </div>
        </section>

        <section className="feature-section section-pad">
          <div className="shell feature-layout">
            <div className="feature-image-panel"><img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85" alt="A clean, warm kitchen ready for everyday life" loading="lazy" /><span className="feature-image-tag"><Leaf size={15} /> Made for real life</span><div className="feature-bubble"><span>✳</span><strong>Room to breathe.</strong><small>That's the whole point.</small></div></div>
            <div className="feature-copy"><div className="eyebrow"><span className="eyebrow-dot" /> GOOD HELP SHOULD FEEL GOOD</div><h2>More time for<br /><span>your kind of life.</span></h2><p>Some days need a quick hand. Others need someone who knows exactly what they're doing. Sevora brings both kinds of help into one thoughtful local experience.</p><div className="feature-points"><div><span className="point-check"><Check size={16} /></span><div><strong>From everyday to expert</strong><p>Household support and skilled services, in one place.</p></div></div><div><span className="point-check"><Check size={16} /></span><div><strong>One step at a time</strong><p>Choose a service, explore your area and plan what you need.</p></div></div><div><span className="point-check"><Check size={16} /></span><div><strong>Work that works both ways</strong><p>A space for customers and local professionals to connect.</p></div></div></div><button className="button button-dark" onClick={() => scrollTo('how-it-works')}>How Sevora works <ArrowRight size={17} /></button></div>
          </div>
        </section>

        <section className="cities-section section-pad" id="cities">
          <div className="shell">
            <SectionHeading eyebrow="A LOCAL KIND OF LOVE" title="Your city. Your people." accent="Your Sevora." subtitle="Starting with the places we know, growing one neighbourhood at a time." />
            <div className="cities-search-row"><div className="cities-search"><Search size={18} /><input value={citySearch} onChange={e => { setCitySearch(e.target.value); if (e.target.value) setShowAllCities(true); }} placeholder="Find your city or nearby area" aria-label="Find your city" />{citySearch && <button onClick={() => setCitySearch('')} aria-label="Clear city search"><X size={16} /></button>}</div><span className="cities-search-caption"><MapPin size={15} /> Punjab · Chandigarh · Haryana</span></div>
            <div className="cities-grid">{visibleCities.map((city, index) => <motion.button type="button" key={city.name} aria-pressed={selectedCity === city.name} className={`city-card city-card-${index % 6} ${selectedCity === city.name ? 'city-card-selected' : ''}`} onClick={() => handleSelectCity(city.name, true)} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: .28, delay: (index % 6) * .025 }}>
              <span className="city-card-copy"><small>{city.region.toUpperCase()}</small><strong>{city.name}</strong><span className="city-landmark">{city.landmark}</span><span className="city-explore-label">Choose this area <ArrowUpRight size={14} /></span></span><span className="city-art" aria-hidden="true"><CityIllustration type={city.art} /></span><span className="city-card-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
            </motion.button>)}</div>
            {filteredCities.length === 0 && <div className="empty-state city-empty">No matching areas yet. Try a nearby city name.</div>}
            {!citySearch && filteredCities.length > 9 && <div className="cities-more"><button className="button button-outline" onClick={() => setShowAllCities(value => !value)}>{showAllCities ? 'Show fewer areas' : `Explore all ${filteredCities.length} areas`} <ChevronDown size={16} className={showAllCities ? 'rotate-chevron' : ''} /></button></div>}
            <p className="locations-disclaimer">Location showcase for the Sevora project preview. Service coverage and provider availability will need to be enabled area by area.</p>
          </div>
        </section>

        <section className="how-section section-pad" id="how-it-works">
          <div className="shell"><SectionHeading eyebrow="SIMPLE BY DESIGN" title="Help, without the" accent="whole big process." subtitle="A clear path from ‘I need help’ to knowing what to do next." />
            <div className="steps-grid"><div className="step-card"><div className="step-illustration step-one"><span className="step-number">01</span><div className="step-icon-bubble"><Search size={31} /></div><span className="step-spark step-spark-a">✦</span><span className="step-spark step-spark-b">✳</span></div><div className="step-text"><span>FIRST THINGS FIRST</span><h3>Find your kind of help</h3><p>Browse services and choose the task that fits your day.</p></div></div><div className="step-connector"><ArrowRight size={21} /></div><div className="step-card"><div className="step-illustration step-two"><span className="step-number">02</span><div className="step-icon-bubble"><CalendarDays size={31} /></div><span className="step-spark step-spark-a">✦</span><span className="step-spark step-spark-b">✳</span></div><div className="step-text"><span>MAKE IT YOURS</span><h3>Plan around your life</h3><p>Choose your area and work out the details that matter.</p></div></div><div className="step-connector"><ArrowRight size={21} /></div><div className="step-card"><div className="step-illustration step-three"><span className="step-number">03</span><div className="step-icon-bubble"><HeartHandshake size={31} /></div><span className="step-spark step-spark-a">✦</span><span className="step-spark step-spark-b">✳</span></div><div className="step-text"><span>ONE LESS THING</span><h3>Get back to your day</h3><p>The goal is simple: a little less to manage, a little more breathing room.</p></div></div></div>
          </div>
        </section>

        <ReviewsCarousel />

        <section className="work-cta-section" id="work"><div className="shell work-cta-card"><div className="work-cta-ornament ornament-a">✳</div><div className="work-cta-ornament ornament-b">✦</div><div className="work-cta-copy"><span className="work-cta-label"><BriefcaseBusiness size={15} /> FOR LOCAL PROFESSIONALS</span><h2>Good work should<br /><span>find good people.</span></h2><p>Offer a service, build your profile, or explore job opportunities. Sevora is being built to bring local work closer to home, too.</p><div className="work-cta-actions"><button className="button button-white" onClick={() => setWorkOpen(true)}>Explore opportunities <ArrowUpRight size={17} /></button><span><UsersRound size={16} /> A marketplace for both sides</span></div></div><div className="work-cta-graphic"><div className="graphic-ring ring-one" /><div className="graphic-ring ring-two" /><div className="graphic-center"><HeartHandshake size={54} /></div><div className="graphic-pill graphic-pill-one"><span>✳</span> Skills that matter</div><div className="graphic-pill graphic-pill-two"><span>↗</span> Local opportunity</div><div className="graphic-pill graphic-pill-three"><span>♡</span> People first</div></div></div></section>

        <section className="faq-section section-pad" id="faq"><div className="shell faq-layout"><div className="faq-intro"><div className="eyebrow"><span className="eyebrow-dot" /> THE LITTLE DETAILS</div><h2>Questions?<br /><span>We've got you.</span></h2><p>A few things worth knowing about the Sevora experience.</p><div className="faq-contact-card"><span><CircleHelp size={20} /></span><div><strong>Still curious?</strong><small>More answers will be added as the service grows.</small></div><MessageCircle size={20} className="faq-contact-arrow" /></div></div><div className="faq-list">{faqItems.map((item, index) => <div className={`faq-item ${openFaq === index ? 'faq-open' : ''}`} key={item.question}><button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span><i>{String(index + 1).padStart(2, '0')}</i>{item.question}</span><span className="faq-toggle">{openFaq === index ? <X size={17} /> : <ChevronDown size={17} />}</span></button><AnimatePresence initial={false}>{openFaq === index && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }}><p>{item.answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

        <section className="final-cta-section"><div className="shell final-cta-inner"><div className="final-cta-star star-left">✳</div><div className="final-cta-star star-right">✦</div><span className="final-cta-eyebrow">YOUR NEXT LITTLE WIN</span><h2>Make room for <span>yourself.</span></h2><p>Start with one small thing. See what local help could make easier.</p><div className="final-cta-buttons"><button className="button button-pink" onClick={() => scrollTo('services')}>Explore the services <ArrowRight size={17} /></button><button className="button button-light-outline" onClick={() => scrollTo('cities')}>Find your area <MapPin size={17} /></button></div></div></section>
      </main>

      <footer className="site-footer"><div className="shell footer-main"><div className="footer-brand-col"><Brand light /><p>Local help for real life.<br />A little more room to be you.</p><div className="footer-socials"><a href="#home" aria-label="Sevora home">s.</a><a href="#work" aria-label="Sevora opportunities">in</a><a href="#faq" aria-label="Sevora questions">?</a></div></div><div className="footer-link-group"><h4>Discover</h4><a href="#services">Home services</a><a href="#cities">Areas & cities</a><a href="#how-it-works">How it works</a></div><div className="footer-link-group"><h4>Work with us</h4><a href="#work">Offer a service</a><a href="#work">Find local work</a><a href="#faq">Provider FAQs</a></div><div className="footer-note-box"><span className="footer-note-icon"><Navigation size={19} /></span><strong>Starting close to home.</strong><p>Built with local communities across Punjab, Chandigarh and Haryana in mind.</p><button onClick={() => setCityPickerOpen(true)}>Choose your area <ArrowUpRight size={15} /></button></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Sevora. Made for everyday life.</span><span className="footer-build-note">React + Tailwind · Local marketplace preview</span><a href="#home">Back to top ↑</a></div></footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} defaultCity={selectedCity} />
      <CityPicker open={cityPickerOpen} onClose={() => setCityPickerOpen(false)} selectedCity={selectedCity} onSelect={(cityName) => handleSelectCity(cityName, false)} />
      <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} selectedCity={selectedCity} onLocationClick={() => setCityPickerOpen(true)} currentUser={currentUser} onNeedLogin={() => setAuthOpen(true)} onBooked={handleBookingCreated} />
      <BookingHistoryModal open={bookingsOpen} onClose={() => setBookingsOpen(false)} refreshKey={bookingsRefreshKey} />
      <WorkModal open={workOpen} onClose={() => setWorkOpen(false)} selectedCity={selectedCity} currentUser={currentUser} onNeedLogin={() => setAuthOpen(true)} onToast={setToast} />
      <Toast toast={toast} onClose={() => setToast('')} />
    </div>
  );
}

export default App;
