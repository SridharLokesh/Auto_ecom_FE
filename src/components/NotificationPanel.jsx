import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, CheckCheck, ShoppingBag, Tag, Truck,
  Package, AlertTriangle, Users, Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';

const TYPE_CONFIG = {
  order_status:   { icon: ShoppingBag,   red: false },
  best_deal:      { icon: Tag,           red: true  },
  new_arrival:    { icon: Package,       red: false },
  discount:       { icon: Tag,           red: true  },
  new_order:      { icon: ShoppingBag,   red: false },
  return_request: { icon: Truck,         red: true  },
  low_stock:      { icon: AlertTriangle, red: true  },
  dealer_request: { icon: Users,         red: false },
  complaint:      { icon: AlertTriangle, red: true  },
  new_user:       { icon: Users,         red: false },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifList({ notifications, markRead, deleteNotif, onClose, navigate }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-14">
        <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
      </div>
    );
  }

  const handleRowClick = (notif) => {
    markRead(notif._id);
    if (notif.link) navigate(notif.link);
    onClose();
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotif(id);
  };

  return notifications.map((notif) => {
    const cfg       = TYPE_CONFIG[notif.type] || TYPE_CONFIG.order_status;
    const Icon      = cfg.icon;
    const iconBg    = cfg.red ? '#fde8e7' : '#e8edf5';
    const iconColor = cfg.red ? '#de1c0e' : '#0a1f44';

    return (
      <div
        key={notif._id}
        className={[
          'flex gap-3 px-4 py-3 border-b border-gray-50 transition-colors',
          !notif.isRead ? 'bg-[#e8edf5]/40' : 'bg-white',
        ].join(' ')}
      >
        {/* Clickable area */}
        <button
          type="button"
          onClick={() => handleRowClick(notif)}
          className="flex gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: iconBg }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm text-gray-900 ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
              {notif.title}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
          </div>
        </button>

        {/* Right column — unread dot + delete */}
        <div className="flex flex-col items-center justify-between flex-shrink-0 py-0.5">
          {!notif.isRead
            ? <div className="w-2 h-2 rounded-full" style={{ background: '#0a1f44' }} />
            : <div className="w-2 h-2" />
          }
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDelete(e, notif._id)}
            aria-label="Delete notification"
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50
                       active:scale-95 transition-all touch-manipulation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  });
}

function PanelHeader({ unreadCount, markAllRead, onClose }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
      style={{ background: '#0a1f44' }}
    >
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4" />
        <span className="font-bold text-sm">Notifications</span>
        {unreadCount > 0 && (
          <span
            className="text-white text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: '#de1c0e' }}
          >
            {unreadCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs text-blue-200 hover:text-white flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationPanel({
  notifications, unreadCount, markRead, markAllRead, deleteNotif, onClose,
}) {
  const navigate   = useNavigate();
  const desktopRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (desktopRef.current && !desktopRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const listProps = { notifications, markRead, deleteNotif, onClose, navigate };

  return (
    <>
      {/* ── MOBILE: full screen top-anchored panel ── */}
      {createPortal(
        <div className="md:hidden">
          {/* Full screen white backdrop — tap anywhere outside list to close */}
          <div className="fixed inset-0 bg-white z-[9998]" onClick={onClose} />

          {/* Panel pinned to top, full width, white background */}
          <div
            className="fixed left-0 right-0 top-16 z-[9999] bg-white flex flex-col overflow-hidden"
            style={{
              maxHeight: '85dvh',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              animation: 'notifSlideDown .25s cubic-bezier(.32,1,.23,1)',
            }}
          >
            <PanelHeader
              unreadCount={unreadCount}
              markAllRead={markAllRead}
              onClose={onClose}
            />
            <div className="overflow-y-auto flex-1 overscroll-contain bg-white">
              <NotifList {...listProps} />
            </div>
          </div>

          <style>{`
            @keyframes notifSlideDown {
              from { transform: translateY(-100%); opacity: 0; }
              to   { transform: translateY(0);     opacity: 1; }
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* ── DESKTOP: anchored popover ── */}
      <div
        ref={desktopRef}
        className="hidden md:block absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl
                   shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
        style={{ zIndex: 9999 }}
      >
        <PanelHeader
          unreadCount={unreadCount}
          markAllRead={markAllRead}
          onClose={onClose}
        />
        <div className="max-h-[420px] overflow-y-auto">
          <NotifList {...listProps} />
        </div>
      </div>
    </>
  );
}