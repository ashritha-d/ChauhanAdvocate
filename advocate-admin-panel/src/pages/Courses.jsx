import { useEffect, useRef, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

const MEDIA_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace('/api', '');
const VIDEO_ACCEPT = '.mp4,.mov,.avi,.webm,.mkv,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska';
const MAX_VIDEO_MB = parseInt(import.meta.env.VITE_MAX_VIDEO_MB) || 500;
const ALLOWED_EXTS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];

const EMPTY_COURSE = {
  title: '', shortDescription: '', description: '', price: 0, discountPrice: 0,
  instructor: '', duration: '', category: '', level: 'beginner', language: 'Telugu / English',
  status: 'available', sortOrder: 0, programType: 'training', banner: '',
  validityDays: 365, enrollmentLimit: 0, resources: [],
  isActive: true, isFeatured: false, certificate: false, modules: [],
};
const EMPTY_MODULE = { title: '', order: 0, videos: [] };
const EMPTY_VIDEO = {
  title: '', description: '', videoSourceType: 'url', videoUrl: '',
  uploadedVideoPath: '', videoSize: '', thumbnailUrl: '',
  duration: '', isPreview: false, isPublished: true, order: 0,
};
const EMPTY_RESOURCE = { title: '', type: 'study_material', fileUrl: '', order: 0 };
const PROGRAM_LABELS = {
  internship: 'Internship',
  training: 'Training',
  judiciary: 'Judiciary Prep',
};
const RESOURCE_TYPES = [
  { value: 'study_material', label: 'Study Material' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'previous_paper', label: 'Previous Paper' },
  { value: 'mock_test', label: 'Mock Test' },
];

// ── Client-side thumbnail from local video file ───────────────────────────────
async function generateVideoThumbnail(file) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.addEventListener('loadeddata', () => { video.currentTime = 1; });
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 180;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 180);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch { resolve(''); }
      cleanup();
    });
    video.addEventListener('error', () => { resolve(''); cleanup(); });
    video.load();
  });
}

function isValidVideoUrl(url) {
  return /^https?:\/\//i.test(url.trim());
}

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m?.[1] ?? null;
}

function getVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

function getDriveId(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return m?.[1] ?? null;
}

// Free, no-API-key YouTube thumbnail — used to auto-fill thumbnailUrl for pasted YouTube links.
function autoThumbnailForUrl(url) {
  const yt = getYouTubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : '';
}

// Renders a video (URL or uploaded path) for the admin "Preview" modal — same
// YouTube/Vimeo/Drive/MP4 branching used by the student player, kept local since
// this admin app shares no package with advocate-user-website.
function renderVideoEmbed(url) {
  if (!url) return null;
  const yt = getYouTubeId(url);
  if (yt) return <iframe src={`https://www.youtube.com/embed/${yt}?rel=0&autoplay=1`} title="Preview" allowFullScreen allow="autoplay; encrypted-media" style={{ width: '100%', height: '100%', border: 0 }} />;
  const vimeo = getVimeoId(url);
  if (vimeo) return <iframe src={`https://player.vimeo.com/video/${vimeo}?autoplay=1`} title="Preview" allowFullScreen allow="autoplay; encrypted-media" style={{ width: '100%', height: '100%', border: 0 }} />;
  const drive = getDriveId(url);
  if (drive) return <iframe src={`https://drive.google.com/file/d/${drive}/preview`} title="Preview" allowFullScreen allow="autoplay" style={{ width: '100%', height: '100%', border: 0 }} />;
  return <video controls autoPlay src={url} style={{ width: '100%', height: '100%', background: '#000' }} />;
}

// Uploads a captured thumbnail frame (or any image blob) via the existing generic
// image-upload endpoint — same one already used for course resource files.
async function uploadThumbnailBlob(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.append('file', blob, 'thumbnail.jpg');
    const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data.url || '';
  } catch { return ''; }
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

// ── Video Upload Zone ─────────────────────────────────────────────────────────
function VideoUploadZone({ videoPath, videoSize, onUploaded, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [localThumb, setLocalThumb] = useState('');
  const fileRef = useRef();

  const handleFile = async file => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported format ".${ext}". Allowed: MP4, MOV, AVI, WEBM, MKV`);
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setError(''); setUploading(true); setProgress(0);

    const thumb = await generateVideoThumbnail(file);
    if (thumb) setLocalThumb(thumb);

    try {
      const fd = new FormData();
      fd.append('video', file);
      const r = await api.post('/courses/upload-video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: evt => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
        timeout: 0, // disable timeout for large files
      });
      // Persist the captured frame as a real Cloudinary image — best-effort, doesn't block the video
      const thumbnailUrl = thumb ? await uploadThumbnailBlob(thumb) : '';
      onUploaded({ path: r.data.path, size: r.data.size, thumbnailUrl });
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed. Please try again.');
      setLocalThumb('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleReplace = () => {
    onRemove();
    setLocalThumb('');
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const resolvedVideoUrl = videoPath
    ? (videoPath.startsWith('http') ? videoPath : MEDIA_BASE + videoPath)
    : '';
  const thumbSrc = localThumb || resolvedVideoUrl;
  const filename = videoPath ? videoPath.split('/').pop() : '';

  // ── Uploaded state ──
  if (videoPath && !uploading) {
    return (
      <div className="border rounded p-2" style={{ background: '#f0fdf4' }}>
        <div className="d-flex align-items-center gap-2">
          {thumbSrc
            ? <img src={thumbSrc} alt="thumb" style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
            : <div style={{ width: 72, height: 40, background: '#d1fae5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-film text-success"></i>
              </div>
          }
          <div className="flex-grow-1 overflow-hidden">
            <div className="small fw-semibold text-truncate text-success">
              <i className="fas fa-check-circle me-1"></i>{filename}
            </div>
            {videoSize && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{videoSize}</div>}
          </div>
          <div className="d-flex gap-1 flex-shrink-0">
            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={handleReplace} title="Replace video">
              <i className="fas fa-sync-alt"></i>
            </button>
            <button type="button" className="btn btn-xs btn-outline-danger" onClick={onRemove} title="Delete video">
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <input type="file" ref={fileRef} accept={VIDEO_ACCEPT} className="d-none"
          onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f); }} />
      </div>
    );
  }

  // ── Upload zone ──
  return (
    <div>
      <div
        className={`border rounded p-3 text-center ${dragOver ? 'border-primary' : ''}`}
        style={{
          borderStyle: 'dashed', cursor: uploading ? 'default' : 'pointer',
          background: dragOver ? 'rgba(13,110,253,0.05)' : '#fafafa',
          transition: 'all 0.15s', minHeight: 80,
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <div className="py-1">
            <div className="small text-muted mb-2">
              <i className="fas fa-spinner fa-spin me-1"></i>Uploading... {progress}%
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                style={{ width: `${progress}%`, transition: 'width 0.3s' }}
              />
            </div>
          </div>
        ) : (
          <>
            <i className="fas fa-cloud-upload-alt fa-lg text-muted mb-1" style={{ display: 'block' }}></i>
            <div className="small text-muted">
              Drag & drop or <span className="text-primary fw-semibold">Choose Video</span>
            </div>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
              MP4, MOV, AVI, WEBM, MKV &nbsp;·&nbsp; Max {MAX_VIDEO_MB} MB
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="text-danger small mt-1">
          <i className="fas fa-exclamation-triangle me-1"></i>{error}
        </div>
      )}
      <input type="file" ref={fileRef} accept={VIDEO_ACCEPT} className="d-none"
        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Bulk Video Upload Zone — independent per-file requests, so one failure doesn't
// block the rest and each file gets its own progress bar ──────────────────────
function BulkVideoUploadZone({ onUploaded }) {
  const [items, setItems] = useState([]); // [{ name, progress, status: 'uploading'|'done'|'error', error }]
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const uploading = items.some(it => it.status === 'uploading');

  const uploadOne = async (file, idx) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setItems(list => list.map((it, i) => i === idx ? { ...it, status: 'error', error: `Unsupported format ".${ext}"` } : it));
      return null;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setItems(list => list.map((it, i) => i === idx ? { ...it, status: 'error', error: `Exceeds ${MAX_VIDEO_MB} MB` } : it));
      return null;
    }
    try {
      const thumb = await generateVideoThumbnail(file);
      const fd = new FormData();
      fd.append('video', file);
      const r = await api.post('/courses/upload-video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: evt => {
          if (evt.total) {
            const progress = Math.round((evt.loaded / evt.total) * 100);
            setItems(list => list.map((it, i) => i === idx ? { ...it, progress } : it));
          }
        },
        timeout: 0,
      });
      const thumbnailUrl = thumb ? await uploadThumbnailBlob(thumb) : '';
      setItems(list => list.map((it, i) => i === idx ? { ...it, status: 'done', progress: 100 } : it));
      return { path: r.data.path, size: r.data.size, thumbnailUrl, originalName: file.name };
    } catch (e) {
      setItems(list => list.map((it, i) => i === idx ? { ...it, status: 'error', error: e.response?.data?.message || 'Upload failed' } : it));
      return null;
    }
  };

  const handleFiles = async fileList => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setItems(files.map(f => ({ name: f.name, progress: 0, status: 'uploading', error: '' })));
    const results = await Promise.allSettled(files.map((f, i) => uploadOne(f, i)));
    const uploaded = results
      .map(r => (r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean);
    if (uploaded.length > 0) onUploaded(uploaded);
  };

  return (
    <div>
      <div
        className={`border rounded p-3 text-center ${dragOver ? 'border-primary' : ''}`}
        style={{ borderStyle: 'dashed', cursor: uploading ? 'default' : 'pointer', background: dragOver ? 'rgba(13,110,253,0.05)' : '#fafafa', minHeight: 70 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (!uploading) handleFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {items.length === 0 ? (
          <>
            <i className="fas fa-layer-group fa-lg text-muted mb-1" style={{ display: 'block' }}></i>
            <div className="small text-muted">Drag &amp; drop multiple videos, or <span className="text-primary fw-semibold">choose files</span></div>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>One entry per file &nbsp;·&nbsp; Max {MAX_VIDEO_MB} MB each</div>
          </>
        ) : (
          <div className="text-start">
            {items.map((it, i) => (
              <div key={i} className="mb-1">
                <div className="d-flex justify-content-between small">
                  <span className="text-truncate" style={{ maxWidth: 220 }}>
                    {it.status === 'done' && <i className="fas fa-check-circle text-success me-1"></i>}
                    {it.status === 'error' && <i className="fas fa-times-circle text-danger me-1"></i>}
                    {it.status === 'uploading' && <i className="fas fa-spinner fa-spin me-1"></i>}
                    {it.name}
                  </span>
                  <span className={it.status === 'error' ? 'text-danger' : 'text-muted'}>
                    {it.status === 'error' ? it.error : `${it.progress}%`}
                  </span>
                </div>
                <div className="progress" style={{ height: 4 }}>
                  <div
                    className={`progress-bar ${it.status === 'error' ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${it.status === 'error' ? 100 : it.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {!uploading && (
              <button type="button" className="btn btn-xs btn-outline-secondary mt-2" onClick={() => setItems([])}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      <input type="file" multiple ref={fileRef} accept={VIDEO_ACCEPT} className="d-none"
        onChange={e => {
          // Snapshot into a real array first — e.target.files is a *live* FileList,
          // so clearing e.target.value below would empty it before handleFiles runs.
          const files = [...e.target.files];
          e.target.value = '';
          handleFiles(files);
        }} />
    </div>
  );
}

// ── Paste multiple video URLs (one per line) — a lightweight "playlist import" ──
function BulkUrlAdder({ onAdd }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [skipped, setSkipped] = useState(0);

  if (!open) {
    return (
      <button type="button" className="btn btn-xs btn-outline-secondary mt-2" onClick={() => setOpen(true)}>
        <i className="fas fa-link me-1"></i>Paste Multiple URLs
      </button>
    );
  }

  const handleAdd = () => {
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const valid = lines.filter(isValidVideoUrl);
    const invalidCount = lines.length - valid.length;
    if (valid.length > 0) onAdd(valid.join('\n'));
    if (invalidCount > 0) {
      setSkipped(invalidCount);
      return; // let the admin see the warning before closing
    }
    setText(''); setOpen(false); setSkipped(0);
  };

  return (
    <div className="mt-2">
      <textarea
        className="form-control form-control-sm"
        rows={3}
        placeholder={'One video URL per line\nhttps://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...'}
        value={text}
        onChange={e => { setText(e.target.value); setSkipped(0); }}
      />
      {skipped > 0 && (
        <div className="text-danger small mt-1">
          <i className="fas fa-exclamation-triangle me-1"></i>
          Skipped {skipped} invalid line{skipped > 1 ? 's' : ''} (must start with http:// or https://).
        </div>
      )}
      <div className="d-flex gap-2 mt-1">
        <button type="button" className="btn btn-xs btn-primary" onClick={handleAdd}>
          <i className="fas fa-plus me-1"></i>Add Videos
        </button>
        <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => { setText(''); setOpen(false); setSkipped(0); }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('courses');
  const [editCourse, setEditCourse] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enrolFilter, setEnrolFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewProgress, setViewProgress] = useState(null);
  const [scoreForm, setScoreForm] = useState({ title: '', score: '', maxScore: '' });
  const [savingScore, setSavingScore] = useState(false);
  const [toast, setToast] = useState(null);
  const [contentSearch, setContentSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [collapsedModules, setCollapsedModules] = useState(() => new Set());
  const [previewVideo, setPreviewVideo] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Track video paths uploaded in this editing session — clean up on cancel
  const stagedUploads = useRef([]);
  const dragModuleFrom = useRef(null);
  const dragVideoFrom = useRef(null); // { mi, vi }

  const loadCourses = () => {
    setLoading(true);
    api.get('/courses').then(r => { setCourses(r.data.data || []); }).catch(() => {}).finally(() => setLoading(false));
  };

  const loadEnrollments = () => {
    setLoading(true);
    const q = enrolFilter ? `?status=${enrolFilter}` : '';
    api.get(`/courses/enrollments/all${q}`).then(r => setEnrollments(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { if (view === 'courses') loadCourses(); else loadEnrollments(); }, [view, enrolFilter]);
  usePolling(() => { if (view === 'courses') loadCourses(); else loadEnrollments(); }, 30000);

  const openEdit = course => {
    stagedUploads.current = [];
    setEditCourse({ ...course });
    setContentSearch('');
    setModuleFilter('all');
    // Collapse every module by default for courses that already have more than a
    // couple of them, so opening a large course doesn't dump a wall of forms.
    setCollapsedModules(new Set((course.modules?.length > 2 ? course.modules : []).map((_, i) => i)));
  };

  const handleCancel = async () => {
    // Delete any video files uploaded during this session that won't be saved
    for (const filePath of stagedUploads.current) {
      const filename = filePath.split('/').pop();
      try { await api.delete(`/courses/delete-video/${filename}`); } catch {}
    }
    stagedUploads.current = [];
    setEditCourse(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editCourse._id) {
        await api.put(`/courses/${editCourse._id}`, editCourse);
      } else {
        await api.post('/courses', editCourse);
      }
      stagedUploads.current = []; // saved — no cleanup needed
      setEditCourse(null);
      loadCourses();
      showToast('Course saved successfully.');
    } catch (e) { showToast(e.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${confirmDelete}`);
      setConfirmDelete(null);
      loadCourses();
      showToast('Course deleted.');
    } catch (e) {
      showToast(e.response?.data?.message || 'Delete failed', 'error');
    }
    setDeleting(false);
  };

  const handleEnrollStatus = async (id, status) => {
    try { await api.put(`/courses/enrollments/${id}`, { paymentStatus: status }); loadEnrollments(); } catch {}
  };

  const handleAddTestScore = async () => {
    if (!scoreForm.title || scoreForm.score === '' || scoreForm.maxScore === '') return;
    setSavingScore(true);
    try {
      const r = await api.post(`/courses/enrollments/${viewProgress._id}/test-scores`, {
        title: scoreForm.title, score: Number(scoreForm.score), maxScore: Number(scoreForm.maxScore),
      });
      // Response's courseId isn't populated — merge just the updated testScores in,
      // keeping the already-populated course data we already have.
      setViewProgress(v => ({ ...v, testScores: r.data.data.testScores }));
      setScoreForm({ title: '', score: '', maxScore: '' });
      loadEnrollments();
      showToast('Test score added.');
    } catch { showToast('Failed to add test score', 'error'); }
    setSavingScore(false);
  };

  const setField = (k, v) => setEditCourse(c => ({ ...c, [k]: v }));

  const addModule = () => setEditCourse(c => ({
    ...c,
    modules: [...(c.modules || []), { ...EMPTY_MODULE, order: c.modules?.length || 0 }],
  }));

  const removeModule = i => setEditCourse(c => ({
    ...c,
    modules: c.modules.filter((_, idx) => idx !== i),
  }));

  const toggleModuleCollapsed = i => setCollapsedModules(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  // Drag-and-drop reorder — persists on the next "Save Course" click, same as every
  // other edit in this modal (no dedicated reorder endpoint needed).
  const moveModule = (from, to) => setEditCourse(c => {
    if (from === to) return c;
    const modules = [...c.modules];
    const [moved] = modules.splice(from, 1);
    modules.splice(to, 0, moved);
    modules.forEach((m, i) => { m.order = i; });
    return { ...c, modules };
  });

  const moveVideoInModule = (mi, from, to) => setEditCourse(c => {
    if (from === to) return c;
    const modules = [...c.modules];
    const videos = [...modules[mi].videos];
    const [moved] = videos.splice(from, 1);
    videos.splice(to, 0, moved);
    videos.forEach((v, i) => { v.order = i; });
    modules[mi] = { ...modules[mi], videos };
    return { ...c, modules };
  });

  const setModuleField = (i, k, v) => setEditCourse(c => {
    const modules = [...c.modules];
    modules[i] = { ...modules[i], [k]: v };
    return { ...c, modules };
  });

  const addVideo = mi => setEditCourse(c => {
    const modules = [...c.modules];
    modules[mi] = {
      ...modules[mi],
      videos: [...(modules[mi].videos || []), { ...EMPTY_VIDEO, order: modules[mi].videos?.length || 0 }],
    };
    return { ...c, modules };
  });

  const removeVideo = (mi, vi) => setEditCourse(c => {
    const modules = [...c.modules];
    const video = modules[mi].videos[vi];
    // Delete the uploaded file if it exists
    if (video?.uploadedVideoPath) {
      const filename = video.uploadedVideoPath.split('/').pop();
      api.delete(`/courses/delete-video/${filename}`).catch(() => {});
      stagedUploads.current = stagedUploads.current.filter(p => p !== video.uploadedVideoPath);
    }
    modules[mi] = { ...modules[mi], videos: modules[mi].videos.filter((_, idx) => idx !== vi) };
    return { ...c, modules };
  });

  const setVideoFields = (mi, vi, fields) => setEditCourse(c => {
    const modules = [...c.modules];
    const videos = [...modules[mi].videos];
    videos[vi] = { ...videos[vi], ...fields };
    modules[mi] = { ...modules[mi], videos };
    return { ...c, modules };
  });

  const handleVideoUploaded = (mi, vi, currentPath, { path: newPath, size, thumbnailUrl }) => {
    // If replacing an existing upload, delete the old file
    if (currentPath) {
      const oldFilename = currentPath.split('/').pop();
      api.delete(`/courses/delete-video/${oldFilename}`).catch(() => {});
      stagedUploads.current = stagedUploads.current.filter(p => p !== currentPath);
    }
    stagedUploads.current.push(newPath);
    setVideoFields(mi, vi, { uploadedVideoPath: newPath, videoSize: size, ...(thumbnailUrl ? { thumbnailUrl } : {}) });
  };

  const handleVideoRemoved = (mi, vi, currentPath) => {
    if (currentPath) {
      const filename = currentPath.split('/').pop();
      api.delete(`/courses/delete-video/${filename}`).catch(() => {});
      stagedUploads.current = stagedUploads.current.filter(p => p !== currentPath);
    }
    setVideoFields(mi, vi, { uploadedVideoPath: '', videoSize: '' });
  };

  // Bulk add — one video entry per uploaded file
  const handleBulkVideosUploaded = (mi, files) => {
    setEditCourse(c => {
      const modules = [...c.modules];
      const existing = modules[mi].videos || [];
      const newVideos = files.map((f, idx) => ({
        ...EMPTY_VIDEO,
        title: f.originalName?.replace(/\.[^.]+$/, '') || `Video ${existing.length + idx + 1}`,
        videoSourceType: 'upload',
        uploadedVideoPath: f.path,
        videoSize: f.size,
        thumbnailUrl: f.thumbnailUrl || '',
        order: existing.length + idx,
      }));
      files.forEach(f => stagedUploads.current.push(f.path));
      modules[mi] = { ...modules[mi], videos: [...existing, ...newVideos] };
      return { ...c, modules };
    });
  };

  // Bulk add — one video entry per pasted URL (one per line)
  const handleBulkUrlsAdd = (mi, text) => {
    const urls = text.split('\n').map(s => s.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setEditCourse(c => {
      const modules = [...c.modules];
      const existing = modules[mi].videos || [];
      const newVideos = urls.map((url, idx) => ({
        ...EMPTY_VIDEO,
        title: `Video ${existing.length + idx + 1}`,
        videoSourceType: 'url',
        videoUrl: url,
        thumbnailUrl: autoThumbnailForUrl(url),
        order: existing.length + idx,
      }));
      modules[mi] = { ...modules[mi], videos: [...existing, ...newVideos] };
      return { ...c, modules };
    });
  };

  // ── Resources (study materials / assignments / case studies / previous papers / mock tests) ──
  const addResource = () => setEditCourse(c => ({
    ...c,
    resources: [...(c.resources || []), { ...EMPTY_RESOURCE, order: c.resources?.length || 0 }],
  }));

  const removeResource = i => setEditCourse(c => ({
    ...c,
    resources: c.resources.filter((_, idx) => idx !== i),
  }));

  const setResourceField = (i, k, v) => setEditCourse(c => {
    const resources = [...c.resources];
    resources[i] = { ...resources[i], [k]: v };
    return { ...c, resources };
  });

  const RESOURCE_ALLOWED_EXTS = ['pdf', 'doc', 'docx'];
  const MAX_RESOURCE_MB = 20; // matches backend/middleware/upload.js's limit

  const handleResourceFileUpload = async (i, file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!RESOURCE_ALLOWED_EXTS.includes(ext)) {
      showToast(`Unsupported file type ".${ext}". Allowed: PDF, DOC, DOCX.`, 'error');
      return;
    }
    if (file.size > MAX_RESOURCE_MB * 1024 * 1024) {
      showToast(`File too large. Maximum size is ${MAX_RESOURCE_MB} MB.`, 'error');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (r.data.url) setResourceField(i, 'fileUrl', r.data.url);
    } catch (e) { showToast(e.response?.data?.message || 'File upload failed. Please try again.', 'error'); }
  };

  const filtered = courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header tabs */}
      <div className="page-card">
        <div className="page-card-header">
          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${view === 'courses' ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => setView('courses')}>
              <i className="fas fa-graduation-cap me-1"></i>Courses
            </button>
            <button className={`btn btn-sm ${view === 'enrollments' ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => setView('enrollments')}>
              <i className="fas fa-users me-1"></i>Enrollments
              {enrollments.filter(e => e.paymentStatus === 'pending_verification').length > 0 && (
                <span className="badge bg-danger ms-1">
                  {enrollments.filter(e => e.paymentStatus === 'pending_verification').length}
                </span>
              )}
            </button>
          </div>
          {view === 'courses' && (
            <div className="d-flex gap-2">
              <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…" />
              <button className="btn btn-gold btn-sm" onClick={() => openEdit({ ...EMPTY_COURSE })}>
                <i className="fas fa-plus me-1"></i>Add Course
              </button>
            </div>
          )}
          {view === 'enrollments' && (
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={enrolFilter} onChange={e => setEnrolFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="paid">Paid / Active</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          )}
        </div>

        {view === 'courses' && (
          <div className="table-responsive">
            <table className="table admin-table">
              <thead><tr><th>Title</th><th>Program</th><th>Category</th><th>Price</th><th>Students</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">No existing data found.</td></tr>}
                {!loading && filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="fw-semibold">{c.title}</div>
                      <small className="text-muted">{c.instructor}</small>
                    </td>
                    <td><span className="badge bg-dark">{PROGRAM_LABELS[c.programType] || c.programType || '—'}</span></td>
                    <td>{c.category || <span className="text-muted">—</span>}</td>
                    <td>
                      {c.price === 0 ? <span className="badge bg-success">Free</span> : (
                        <span>₹{c.discountPrice > 0 ? c.discountPrice : c.price}
                          {c.discountPrice > 0 && <small className="text-muted ms-1 text-decoration-line-through">₹{c.price}</small>}
                        </span>
                      )}
                    </td>
                    <td>{c.totalStudents}</td>
                    <td><span className="badge bg-secondary">{c.level}</span></td>
                    <td>
                      <span className={`badge ${c.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {c.isFeatured && <span className="badge bg-warning text-dark ms-1">Featured</span>}
                      {c.status === 'coming-soon' && <span className="badge bg-info text-dark ms-1">Coming Soon</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openEdit({ ...c })}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDelete(c._id)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'enrollments' && (
          <div className="table-responsive">
            <table className="table admin-table">
              <thead><tr><th>Student</th><th>Course</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
                {!loading && enrollments.map(en => (
                  <tr key={en._id} className={en.paymentStatus === 'pending_verification' ? 'table-warning' : ''}>
                    <td>
                      <div className="fw-semibold">{en.userId?.name || '—'}</div>
                      <small className="text-muted">{en.userId?.email}</small><br />
                      <small className="text-muted">{en.userId?.phone}</small>
                    </td>
                    <td><div className="fw-semibold">{en.courseId?.title || '—'}</div></td>
                    <td>₹{en.amountPaid}</td>
                    <td>
                      <span className={`badge ${
                        en.paymentStatus === 'paid' ? 'bg-success' :
                        en.paymentStatus === 'pending_verification' ? 'bg-warning text-dark' :
                        en.paymentStatus === 'failed' ? 'bg-danger' : 'bg-secondary'
                      }`}>{en.paymentStatus}</span>
                    </td>
                    <td><small>{en.createdAt ? new Date(en.createdAt).toLocaleDateString('en-IN') : '—'}</small></td>
                    <td>
                      {en.paymentStatus === 'pending_verification' && (
                        <>
                          <button className="btn btn-xs btn-success me-1" onClick={() => handleEnrollStatus(en._id, 'paid')}>
                            <i className="fas fa-check me-1"></i>Approve
                          </button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleEnrollStatus(en._id, 'failed')}>
                            <i className="fas fa-times me-1"></i>Reject
                          </button>
                        </>
                      )}
                      {en.paymentStatus === 'paid' && (
                        <span className="text-success small"><i className="fas fa-check-circle me-1"></i>Active</span>
                      )}
                      {en.paymentScreenshot && (
                        <a href={en.paymentScreenshot} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-info ms-1">
                          <i className="fas fa-image"></i>
                        </a>
                      )}
                      {en.paymentStatus === 'paid' && (
                        <button className="btn btn-xs btn-outline-secondary ms-1" onClick={() => setViewProgress(en)} title="View Progress">
                          <i className="fas fa-chart-line"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Edit Modal */}
      {editCourse && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editCourse._id ? 'Edit Course' : 'New Course'}</h5>
                <button className="btn-close" onClick={handleCancel}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Course Title *</label>
                    <input className="form-control" value={editCourse.title} onChange={e => setField('title', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Instructor</label>
                    <input className="form-control" value={editCourse.instructor} onChange={e => setField('instructor', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Short Description</label>
                    <input className="form-control" value={editCourse.shortDescription} onChange={e => setField('shortDescription', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Full Description</label>
                    <textarea className="form-control" rows={3} value={editCourse.description} onChange={e => setField('description', e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Price (₹) — 0 for Free</label>
                    <input type="number" className="form-control" value={editCourse.price} onChange={e => setField('price', Number(e.target.value))} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Discount Price (₹) — 0 to disable</label>
                    <input type="number" className="form-control" value={editCourse.discountPrice} onChange={e => setField('discountPrice', Number(e.target.value))} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Duration</label>
                    <input className="form-control" value={editCourse.duration} onChange={e => setField('duration', e.target.value)} placeholder="e.g. 20 hours" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Category</label>
                    <input className="form-control" value={editCourse.category || ''} onChange={e => setField('category', e.target.value)} placeholder="e.g. Criminal Law" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={editCourse.level} onChange={e => setField('level', e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Language</label>
                    <input className="form-control" value={editCourse.language} onChange={e => setField('language', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Thumbnail URL</label>
                    <input className="form-control" value={editCourse.thumbnail || ''} onChange={e => setField('thumbnail', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Banner URL</label>
                    <input className="form-control" value={editCourse.banner || ''} onChange={e => setField('banner', e.target.value)} placeholder="https://... (wide hero image)" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Program Category *</label>
                    <select className="form-select" value={editCourse.programType} onChange={e => setField('programType', e.target.value)}>
                      <option value="internship">Internship Program (LL.B Students)</option>
                      <option value="training">Training Program (Junior Advocates)</option>
                      <option value="judiciary">Judiciary Exam Preparation</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Sort Order</label>
                    <input type="number" className="form-control" value={editCourse.sortOrder} onChange={e => setField('sortOrder', Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Course Status</label>
                    <select className="form-select" value={editCourse.status} onChange={e => setField('status', e.target.value)}>
                      <option value="available">Available</option>
                      <option value="coming-soon">Coming Soon</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Validity (Days)</label>
                    <input type="number" className="form-control" value={editCourse.validityDays ?? 365} onChange={e => setField('validityDays', Number(e.target.value))} placeholder="365" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Enrollment Limit</label>
                    <input type="number" className="form-control" value={editCourse.enrollmentLimit ?? 0} onChange={e => setField('enrollmentLimit', Number(e.target.value))} placeholder="0 = unlimited" />
                  </div>
                  <div className="col-md-4 d-flex gap-3 align-items-end pb-2">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={editCourse.isActive} onChange={e => setField('isActive', e.target.checked)} id="isActive" />
                      <label className="form-check-label" htmlFor="isActive">Active</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={editCourse.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} id="isFeatured" />
                      <label className="form-check-label" htmlFor="isFeatured">Featured</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={editCourse.certificate} onChange={e => setField('certificate', e.target.checked)} id="cert" />
                      <label className="form-check-label" htmlFor="cert">Certificate</label>
                    </div>
                  </div>

                  {/* Course Content — Modules & Videos */}
                  <div className="col-12 mt-2">
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                      <h6 className="mb-0 fw-bold">Course Content</h6>
                      <button type="button" className="btn btn-sm btn-outline-gold" onClick={addModule}>
                        <i className="fas fa-plus me-1"></i>Add Module
                      </button>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-md-7">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Search videos by title…"
                          value={contentSearch}
                          onChange={e => setContentSearch(e.target.value)}
                        />
                      </div>
                      <div className="col-md-5">
                        <select className="form-select form-select-sm" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                          <option value="all">All Modules</option>
                          {(editCourse.modules || []).map((m, i) => (
                            <option key={i} value={String(i)}>{m.title || `Module ${i + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(editCourse.modules || []).length === 0 && (
                      <p className="text-muted small">No modules yet — click "Add Module" to start building the course content.</p>
                    )}

                    {(editCourse.modules || []).map((mod, mi) => {
                      const csLower = contentSearch.trim().toLowerCase();
                      const moduleMatches = !csLower || mod.title?.toLowerCase().includes(csLower) || (mod.videos || []).some(v => v.title?.toLowerCase().includes(csLower));
                      const inFilter = moduleFilter === 'all' || String(mi) === moduleFilter;
                      if (!inFilter || !moduleMatches) return null;
                      const collapsed = collapsedModules.has(mi);
                      return (
                        <div
                          key={mi}
                          className="border rounded p-3 mb-3 bg-light"
                          draggable
                          onDragStart={() => { dragModuleFrom.current = mi; }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            if (dragModuleFrom.current !== null) moveModule(dragModuleFrom.current, mi);
                            dragModuleFrom.current = null;
                          }}
                        >
                          {/* Module header */}
                          <div className="d-flex gap-2 align-items-center mb-3">
                            <span className="text-muted" style={{ cursor: 'grab' }} title="Drag to reorder module">
                              <i className="fas fa-grip-vertical"></i>
                            </span>
                            <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={() => toggleModuleCollapsed(mi)} title={collapsed ? 'Expand' : 'Collapse'}>
                              <i className={`fas fa-chevron-${collapsed ? 'right' : 'down'}`}></i>
                            </button>
                            <input
                              className="form-control form-control-sm"
                              placeholder="Module title"
                              value={mod.title}
                              onChange={e => setModuleField(mi, 'title', e.target.value)}
                            />
                            <span className="badge bg-secondary flex-shrink-0">
                              {(mod.videos || []).length} video{(mod.videos || []).length !== 1 ? 's' : ''}
                            </span>
                            <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0" onClick={() => removeModule(mi)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>

                          {!collapsed && (
                            <>
                              {/* Videos */}
                              {(mod.videos || []).map((vid, vi) => {
                                if (csLower && !vid.title?.toLowerCase().includes(csLower) && !mod.title?.toLowerCase().includes(csLower)) return null;
                                const effectiveUrl = vid.uploadedVideoPath || vid.videoUrl;
                                const urlInvalid = vid.videoSourceType !== 'upload' && vid.videoUrl && !isValidVideoUrl(vid.videoUrl);
                                return (
                                  <div
                                    key={vi}
                                    className="border rounded p-2 mb-2 bg-white"
                                    draggable
                                    onDragStart={() => { dragVideoFrom.current = { mi, vi }; }}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                      e.preventDefault();
                                      const from = dragVideoFrom.current;
                                      if (from && from.mi === mi) moveVideoInModule(mi, from.vi, vi);
                                      dragVideoFrom.current = null;
                                    }}
                                  >
                                    {/* Row 1: drag handle, title, duration, preview/published toggles, preview button, remove */}
                                    <div className="row g-2 mb-2 align-items-center">
                                      <div className="col-auto text-muted" style={{ cursor: 'grab' }} title="Drag to reorder video">
                                        <i className="fas fa-grip-vertical"></i>
                                      </div>
                                      <div className="col-md-4">
                                        <input
                                          className="form-control form-control-sm"
                                          placeholder="Video title *"
                                          value={vid.title}
                                          onChange={e => setVideoFields(mi, vi, { title: e.target.value })}
                                        />
                                      </div>
                                      <div className="col-md-2">
                                        <input
                                          className="form-control form-control-sm"
                                          placeholder="Duration (e.g. 15 min)"
                                          value={vid.duration}
                                          onChange={e => setVideoFields(mi, vi, { duration: e.target.value })}
                                        />
                                      </div>
                                      <div className="col-auto">
                                        <div className="form-check mb-0" title="Free preview — playable without enrolling">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`prev-${mi}-${vi}`}
                                            checked={vid.isPreview}
                                            onChange={e => setVideoFields(mi, vi, { isPreview: e.target.checked })}
                                          />
                                          <label className="form-check-label small" htmlFor={`prev-${mi}-${vi}`}>Preview</label>
                                        </div>
                                      </div>
                                      <div className="col-auto">
                                        <div className="form-check mb-0" title="Visible to students">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`pub-${mi}-${vi}`}
                                            checked={vid.isPublished !== false}
                                            onChange={e => setVideoFields(mi, vi, { isPublished: e.target.checked })}
                                          />
                                          <label className="form-check-label small" htmlFor={`pub-${mi}-${vi}`}>Published</label>
                                        </div>
                                      </div>
                                      <div className="col-auto d-flex align-items-center gap-1 ms-auto">
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-info"
                                          disabled={!effectiveUrl}
                                          onClick={() => setPreviewVideo({ ...vid, effectiveUrl })}
                                          title={effectiveUrl ? 'Preview video' : 'No video source yet'}
                                        >
                                          <i className="fas fa-play"></i>
                                        </button>
                                        <button type="button" className="btn btn-xs btn-outline-danger" onClick={() => removeVideo(mi, vi)} title="Remove video">
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Row 2: Video source selector */}
                                    <div className="d-flex gap-3 mb-2">
                                      <div className="form-check">
                                        <input
                                          type="radio"
                                          className="form-check-input"
                                          name={`vsrc-${mi}-${vi}`}
                                          id={`vsrc-url-${mi}-${vi}`}
                                          checked={vid.videoSourceType !== 'upload'}
                                          onChange={() => setVideoFields(mi, vi, { videoSourceType: 'url' })}
                                        />
                                        <label className="form-check-label small fw-semibold" htmlFor={`vsrc-url-${mi}-${vi}`}>
                                          <i className="fas fa-link me-1 text-secondary"></i>URL
                                        </label>
                                      </div>
                                      <div className="form-check">
                                        <input
                                          type="radio"
                                          className="form-check-input"
                                          name={`vsrc-${mi}-${vi}`}
                                          id={`vsrc-upload-${mi}-${vi}`}
                                          checked={vid.videoSourceType === 'upload'}
                                          onChange={() => setVideoFields(mi, vi, { videoSourceType: 'upload' })}
                                        />
                                        <label className="form-check-label small fw-semibold" htmlFor={`vsrc-upload-${mi}-${vi}`}>
                                          <i className="fas fa-upload me-1 text-primary"></i>Upload Video
                                        </label>
                                      </div>
                                    </div>

                                    {/* Row 3: URL input or Upload zone */}
                                    {vid.videoSourceType !== 'upload' ? (
                                      <>
                                        <input
                                          className={`form-control form-control-sm ${urlInvalid ? 'is-invalid' : ''}`}
                                          placeholder="Video URL — YouTube, Vimeo, Google Drive, or direct MP4 link"
                                          value={vid.videoUrl}
                                          onChange={e => {
                                            const url = e.target.value;
                                            const fields = { videoUrl: url };
                                            if (!vid.thumbnailUrl) {
                                              const auto = autoThumbnailForUrl(url);
                                              if (auto) fields.thumbnailUrl = auto;
                                            }
                                            setVideoFields(mi, vi, fields);
                                          }}
                                        />
                                        {urlInvalid && <div className="text-danger small mt-1">Must start with http:// or https://</div>}
                                      </>
                                    ) : (
                                      <VideoUploadZone
                                        videoPath={vid.uploadedVideoPath}
                                        videoSize={vid.videoSize}
                                        onUploaded={data => handleVideoUploaded(mi, vi, vid.uploadedVideoPath, data)}
                                        onRemove={() => handleVideoRemoved(mi, vi, vid.uploadedVideoPath)}
                                      />
                                    )}

                                    {/* Row 4: description + thumbnail */}
                                    <div className="row g-2 mt-1">
                                      <div className="col-md-7">
                                        <textarea
                                          className="form-control form-control-sm"
                                          rows={2}
                                          placeholder="Description (optional)"
                                          value={vid.description}
                                          onChange={e => setVideoFields(mi, vi, { description: e.target.value })}
                                        />
                                      </div>
                                      <div className="col-md-5">
                                        <input
                                          className="form-control form-control-sm"
                                          placeholder="Thumbnail URL (auto-filled when possible)"
                                          value={vid.thumbnailUrl}
                                          onChange={e => setVideoFields(mi, vi, { thumbnailUrl: e.target.value })}
                                        />
                                        {vid.thumbnailUrl && (
                                          <img src={vid.thumbnailUrl} alt="" style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 4, marginTop: 4 }} />
                                        )}
                                      </div>
                                    </div>
                                    {vid.createdAt && (
                                      <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                        Added on {new Date(vid.createdAt).toLocaleDateString('en-IN')}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <button type="button" className="btn btn-xs btn-outline-primary mt-1" onClick={() => addVideo(mi)}>
                                <i className="fas fa-plus me-1"></i>Add Video
                              </button>

                              {/* Bulk add — multi-file upload + paste-URLs (playlist) */}
                              <div className="mt-2 pt-2 border-top">
                                <div className="small fw-semibold text-muted mb-1"><i className="fas fa-layer-group me-1"></i>Bulk Add Videos</div>
                                <BulkVideoUploadZone onUploaded={files => handleBulkVideosUploaded(mi, files)} />
                                <BulkUrlAdder onAdd={text => handleBulkUrlsAdd(mi, text)} />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resources — study materials / assignments / case studies / previous papers / mock tests */}
                  <div className="col-12 mt-2">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0 fw-bold">Resources <small className="text-muted fw-normal">(materials, assignments, mock tests, etc.)</small></h6>
                      <button type="button" className="btn btn-sm btn-outline-gold" onClick={addResource}>
                        <i className="fas fa-plus me-1"></i>Add Resource
                      </button>
                    </div>
                    {(editCourse.resources || []).length === 0 && (
                      <p className="text-muted small">No resources added yet.</p>
                    )}
                    {(editCourse.resources || []).map((res, ri) => (
                      <div key={ri} className="row g-2 align-items-center mb-2 border rounded p-2 bg-light">
                        <div className="col-md-4">
                          <input className="form-control form-control-sm" placeholder="Title" value={res.title} onChange={e => setResourceField(ri, 'title', e.target.value)} />
                        </div>
                        <div className="col-md-3">
                          <select className="form-select form-select-sm" value={res.type} onChange={e => setResourceField(ri, 'type', e.target.value)}>
                            {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="col-md-4">
                          {res.fileUrl ? (
                            <div className="d-flex align-items-center gap-2">
                              <a href={res.fileUrl} target="_blank" rel="noreferrer" className="small text-truncate" style={{ maxWidth: 160 }}>
                                <i className="fas fa-file-pdf me-1 text-danger"></i>File attached
                              </a>
                              <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setResourceField(ri, 'fileUrl', '')}>Change</button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="form-control form-control-sm"
                              onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleResourceFileUpload(ri, f); }}
                            />
                          )}
                        </div>
                        <div className="col-md-1 text-end">
                          <button type="button" className="btn btn-xs btn-outline-danger" onClick={() => removeResource(ri)}><i className="fas fa-trash"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={handleCancel}>Cancel</button>
                <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving…</> : <><i className="fas fa-save me-1"></i>Save Course</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Progress modal */}
      {viewProgress && (() => {
        const course = viewProgress.courseId || {};
        const totalVideos = course.modules?.reduce((s, m) => s + (m.videos?.length || 0), 0) || 0;
        const pct = totalVideos > 0 ? Math.round(((viewProgress.completedVideos || 0) / totalVideos) * 100) : 0;
        const isExpired = viewProgress.expiresAt && new Date(viewProgress.expiresAt) < new Date();
        return (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title"><i className="fas fa-chart-line me-2"></i>Student Progress</h5>
                  <button className="btn-close" onClick={() => setViewProgress(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-1"><strong>{viewProgress.userId?.name}</strong> — {course.title}</p>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Progress</span><span>{viewProgress.completedVideos || 0}/{totalVideos} videos ({pct}%)</span>
                  </div>
                  <div className="progress mb-3" style={{ height: 8 }}>
                    <div className="progress-bar bg-success" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="d-flex justify-content-between small mb-3">
                    <span>Access Valid Till</span>
                    <span className={isExpired ? 'text-danger fw-semibold' : ''}>
                      {viewProgress.expiresAt ? new Date(viewProgress.expiresAt).toLocaleDateString('en-IN') : '—'}
                      {isExpired && ' (Expired)'}
                    </span>
                  </div>

                  {course.programType === 'judiciary' && (
                    <>
                      <hr />
                      <h6 className="fw-bold small">Test Scores</h6>
                      {(viewProgress.testScores || []).length === 0 && <p className="text-muted small">No test scores logged yet.</p>}
                      {(viewProgress.testScores || []).map((t, i) => (
                        <div key={i} className="d-flex justify-content-between small py-1 border-bottom">
                          <span>{t.title}</span><span className="fw-semibold">{t.score}/{t.maxScore}</span>
                        </div>
                      ))}
                      <div className="row g-2 mt-2">
                        <div className="col-5">
                          <input className="form-control form-control-sm" placeholder="Test title" value={scoreForm.title} onChange={e => setScoreForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="col-3">
                          <input type="number" className="form-control form-control-sm" placeholder="Score" value={scoreForm.score} onChange={e => setScoreForm(f => ({ ...f, score: e.target.value }))} />
                        </div>
                        <div className="col-3">
                          <input type="number" className="form-control form-control-sm" placeholder="Max" value={scoreForm.maxScore} onChange={e => setScoreForm(f => ({ ...f, maxScore: e.target.value }))} />
                        </div>
                        <div className="col-1">
                          <button className="btn btn-sm btn-gold w-100" onClick={handleAddTestScore} disabled={savingScore}>
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-light" onClick={() => setViewProgress(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmModal
        show={!!confirmDelete}
        title="Delete Course"
        message="Delete this course and all enrollments? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />

      {/* Video preview modal */}
      {previewVideo && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setPreviewVideo(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-truncate">{previewVideo.title || 'Video Preview'}</h5>
                <button className="btn-close" onClick={() => setPreviewVideo(null)}></button>
              </div>
              <div className="modal-body p-0" style={{ aspectRatio: '16/9', background: '#000' }}>
                {renderVideoEmbed(previewVideo.effectiveUrl)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
