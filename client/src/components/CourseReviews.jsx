import './CourseReviews.css';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/reviews';

function CourseReviews({ courseId }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('skillsphereUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const token = sessionStorage.getItem('skillsphereToken');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/course/${courseId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load reviews.');
      }

      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (err) {
      setError(err.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const ownsReview = (review) =>
    loggedInUser &&
    String(review.student?._id || review.student) ===
      String(loggedInUser._id || loggedInUser.id);

  const startEditing = (review) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setMessage('');
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment('');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Please log in to submit a review.');
      return;
    }

    if (comment.trim().length < 3) {
      setError('Your review must contain at least 3 characters.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/course/${courseId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review.');
      }

      setComment('');
      setRating(5);
      setMessage('Your review was submitted successfully.');
      await fetchReviews();
    } catch (err) {
      setError(err.message || 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReview = async (event, reviewId) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (editComment.trim().length < 3) {
      setError('Your review must contain at least 3 characters.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update review.');
      }

      cancelEditing();
      setMessage('Your review was updated successfully.');
      await fetchReviews();
    } catch (err) {
      setError(err.message || 'Unable to update review.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your review?'
    );

    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete review.');
      }

      setMessage('Your review was deleted successfully.');
      await fetchReviews();
    } catch (err) {
      setError(err.message || 'Unable to delete review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value, interactive = false, onSelect = null) => (
    <div className="course-review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={
            star <= value
              ? 'course-review-star selected'
              : 'course-review-star'
          }
          onClick={interactive ? () => onSelect(star) : undefined}
          disabled={!interactive || submitting}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          title={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={interactive ? 25 : 17}
            fill={star <= value ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );

  const alreadyReviewed = reviews.some(ownsReview);

  return (
    <section className="course-reviews" aria-labelledby="course-reviews-title">
      <header className="course-reviews-header">
        <div>
          <h2 id="course-reviews-title">Student Reviews</h2>
          <p>Feedback from learners in the SkillSphere community.</p>
        </div>

        <button
          type="button"
          className="course-reviews-refresh"
          onClick={fetchReviews}
          disabled={loading}
          aria-label="Refresh reviews"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      <div className="course-reviews-summary">
        <div className="course-reviews-average">
          <strong>{averageRating.toFixed(1)}</strong>
          {renderStars(Math.round(averageRating))}
          <span>
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {error && (
        <div className="course-reviews-alert error" role="alert">
          {error}
          {!token && (
            <>
              {' '}
              <Link to="/login">Log in</Link>
            </>
          )}
        </div>
      )}

      {message && (
        <div className="course-reviews-alert success" role="status">
          {message}
        </div>
      )}

      {!alreadyReviewed && token && (
        <form className="course-review-form" onSubmit={submitReview}>
          <h3>Write a Review</h3>
          <label className="course-review-label">Your rating</label>
          {renderStars(rating, true, setRating)}
          <label className="course-review-label" htmlFor={`review-comment-${courseId}`}>
            Your feedback
          </label>
          <textarea
            id={`review-comment-${courseId}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What did you think about this course?"
            minLength={3}
            maxLength={1000}
            rows={4}
            required
          />
          <div className="course-review-form-footer">
            <span>{comment.length}/1000 characters</span>
            <button type="submit" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {!token && (
        <p className="course-review-login">
          <Link to="/login">Log in</Link> to share your course review.
        </p>
      )}

      <div className="course-review-list">
        {loading ? (
          <p className="course-reviews-empty">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="course-reviews-empty">
            <MessageSquare size={30} />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <article className="course-review-card" key={review._id}>
              <div className="course-review-card-header">
                <div className="course-review-avatar">
                  {(review.student?.name || 'S').charAt(0).toUpperCase()}
                </div>

                <div className="course-review-author">
                  <strong>{review.student?.name || 'Student'}</strong>
                  {renderStars(review.rating)}
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </div>

                {ownsReview(review) && editingId !== review._id && (
                  <div className="course-review-actions">
                    <button
                      type="button"
                      onClick={() => startEditing(review)}
                      disabled={submitting}
                      aria-label="Edit your review"
                      title="Edit review"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReview(review._id)}
                      disabled={submitting}
                      aria-label="Delete your review"
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {editingId === review._id ? (
                <form
                  className="course-review-edit-form"
                  onSubmit={(event) => updateReview(event, review._id)}
                >
                  {renderStars(editRating, true, setEditRating)}
                  <textarea
                    value={editComment}
                    onChange={(event) => setEditComment(event.target.value)}
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                    required
                  />
                  <div className="course-review-form-footer">
                    <span>{editComment.length}/1000 characters</span>
                    <div className="course-review-edit-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={cancelEditing}
                        disabled={submitting}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="course-review-comment">{review.comment}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default CourseReviews;
