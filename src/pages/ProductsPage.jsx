import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, Search, SlidersHorizontal, ChevronRight, Check } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import api from "../utils/api";

const SORT_OPTIONS = [
  { label: "Newest First",      value: "-createdAt" },
  { label: "Price: Low → High", value: "price"      },
  { label: "Price: High → Low", value: "-price"     },
  { label: "Top Rated",         value: "-rating"    },
];

/* ── Shared portal hook ──────────────────────────────────────────────── */
function useDropdownPortal(open, setOpen, triggerRef, listRef) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = 256; // max-h-64
    const openUp     = spaceBelow < listHeight && rect.top > listHeight;
    setCoords({
      top:   openUp ? rect.top - listHeight - 4 : rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  // Compute coords when opening + close on page scroll, recompute on resize
  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (e) => {
      if (listRef.current && (listRef.current === e.target || listRef.current.contains(e.target))) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, setOpen, updateCoords, listRef]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        listRef.current    && !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen, triggerRef, listRef]);

  return coords;
}

/* ── Custom Dropdown ─────────────────────────────────────────────────── */
function CustomDropdown({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);
  const triggerRef      = useRef(null);
  const listRef         = useRef(null);
  const coords          = useDropdownPortal(open, setOpen, triggerRef, listRef);

  const selected = options.find(o => (o.value ?? o) === value);
  const label    = selected ? (selected.label ?? selected) : placeholder;

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: "fixed",
        top:      coords.top,
        left:     coords.left,
        width: coords.width,
minWidth: coords.width,
        zIndex:   99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto"
    >
      {options.map(o => {
        const val    = o.value ?? o;
        const lbl    = o.label ?? o;
        const active = val === value;
        return (
          <li
            key={val}
            role="option"
            aria-selected={active}
            onMouseDown={(e) => { e.preventDefault(); onChange(val); setOpen(false); }}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors
              ${active
                ? "bg-[#0a1f44] text-white"
                : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]"}
            `}
          >
            <span className="flex-1">{lbl}</span>
            {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2 w-full
          px-3 py-2 text-sm font-medium
          bg-white border border-gray-200 rounded-xl
          text-gray-700 hover:border-[#0a1f44] hover:text-[#0a1f44]
          transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a1f44]/20
          ${open ? "border-[#0a1f44] text-[#0a1f44]" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Sub-category dropdown (mobile) ─────────────────────────────────── */
function SubCategoryDropdown({ activeCat, activeSubs, subSlug, navigate }) {
  const [open, setOpen] = useState(false);
  const triggerRef      = useRef(null);
  const listRef         = useRef(null);
  const coords          = useDropdownPortal(open, setOpen, triggerRef, listRef);

  const activeLabel = subSlug
    ? (activeSubs.find(s => s.slug === subSlug)?.name || subSlug)
    : `All ${activeCat.name}`;

  const select = (slug) => {
    setOpen(false);
    if (!slug) navigate(`/products/category/${activeCat.slug}`);
    else       navigate(`/products/category/${activeCat.slug}?sub=${slug}`);
  };

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: "fixed",
        top:      coords.top,
        left:     coords.left,
       width: coords.width,
minWidth: coords.width,
        zIndex:   99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto"
    >
      <li
        role="option"
        aria-selected={!subSlug}
        onMouseDown={(e) => { e.preventDefault(); select(""); }}
        className={`
          flex items-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors
          ${!subSlug ? "bg-[#0a1f44] text-white" : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]"}
        `}
      >
        <span className="flex-1">All {activeCat.name}</span>
        {!subSlug && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
      </li>
      {activeSubs.map(sub => (
        <li
          key={sub.slug}
          role="option"
          aria-selected={subSlug === sub.slug}
          onMouseDown={(e) => { e.preventDefault(); select(sub.slug); }}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors
            ${subSlug === sub.slug ? "bg-[#0a1f44] text-white" : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]"}
          `}
        >
          <span className="flex-1">{sub.name}</span>
          {subSlug === sub.slug && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
        </li>
      ))}
    </ul>,
    document.body
  );

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2 w-full
          px-4 py-2.5 text-sm font-semibold
          bg-white border-2 rounded-xl transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#0a1f44]/20
          ${open ? "border-[#0a1f44] text-[#0a1f44]" : "border-gray-200 text-gray-700 hover:border-[#0a1f44] hover:text-[#0a1f44]"}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="card animate-pulse">
    <div className="bg-gray-200 h-44 rounded-t-2xl" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-8 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────── */
export default function ProductsPage({ auth, cartHook, wishlistHook, onSubPillsVisibilityChange }) {
  const { cat }  = useParams();
  const [sp]     = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = sp.get("search") || "";
  const subSlug     = sp.get("sub")    || "";

  const [sort,       setSort]       = useState("-createdAt");
  const [page,       setPage]       = useState(1);
  const [categories, setCategories] = useState([]);
  const [catsReady,  setCatsReady]  = useState(false);

  const { products, loading, pagination, fetchProducts } = useProducts();
  const observerRef = useRef(null);

  useEffect(() => {
    setCatsReady(false);
    api.get("/categories?nav=true")
      .then(({ data }) => {
        if (Array.isArray(data))
          setCategories([...data].sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99)));
      })
      .catch(() => {})
      .finally(() => setCatsReady(true));
  }, []);

  const activeCat  = catsReady && cat
    ? categories.find(c => c.slug === cat.toLowerCase()) || null
    : null;
  const activeSubs = (activeCat?.subCategories || []).filter(s => s.isActive !== false);

  useEffect(() => {
    if (!cat && onSubPillsVisibilityChange) onSubPillsVisibilityChange(true);
  }, [cat, onSubPillsVisibilityChange]);

  const subPillsRef = useCallback((el) => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (!el) { onSubPillsVisibilityChange?.(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => onSubPillsVisibilityChange?.(entry.isIntersecting),
      { threshold: 0, rootMargin: "-150px 0px 0px 0px" }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, [onSubPillsVisibilityChange]);

  useEffect(() => { setPage(1); }, [cat, subSlug, searchQuery, sort]);

  useEffect(() => {
    if (!catsReady) return;
    const params = { sort, page, limit: 20 };
    if (cat) {
      if (activeCat) { params.category = activeCat.name; params.categorySlug = activeCat.slug; }
      else           { params.category = cat;            params.categorySlug = cat; }
    }
    if (subSlug && activeSubs.length > 0) {
      const subObj = activeSubs.find(s => s.slug === subSlug);
      if (subObj) params.sub = subObj.name;
    }
    if (searchQuery) params.search = searchQuery;
    fetchProducts(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, subSlug, searchQuery, sort, page, catsReady, activeCat?.slug]);

  const pages = pagination?.pages || 1;

  const activeSubName = subSlug
    ? (activeSubs.find(s => s.slug === subSlug)?.name || subSlug)
    : "";

  const title = searchQuery
    ? `Results for "${searchQuery}"`
    : activeCat
      ? activeSubName ? `${activeCat.name} — ${activeSubName}` : activeCat.name
      : "All Parts";

  const Breadcrumb = () => {
    if (!activeCat && !searchQuery) return null;
    return (
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
        <button onClick={() => navigate("/products")} className="hover:text-[#0a1f44] transition-colors">
          All Parts
        </button>
        {activeCat && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <button
              onClick={() => navigate(`/products/category/${activeCat.slug}`)}
              className={`transition-colors ${!activeSubName ? "text-[#0a1f44] font-semibold" : "hover:text-[#0a1f44]"}`}>
              {activeCat.name}
            </button>
          </>
        )}
        {activeSubName && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <span className="text-[#0a1f44] font-semibold">{activeSubName}</span>
          </>
        )}
      </nav>
    );
  };

  return (
    <div className="page-wrapper min-h-screen">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} parts found</p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <CustomDropdown
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
            className="w-44"
          />
        </div>
      </div>

      {/* Sub-category filter */}
      {catsReady && activeSubs.length > 0 && (
        <div ref={subPillsRef} className="mb-6">

          {/* Mobile & Tablet — custom dropdown */}
          <div className="md:hidden">
            <SubCategoryDropdown
              activeCat={activeCat}
              activeSubs={activeSubs}
              subSlug={subSlug}
              navigate={navigate}
            />
          </div>

          {/* Desktop — pills */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/products/category/${activeCat.slug}`)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${!subSlug
                  ? "bg-[#0a1f44] text-white border-[#0a1f44]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#0a1f44] hover:text-[#0a1f44]"}`}>
              All {activeCat.name}
            </button>
            {activeSubs.map(sub => (
              <button key={sub.slug}
                onClick={() => navigate(`/products/category/${activeCat.slug}?sub=${sub.slug}`)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                  ${subSlug === sub.slug
                    ? "bg-[#0a1f44] text-white border-[#0a1f44]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#0a1f44] hover:text-[#0a1f44]"}`}>
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">No parts found</h2>
          <p className="text-gray-400 text-sm mb-5">
            {cat ? `No products listed under "${activeCat?.name || cat}" yet` : "Try a different search term"}
          </p>
          <button onClick={() => navigate("/products")} className="btn-primary">View All Parts</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(p => (
              <ProductCard key={p._id} product={p} auth={auth} cartHook={cartHook} wishlistHook={wishlistHook} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200">← Prev</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors
                    ${page === p ? "bg-[#0a1f44] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#de1c0e]"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(p + 1, pages))} disabled={page === pages}
                className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}