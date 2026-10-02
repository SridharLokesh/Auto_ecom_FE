// utils/settingsShared.jsx  — shared primitives for all Settings tabs
import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Upload, Info, X } from 'lucide-react';

export const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://backend-focus-seu6.onrender.com';

export const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND}${url}`;
};

/* ── 15 named preset colors — no hex code entry ── */
export const PRESET_COLORS = [
  { hex: '#0a1f44', name: 'Navy'       },
  { hex: '#1d4ed8', name: 'Blue'       },
  { hex: '#0891b2', name: 'Cyan'       },
  { hex: '#059669', name: 'Green'      },
  { hex: '#16a34a', name: 'Emerald'    },
  { hex: '#d97706', name: 'Amber'      },
  { hex: '#dc2626', name: 'Red'        },
  { hex: '#7c3aed', name: 'Violet'     },
  { hex: '#db2777', name: 'Pink'       },
  { hex: '#374151', name: 'Slate'      },
  { hex: '#9a3412', name: 'Orange'     },
  { hex: '#0f172a', name: 'Dark Navy'  },
  { hex: '#166534', name: 'Dark Green' },
  { hex: '#1e3a5f', name: 'Ocean'      },
  { hex: '#4a1942', name: 'Plum'       },
];

/* ── ColorPicker — click color name swatches ── */
export function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2 mt-1">
        {PRESET_COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            type="button"
            title={name}
            onClick={() => onChange(hex)}
            className="relative w-7 h-7 rounded-full border-2 transition-all focus:outline-none flex-shrink-0"
            style={{
              backgroundColor: hex,
              borderColor: value === hex ? '#000' : 'transparent',
              boxShadow: value === hex ? `0 0 0 2px white, 0 0 0 4px ${hex}` : 'none',
            }}
          >
            {value === hex && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-400 mt-1.5">
          Selected: <span className="font-semibold text-gray-600">{PRESET_COLORS.find(c => c.hex === value)?.name ?? value}</span>
        </p>
      )}
    </div>
  );
}

/* ── CollapseCard ── */
export function CollapseCard({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
          {title}
          {badge != null && (
            <span className="text-xs bg-[#0a1f44]/10 text-[#0a1f44] px-2 py-0.5 rounded-full font-semibold">{badge}</span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ── BgTypePicker — color vs image switcher ── */
export function BgTypePicker({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {['color', 'image'].map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-xl border-2 text-xs font-bold capitalize transition-all
            ${value === t ? 'border-[#0a1f44] bg-[#0a1f44] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
        >
          {t === 'color' ? '🎨 Color' : '🖼 Image'}
        </button>
      ))}
    </div>
  );
}

/* ── ImageUploadZone ── */
export function ImageUploadZone({ label, preview, onFileChange, hint, aspect = '16/4', maxMB = 4 }) {
  const ref = useRef(null);
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileChange(file);
    e.target.value = '';
  };
  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-1.5 flex-shrink-0"
        >
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-[11px] text-gray-500 text-center leading-tight px-1">Click to upload<br/>PNG / WebP / JPG</span>
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        {preview && (
          <div className="rounded-xl overflow-hidden border border-gray-200 flex-1 min-w-[120px] max-w-[260px]">
            <img src={preview} alt="preview" className="w-full h-20 object-cover block" />
          </div>
        )}
      </div>
      {hint && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-2.5">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{hint}</p>
        </div>
      )}
    </div>
  );
}

/* ── BgPreview — live mini-preview of hero/cta card ── */
export function BgPreview({ bgType, bgColor, bgPreview, children }) {
  const style =
    bgType === 'image' && bgPreview
      ? { backgroundImage: `url(${bgPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: bgColor || '#0a1f44' };
  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="relative text-white text-center p-4" style={style}>
        {bgType === 'image' && bgPreview && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}