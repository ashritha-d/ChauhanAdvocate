import { getVideoStreamToken } from '../api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// A video is playable if it's either an external link (YouTube/Vimeo/Drive/direct
// URL, exposed as-is) or an admin-uploaded file (never exposed directly — only
// resolvable through a streaming token). Used for sync checks like sidebar lock
// icons, where fetching an actual token would be wasteful.
export function isVideoPlayable(video) {
  return !!(video?.videoUrl || video?.hasUpload);
}

// Resolves an actual <video>/<iframe> source. External links resolve instantly;
// an uploaded video requires a short-lived streaming token fetched fresh each time
// (the raw Cloudinary URL is never sent to the frontend at all — see
// backend/controllers/courseController.js's getVideoAccessToken/streamVideo).
export async function resolveVideoSrc(video, courseId, headers = {}) {
  if (!video) return null;
  if (video.videoUrl) return video.videoUrl;
  if (video.hasUpload) {
    try {
      const r = await getVideoStreamToken(courseId, video._id, headers);
      if (!r.data.success) throw new Error(r.data.message || 'Could not load this video.');
      return API_BASE + r.data.streamUrl;
    } catch (err) {
      // axios rejects on non-2xx responses (403 unenrolled/expired, 401, etc.) —
      // the actual reason lives in the response body, not err.message.
      throw new Error(err.response?.data?.message || err.message || 'Could not load this video.');
    }
  }
  return null;
}
