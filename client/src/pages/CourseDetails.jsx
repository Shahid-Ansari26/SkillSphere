
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  UserRound,
  IndianRupee,
} from 'lucide-react';
import CourseReviews from '../components/CourseReviews';

const API_URL = 'http://localhost:5000/api/courses';
const ENROLLMENT_URL = 'http://localhost:5000/api/enrollments';

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch course details.
  useEffect(() => {
    let cancelled = false;

    const fetchCourse = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/${id}`);

        if (!response.ok) {
          throw new Error('Course not found.');
        }

        const data = await response.json();

        if (!cancelled) {
          setCourse(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load course.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCourse();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Check whether the logged-in student is enrolled.
  useEffect(() => {
    let cancelled = false;

    const checkEnrollment = async () => {
      const currentToken = sessionStorage.getItem('skillsphereToken');

      if (!currentToken) {
        setIsEnrolled(false);
        return;
      }

      try {
        const response = await fetch(
          `${ENROLLMENT_URL}/check/${id}`,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          }
        );

        if (response.status === 401) {
          sessionStorage.removeItem('skillsphereToken');
          sessionStorage.removeItem('skillsphereUser');

          if (!cancelled) {
            setIsEnrolled(false);
          }

          return;
        }

        if (!response.ok) {
          throw new Error('Unable to check enrollment.');
        }

        const data = await response.json();

        if (!cancelled) {
          setIsEnrolled(data.isEnrolled);
        }
      } catch (err) {
        console.error(
          'Enrollment status check failed:',
          err.message
        );
      }
    };

    checkEnrollment();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Enroll in the course.
  const handleEnroll = async () => {
    setEnrollmentMessage('');
    setEnrollmentError('');

    const currentToken = sessionStorage.getItem('skillsphereToken');

    if (!currentToken) {
      navigate('/login');
      return;
    }

    setEnrolling(true);

    try {
      const response = await fetch(`${ENROLLMENT_URL}/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem('skillsphereToken');
        sessionStorage.removeItem('skillsphereUser');

        setEnrollmentError(
          'Your session expired. Please log in again.'
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to enroll in this course.'
        );
      }

      setIsEnrolled(true);
      setEnrollmentMessage(
        'Successfully enrolled! Opening My Learning...'
      );

      setTimeout(() => {
        navigate('/my-learning');
      }, 1000);
    } catch (err) {
      setEnrollmentError(
        err.message || 'Unable to connect to the server.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <p className="details-message">
        Loading course details...
      </p>
    );
  }

  if (error || !course) {
    return (
      <div className="details-message">
        <p>{error || 'Course not found.'}</p>
        <Link to="/">← Back to courses</Link>
      </div>
    );
  }

  return (
    <main className="course-details-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} />
        Back to courses
      </Link>

      {/* Course information and enrollment */}
      <section className="details-card">
        <span className="details-category">
          {course.category}
        </span>

        <h1>{course.title}</h1>

        <p className="details-description">
          {course.description}
        </p>

        <div className="details-info">
          <p>
            <UserRound size={19} />
            Instructor: {course.instructor}
          </p>

          <p>
            <Clock size={19} />
            Duration: {course.duration}
          </p>

          <p>
            <BookOpen size={19} />
            Level: {course.level}
          </p>

          <p>
            <IndianRupee size={19} />
            Price: ₹{course.price}
          </p>
        </div>

        {enrollmentMessage && (
          <p role="status" style={{ color: 'green' }}>
            {enrollmentMessage}
          </p>
        )}

        {enrollmentError && (
          <p role="alert" style={{ color: 'red' }}>
            {enrollmentError}
          </p>
        )}

        {isEnrolled ? (
          <button
            type="button"
            className="enroll-button"
            onClick={() => navigate(`/courses/${id}/learn`)}
          >
            Start Learning →
          </button>
        ) : (
          <button
            type="button"
            className="enroll-button"
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        )}
      </section>

      {/* Reusable student reviews component */}
      <CourseReviews courseId={id} />
    </main>
  );
}

export default CourseDetails;
