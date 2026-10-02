import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Wrench, Lock, ShieldCheck } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import TVS_Logo from '../assets/TVS_logo_white.png';
import api from '../utils/api';
import { resolveUrl } from '../utils/settingsShared';

const SOCIAL_ICONS = {
  facebook:  FaFacebook,
  twitter:   FaTwitter,
  instagram: FaInstagram,
  youtube:   FaYoutube,
};

const SEED_COLUMNS = [
  { id: 'col-brand', type: 'brand', title: 'Brand', enabled: true },
  {
    id: 'col-about', type: 'links', title: 'About TVS', enabled: true,
    items: [
      { label: 'Founded in 1978',              href: '' },
      { label: 'Headquartered in Hosur, TN',   href: '' },
      { label: 'ISO 9001:2015 Certified',      href: '' },
      { label: '1 Year Warranty on All Parts', href: '' },
      { label: 'Pan-India Dealer Network',     href: '' },
    ],
  },
  {
    id: 'col-help', type: 'links', title: 'Help & Support', enabled: true,
    items: [
      { label: 'Customer Support', href: '/customer-care'        },
      { label: 'Track My Order',   href: '/profile?tab=tracking' },
      { label: 'Return Policy',    href: '/customer-care'        },
      { label: 'Warranty Claims',  href: '/customer-care'        },
      { label: 'Become a Dealer',  href: '/become-dealer'        },
    ],
  },
  {
    id: 'col-contact', type: 'contact', title: 'Contact Us', enabled: true,
    phone: '1800-258-6454',       phoneNote:   'Toll-free · 24×7',
    email: 'parts@tvsmotors.com', emailNote:   'Reply within 4 hours',
    address: 'TVS Motor Company', addressNote: 'Hosur, Tamil Nadu, India',
  },
];

const SEED_SOCIALS = { facebook: '#', twitter: '#', instagram: '#', youtube: '#' };
const SEED_TAGLINE = 'Official online store for genuine TVS spare parts, accessories and lubricants. Quality assured. Warranty backed.';
const SEED_BOTTOM  = { certified: 'OEM Certified Parts', secure: 'Secure Checkout', warranty: '1 Year Warranty' };

export default function Footer() {
  const [columns, setColumns] = useState(SEED_COLUMNS);
  const [socials, setSocials] = useState(SEED_SOCIALS);
  const [tagline, setTagline] = useState(SEED_TAGLINE);
  const [bottom,  setBottom]  = useState(SEED_BOTTOM);
  const [logo,    setLogo]    = useState(null);
  const [bgColor, setBgColor] = useState('#0a1f44');

  useEffect(() => {
    api.get('/admin/site-settings')
      .then(({ data }) => {
        const f = data?.footer;
        if (!f) return;
        if (f.tagline) setTagline(f.tagline);
        if (f.socials) setSocials({ ...SEED_SOCIALS, ...f.socials });
        if (f.bottom)  setBottom({ ...SEED_BOTTOM,  ...f.bottom });
        if (f.logo)    setLogo(resolveUrl(f.logo));
        if (f.bgColor) setBgColor(f.bgColor);

        if (Array.isArray(f.columns) && f.columns.length > 0) {
          setColumns(
            f.columns.map(sc => {
              const seed = SEED_COLUMNS.find(d => d.id === sc.id) ?? {};
              return { ...seed, ...sc, items: sc.items ?? seed.items ?? [] };
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const enabledColumns = columns.filter(c => c.enabled !== false);

  return (
    /* ✅ NO bg-[] Tailwind class here — color comes from inline style only */
    <footer style={{ backgroundColor: bgColor }} className="text-gray-300 mt-16">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">

          {enabledColumns.map(col => {

            /* ── Brand ── */
            if (col.type === 'brand') return (
              <div key={col.id} className="col-span-2 md:col-span-1">
                <Link to="/" className="flex items-center gap-2.5 mb-5">
                  <img src={logo || TVS_Logo} alt="TVS Motors" className="h-9 w-auto object-contain" />
                </Link>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{tagline}</p>
                <div className="flex gap-2">
                  {Object.entries(socials).map(([key, href]) => {
                    const Icon = SOCIAL_ICONS[key];
                    if (!Icon) return null;
                    return (
                      <a key={key} href={href || '#'}
  target="_blank"
  rel="noopener noreferrer"
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4 text-gray-300" />
                      </a>
                    );
                  })}
                </div>
              </div>
            );

            /* ── Links ── */
            if (col.type === 'links') return (
              <div key={col.id}>
                <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{col.title}</h3>
                <ul className="space-y-2">
                  {(col.items || []).map((item, i) => (
                   <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
  {item.href ? (
    item.href.startsWith('http://') || item.href.startsWith('https://') ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-white transition-colors"
      >
        {item.label}
      </a>
    ) : (
      <Link
        to={item.href}
        className="hover:text-white transition-colors"
      >
        {item.label}
      </Link>
    )
  ) : (
    <>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      {item.label}
    </>
  )}
</li>
                  ))}
                </ul>
              </div>
            );

            /* ── Contact ── */
            if (col.type === 'contact') return (
              <div key={col.id}>
                <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{col.title}</h3>
                <ul className="space-y-3">
                  {col.phone && (
                    <li className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">{col.phone}</p>
                        {col.phoneNote && <p className="text-xs text-gray-500">{col.phoneNote}</p>}
                      </div>
                    </li>
                  )}
                  {col.email && (
                    <li className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">{col.email}</p>
                        {col.emailNote && <p className="text-xs text-gray-500">{col.emailNote}</p>}
                      </div>
                    </li>
                  )}
                  {col.address && (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">{col.address}</p>
                        {col.addressNote && <p className="text-xs text-gray-500">{col.addressNote}</p>}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            );

            return null;
          })}

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4
                        flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} TVS Motor Company. All rights reserved.
          </p>
          <div className="flex items-center gap-3 md:gap-4 text-xs text-gray-500 flex-wrap justify-center">
            {bottom.certified && (
              <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{bottom.certified}</span>
            )}
            {bottom.secure && (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{bottom.secure}</span>
            )}
            {bottom.warranty && (
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />{bottom.warranty}</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}