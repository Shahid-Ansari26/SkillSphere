import './Profile.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  Mail,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function Profile() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('skillsphereUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('skillsphereToken');

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!token) {
          throw new Error('Please log in to view your profile.');
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load profile.');
        }

        if (data.user) {
          setUser(data.user);
          sessionStorage.setItem(
            'skillsphereUser',
            JSON.stringify(data.user)
          );
        }

        const learningResponse = await fetch(
          `${API_URL}/enrollments/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (learningResponse.ok) {
          const learningData = await learningResponse.json();

          const enrollments = Array.isArray(learningData)
            ? learningData
            : learningData.enrollments || [];

          setEnrollmentCount(enrollments.length);
        }
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return (
    <main className="profile-page">
      <div className="profile-container">
        <Link to="/" className="profile-back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <header className="profile-heading">
          <div className="profile-heading-icon">
            <UserRound size={30} />
          </div>

          <div>
            <h1>My Profile</h1>
            <p>Manage and view your SkillSphere account details.</p>
          </div>
        </header>

        {loading ? (
          <div className="profile-status">
            <RefreshCw size={20} className="profile-spinner" />
            <p>Loading your profile...</p>
          </div>
        ) : error ? (
          <div className="profile-error">
            <p>{error}</p>
            <Link to="/login">Log In</Link>
          </div>
        ) : user ? (
          <>
            <section className="profile-card">
              <div className="profile-avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>

              <div className="profile-identity">
                <h2>{user.name || 'SkillSphere Student'}</h2>
                <p>{user.email || 'Email not available'}</p>

                <span className="profile-role">
                  <ShieldCheck size={15} />
                  {user.role || 'student'}
                </span>
              </div>
            </section>

            <section className="profile-details-card">
              <h2>Account Information</h2>

              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <UserRound size={20} />
                </div>
                <div>
                  <span>Full Name</span>
                  <strong>{user.name || 'Not available'}</strong>
                </div>
              </div>

              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <Mail size={20} />
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{user.email || 'Not available'}</strong>
                </div>
              </div>

              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span>Account Role</span>
                  <strong>{user.role || 'student'}</strong>
                </div>
              </div>
            </section>

            <section className="profile-stat-card">
              <div className="profile-stat-icon">
                <BookOpen size={24} />
              </div>
              <div>
                <span>My Enrollments</span>
                <strong>{enrollmentCount}</strong>
              </div>
              <Link to="/my-learning">View Learning</Link>
            </section>

            <div className="profile-note">
              <CalendarDays size={18} />
              <p>
                Your profile information is retrieved from your
                SkillSphere account.
              </p>
            </div>
          </>
        ) : (
          <div className="profile-error">
            <p>Profile information is unavailable.</p>
            <Link to="/login">Log In</Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default Profile;
