import { useState } from 'react';
import { Star, CheckCircle2, Quote, Sparkles } from 'lucide-react';

const REVIEWS_ROW_1 = [
  {
    id: 1,
    name: 'Simranjeet Kaur',
    city: 'Sector 35, Chandigarh',
    service: 'Full Home Deep Cleaning',
    rating: 5,
    date: '2 days ago',
    text: 'Booked home deep cleaning before a family function. The team arrived right on time, brought all professional supplies, and left the bathrooms and kitchen spotless. Exactly like UrbanClap, but feels local and transparent.',
    avatar: 'S',
    avatarBg: '#fce7f3',
    avatarColor: '#db2777'
  },
  {
    id: 2,
    name: 'Ramanpreet Singh',
    city: 'Rajpura (Old City)',
    service: 'Personal Driver (One-way)',
    rating: 5,
    date: 'Yesterday',
    text: 'Needed someone to drive my father in our car to Mohali Fortis for an appointment. The driver was punctual, extremely polite, and drove very carefully. A lifesaver when you need a trusted driver for your own car.',
    avatar: 'R',
    avatarBg: '#ccfbf1',
    avatarColor: '#0d9488'
  },
  {
    id: 3,
    name: 'Ananya Sharma',
    city: 'Phase 7, Mohali',
    service: 'Home Cook & Kitchen Prep',
    rating: 5,
    date: '3 days ago',
    text: 'Finding a reliable daily cook in Mohali was so difficult until Sevora. The matched cook prepares clean, home-style North Indian meals and is always on time. Best thing I did this month!',
    avatar: 'A',
    avatarBg: '#ede9fe',
    avatarColor: '#7c3aed'
  },
  {
    id: 4,
    name: 'Gurmeet Dhillon',
    city: 'Urban Estate, Patiala',
    service: 'Plumbing Repair',
    rating: 5,
    date: '4 days ago',
    text: 'Had an annoying concealed pipeline leak in our washroom. The plumber arrived within 45 minutes of booking, diagnosed the issue quickly, and fixed it without breaking extra tiles. Very reasonable price.',
    avatar: 'G',
    avatarBg: '#ffedd5',
    avatarColor: '#ea580c'
  }
];

const REVIEWS_ROW_2 = [
  {
    id: 5,
    name: 'Pooja Verma',
    city: 'Sector 20, Panchkula',
    service: 'Hourly Household Help',
    rating: 5,
    date: 'Just now',
    text: 'Being a working mom, having 2 hours of household help for dusting, utensil washing, and tidying up makes such a difference. The booking was confirmed instantly and she was so thorough.',
    avatar: 'P',
    avatarBg: '#fce7f3',
    avatarColor: '#db2777'
  },
  {
    id: 6,
    name: 'Vikramjit Sahni',
    city: 'Model Town, Ludhiana',
    service: 'AC Servicing & Filter Cleaning',
    rating: 5,
    date: '2 days ago',
    text: 'Got two split ACs serviced before peak summer. The technician inspected gas pressure, cleaned the cooling coils thoroughly, and cleaned up the room before leaving. Transparent pricing with no hidden charges.',
    avatar: 'V',
    avatarBg: '#e0f2fe',
    avatarColor: '#0284c7'
  },
  {
    id: 7,
    name: 'Mehak Mittal',
    city: 'Ambala Cantt',
    service: 'Electrical Repair & Fan Fitting',
    rating: 5,
    date: '5 days ago',
    text: 'Booked an electrician for replacing 3 ceiling fans and switchboards. Skilled, polite, and carried all tester equipment. Saved me from having to chase local shopkeepers.',
    avatar: 'M',
    avatarBg: '#fef3c7',
    avatarColor: '#d97706'
  },
  {
    id: 8,
    name: 'Jaspreet Brar',
    city: 'Zirakpur (VIP Road)',
    service: 'Weekend Chauffeur',
    rating: 5,
    date: 'Last week',
    text: 'Hired a driver for a round trip to Shimla for our family trip. Experienced hill driver with a commercial background. Smooth ride both ways. 10/10 recommend!',
    avatar: 'J',
    avatarBg: '#dcfce7',
    avatarColor: '#16a34a'
  }
];

function ReviewCard({ review }) {
  return (
    <article className="sev-review-card">
      <div className="sev-review-top">
        <div className="sev-review-stars" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} size={15} fill="#ef438b" color="#ef438b" />
          ))}
        </div>
        <span className="sev-review-verified">
          <CheckCircle2 size={13} /> Verified Booking
        </span>
      </div>

      <span className="sev-review-service-pill">{review.service}</span>

      <p className="sev-review-text">"{review.text}"</p>

      <div className="sev-review-author">
        <div
          className="sev-review-avatar"
          style={{ background: review.avatarBg, color: review.avatarColor }}
        >
          {review.avatar}
        </div>
        <div>
          <strong className="sev-review-name">{review.name}</strong>
          <small className="sev-review-location">{review.city} · {review.date}</small>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate arrays to create continuous infinite marquee effect
  const doubleRow1 = [...REVIEWS_ROW_1, ...REVIEWS_ROW_1];
  const doubleRow2 = [...REVIEWS_ROW_2, ...REVIEWS_ROW_2];

  return (
    <section className="reviews-section section-pad" id="reviews">
      <div className="shell">
        <div className="section-heading text-center" style={{ marginBottom: '36px' }}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> REAL HOMES, REAL TRUST
          </div>
          <h2>
            Loved across your <span>neighbourhood.</span>
          </h2>
          <p>
            From everyday chores in Rajpura to round-trip driving across Chandigarh, Punjab & Haryana.
          </p>
        </div>
      </div>

      {/* MARQUEE CAROUSEL CONTAINER */}
      <div
        className="sev-marquee-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* ROW 1: Slides Left */}
        <div
          className={`sev-marquee-track sev-marquee-left ${isPaused ? 'paused' : ''}`}
        >
          {doubleRow1.map((review, index) => (
            <ReviewCard key={`r1-${review.id}-${index}`} review={review} />
          ))}
        </div>

        {/* ROW 2: Slides Right */}
        <div
          className={`sev-marquee-track sev-marquee-right ${isPaused ? 'paused' : ''}`}
        >
          {doubleRow2.map((review, index) => (
            <ReviewCard key={`r2-${review.id}-${index}`} review={review} />
          ))}
        </div>

        <div className="sev-marquee-fade-left" aria-hidden="true" />
        <div className="sev-marquee-fade-right" aria-hidden="true" />
      </div>

      <div className="shell text-center" style={{ marginTop: '28px' }}>
        <p className="tiny-disclaimer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#ef438b" /> Over 4.9 ★ average rating from verified local appointments.
        </p>
      </div>
    </section>
  );
}
