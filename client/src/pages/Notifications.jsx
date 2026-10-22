
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Megaphone,
  AlertCircle,
  BookOpen,
  CalendarDays,
  RefreshCw,
  ArrowLeft,
  Check,
  CheckCheck,
  Award,
  ExternalLink,
  Info,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/notifications';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState('');

  const [activeFilter, setActiveFilter] = useState('all');

const readCount = notifications.filter(
  (notification) => notification.isRead
).length;

const filteredNotifications = notifications.filter((notification) => {
  if (activeFilter === 'unread') {
    return !notification.isRead;
  }

  if (activeFilter === 'read') {
    return notification.isRead;
  }

  return true;
});

  const getToken = () => sessionStorage.getItem('skillsphereToken');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionError('');

    try {
      const token = getToken();

      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setError('Please log in to view your notifications.');
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load notifications.'
        );
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    setMarkingId(notificationId);
    setActionError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Please log in to continue.');
      }

      const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to mark notification as read.'
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setActionError(
        err.message || 'Could not update this notification.'
      );
    } finally {
      setMarkingId('');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    setActionError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Please log in to continue.');
      }

      const response = await fetch(`${API_URL}/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to mark all notifications as read.'
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setActionError(
        err.message || 'Could not update your notifications.'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={22} color="#0d9488" />;
      case 'course':
        return <BookOpen size={22} color="#2563eb" />;
      case 'completion':
        return <CheckCheck size={22} color="#16a34a" />;
      case 'certificate':
        return <Award size={22} color="#7c3aed" />;
      case 'important':
        return <AlertCircle size={22} color="#dc2626" />;
      default:
        return <Info size={22} color="#2563eb" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '';

    return parsedDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationLabel = (type) => {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'course':
        return 'Course Update';
      case 'completion':
        return 'Course Completed';
      case 'certificate':
        return 'Certificate';
      default:
        return 'System Update';
    }
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 20px 60px',
        color: '#1f2937',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          color: '#2563eb',
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <Bell size={30} color="#2563eb" />

            <h1 style={{ margin: 0, fontSize: '30px' }}>
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span
                style={{
                  minWidth: '24px',
                  height: '24px',
                  padding: '0 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '999px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>
            Stay updated with announcements, course progress, and
            certificates.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={markAllAsRead}
            disabled={loading || markingAll || unreadCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#374151',
              cursor:
                loading || markingAll || unreadCount === 0
                  ? 'not-allowed'
                  : 'pointer',
              opacity: unreadCount === 0 ? 0.6 : 1,
            }}
          >
            <CheckCheck size={16} />
            {markingAll ? 'Updating...' : 'Mark All as Read'}
          </button>

          <button
            onClick={fetchNotifications}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      
{!loading && !error && (
  <div style={{ marginBottom: '24px' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        color: '#6b7280',
        fontSize: '14px',
      }}
    >
      <span>
        {notifications.length}{' '}
        {notifications.length === 1
          ? 'notification'
          : 'notifications'}
      </span>

      <span>{unreadCount} unread</span>
    </div>

    <div
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      {[
        { id: 'all', label: 'All', count: notifications.length },
        { id: 'unread', label: 'Unread', count: unreadCount },
        { id: 'read', label: 'Read', count: readCount },
      ].map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            aria-pressed={isActive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: isActive
                ? '1px solid #2563eb'
                : '1px solid #d1d5db',
              borderRadius: '10px',
              background: isActive ? '#2563eb' : '#ffffff',
              color: isActive ? '#ffffff' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {filter.label}

            <span
              style={{
                minWidth: '22px',
                padding: '2px 6px',
                borderRadius: '999px',
                background: isActive ? '#ffffff' : '#f3f4f6',
                color: isActive ? '#2563eb' : '#4b5563',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  </div>
)}


      {actionError && (
        <div
          role="alert"
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          {actionError}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <RefreshCw
            size={28}
            style={{ marginBottom: '12px' }}
          />
          <p>Loading notifications...</p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '24px',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            background: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          <p>{error}</p>

          {!getToken() && (
            <Link
              to="/login"
              style={{
                color: '#2563eb',
                fontWeight: '600',
              }}
            >
              Go to Login
            </Link>
          )}

          <div style={{ marginTop: '12px' }}>
            <button
              onClick={fetchNotifications}
              style={{
                padding: '9px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            border: '1px dashed #d1d5db',
            borderRadius: '16px',
            background: '#f9fafb',
          }}
        >
          <Bell
            size={44}
            color="#9ca3af"
            style={{ marginBottom: '8px' }}
          />

          <h2>
            {activeFilter === 'unread'
              ? 'No unread notifications'
              : activeFilter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'}
          </h2>

          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
            {activeFilter === 'unread'
              ? "You're all caught up! You have no unread notifications."
              : activeFilter === 'read'
                ? 'No notifications have been marked as read yet.'
                : "New SkillSphere updates will appear here when notifications are created for your account."}
          </p>

          <button
            onClick={fetchNotifications}
            style={{
              marginTop: '10px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Refresh Notifications
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredNotifications.map((notification) => (
            <article
              key={notification._id}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '22px',
                border: notification.isRead
                  ? '1px solid #e5e7eb'
                  : '1px solid #bfdbfe',
                borderRadius: '14px',
                background: notification.isRead
                  ? '#ffffff'
                  : '#eff6ff',
                boxShadow: notification.isRead
                  ? '0 3px 12px rgba(0, 0, 0, 0.03)'
                  : '0 3px 12px rgba(37, 99, 235, 0.07)',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  background: notification.isRead
                    ? '#f3f4f6'
                    : '#dbeafe',
                }}
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '8px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '19px',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {notification.title}
                  </h2>

                  {!notification.isRead && (
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      New
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginBottom: '10px',
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  {getNotificationLabel(notification.type)}
                </div>

                <p
                  style={{
                    margin: '0 0 14px',
                    color: '#4b5563',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {notification.message}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    color: '#6b7280',
                    fontSize: '13px',
                  }}
                >
                  <CalendarDays size={15} />
                  <span>{formatDate(notification.createdAt)}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginTop: '16px',
                  }}
                >
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      disabled={markingId === notification._id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#1d4ed8',
                        cursor:
                          markingId === notification._id
                            ? 'not-allowed'
                            : 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      <Check size={15} />
                      {markingId === notification._id
                        ? 'Updating...'
                        : 'Mark as Read'}
                    </button>
                  )}

                  {notification.link &&
                    notification.link.startsWith('/') &&
                    !notification.link.startsWith('//') && (
                      <Link
                        to={notification.link}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification._id);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#2563eb',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}
                      >
                        Open
                        <ExternalLink size={15} />
                      </Link>
                    )}

                  {notification.isRead && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#16a34a',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <CheckCheck size={15} />
                      Read
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
