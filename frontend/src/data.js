export const cities = [
  { name: 'Rajpura', region: 'Punjab', group: 'Tricity & nearby', mark: 'RP' },
  { name: 'Chandigarh', region: 'Chandigarh', group: 'Tricity & nearby', mark: 'CH' },
  { name: 'Panchkula', region: 'Haryana', group: 'Tricity & nearby', mark: 'PK' },
  { name: 'Mohali', region: 'Punjab', group: 'Tricity & nearby', mark: 'MO' },
  { name: 'Zirakpur', region: 'Punjab', group: 'Tricity & nearby', mark: 'ZI' },
  { name: 'Ambala', region: 'Haryana', group: 'Haryana', mark: 'AM' },
  { name: 'Patiala', region: 'Punjab', group: 'Punjab', mark: 'PT' },
  { name: 'Samana', region: 'Punjab', group: 'Punjab', mark: 'SM' },
  { name: 'Sirhind', region: 'Punjab', group: 'Punjab', mark: 'SH' },
  { name: 'Khanna', region: 'Punjab', group: 'Punjab', mark: 'KH' },
  { name: 'Ludhiana', region: 'Punjab', group: 'Punjab', mark: 'LD' },
  { name: 'Shahabad Markanda', region: 'Haryana', group: 'Haryana', mark: 'SB' },
  { name: 'Kurukshetra', region: 'Haryana', group: 'Haryana', mark: 'KK' },
  { name: 'Karnal', region: 'Haryana', group: 'Haryana', mark: 'KN' },
  { name: 'Yamunanagar', region: 'Haryana', group: 'Haryana', mark: 'YN' },
  { name: 'Jalandhar', region: 'Punjab', group: 'Punjab', mark: 'JL' },
  { name: 'Amritsar', region: 'Punjab', group: 'Punjab', mark: 'AS' },
  { name: 'Bathinda', region: 'Punjab', group: 'Punjab', mark: 'BT' }
];

export const fallbackServices = [
  {
    _id: 'demo-house-help', name: 'House Help', slug: 'hourly-household-help',
    category: 'Household Help', providerType: 'home_service',
    description: 'A helping hand for everyday chores, tidying and the little things that add up.',
    pricingType: 'hourly', basePrice: 299, estimatedDurationMinutes: 120,
    tags: ['house help', 'chores', 'hourly'], imageKey: 'house'
  },
  {
    _id: 'demo-cleaning', name: 'Home Cleaning', slug: 'full-home-deep-cleaning',
    category: 'Cleaning', providerType: 'home_service',
    description: 'Give your space a refresh with thoughtful, detail-first cleaning support.',
    pricingType: 'starting_at', basePrice: 499, estimatedDurationMinutes: 90,
    tags: ['cleaning', 'deep cleaning'], imageKey: 'cleaning'
  },
  {
    _id: 'demo-cook', name: 'Home Cook', slug: 'home-cook',
    category: 'Cooking', providerType: 'home_service',
    description: 'Everyday meal prep and kitchen support, with help that fits your routine.',
    pricingType: 'starting_at', basePrice: 399, estimatedDurationMinutes: 90,
    tags: ['cook', 'kitchen', 'meal prep'], imageKey: 'cook'
  },
  {
    _id: 'demo-plumbing', name: 'Plumbing', slug: 'plumbing-repair',
    category: 'Plumbing', providerType: 'home_service',
    description: 'Get help with leaking taps, fittings and those small fixes at home.',
    pricingType: 'starting_at', basePrice: 199, estimatedDurationMinutes: 60,
    tags: ['plumber', 'repair'], imageKey: 'plumbing'
  },
  {
    _id: 'demo-electrician', name: 'Electrical Work', slug: 'electrical-repair',
    category: 'Electrical', providerType: 'home_service',
    description: 'Find support for common electrical repairs and household installations.',
    pricingType: 'starting_at', basePrice: 199, estimatedDurationMinutes: 60,
    tags: ['electrician', 'repair'], imageKey: 'electrical'
  },
  {
    _id: 'demo-driver', name: 'Personal Driver', slug: 'driver-one-way',
    category: 'Driver', providerType: 'driver',
    description: 'A driver for your own car, whether it is a one-way ride or a longer plan.',
    pricingType: 'starting_at', basePrice: 399, estimatedDurationMinutes: 60,
    tags: ['driver', 'one way', 'personal car'], imageKey: 'driver'
  }
];

export const servicePhotos = {
  house: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85',
  cleaning: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=85',
  cook: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85',
  plumbing: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=85',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=85',
  driver: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=85'
};

export const faqItems = [
  {
    question: 'What is Sevora?',
    answer: 'Sevora is being built to bring local home-service professionals, household help, drivers and job opportunities together in one place.'
  },
  {
    question: 'Can I book short-duration household help?',
    answer: 'That is part of the product vision. The catalogue can showcase hourly household help as well as services that need a longer appointment.'
  },
  {
    question: 'Which areas are shown here?',
    answer: 'The locations section highlights the Punjab, Chandigarh and Haryana areas planned for the Sevora experience. Displayed areas do not imply that live service fulfilment is active yet.'
  },
  {
    question: 'How are providers verified?',
    answer: 'Sevora includes a provider verification status in its backend. The live verification process and eligibility rules should be confirmed before bookings go into production.'
  },
  {
    question: 'Can I look for work on Sevora?',
    answer: 'Yes. Sevora is designed to keep employment listings and applications separate from customer service bookings, so people can explore jobs as well as offer services.'
  }
];
