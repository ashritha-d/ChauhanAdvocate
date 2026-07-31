import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
    </div>
  );
}

function validateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext)) {
    return 'Unsupported file type. Please use PNG, JPG, JPEG, or WEBP.';
  }
  if (file.size > MAX_SIZE) {
    return 'File is too large. Maximum size is 5 MB.';
  }
  return null;
}

export default function PaymentQRManager() {
  const [qr, setQr] = useState({ qrUrl: '', publicId: '', updatedAt: null, updatedBy: '' });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // awaiting replace confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  const busy = uploading || deleting;
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = () => {
    setLoading(true);
    api.get('/payments/qr')
      .then(r => { if (r.data.success) setQr(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doUpload = async (file, method) => {
    setError('');
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('qrImage', file);
    try {
      const r = await api.request({
        url: '/payments/qr',
        method,
        data: fd,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      if (r.data.success) {
        setQr(q => ({ ...q, qrUrl: r.data.qrUrl, publicId: r.data.publicId, updatedAt: new Date().toISOString() }));
        showToast(method === 'put' ? 'Payment QR replaced successfully.' : 'Payment QR uploaded successfully.');
      } else {
        showToast(r.data.message || 'Upload failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed. Please try again.', 'error');
    }
    setUploading(false);
    setProgress(0);
    setPendingFile(null);
  };

  const handleFile = (file) => {
    if (!file || busy) return;
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }
    setError('');
    if (qr.qrUrl) {
      // Existing QR — require confirmation before replacing
      setPendingFile(file);
    } else {
      doUpload(file, 'post');
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragActive(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      const r = await api.delete('/payments/qr');
      if (r.data.success) {
        setQr({ qrUrl: '', publicId: '', updatedAt: null, updatedBy: '' });
        showToast('Payment QR deleted successfully.');
      } else {
        showToast(r.data.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed. Please try again.', 'error');
    }
    setDeleting(false);
  };

  if (loading) {
    return <div className="text-center py-4"><div className="spinner-border sa-spinner"></div></div>;
  }

  return (
    <div>
      <label className="sa-label">Payment QR Code</label>

      <div className="d-flex flex-wrap align-items-start gap-4">
        <div>
          {qr.qrUrl ? (
            <img
              src={qr.qrUrl}
              alt="Payment QR"
              style={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 10, border: '1px solid #2d3748', background: '#fff', padding: 8 }}
            />
          ) : (
            <div style={{ width: 200, height: 200, borderRadius: 10, border: '1px dashed #2d3748', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', gap: 8 }}>
              <i className="fas fa-qrcode fa-2x"></i>
              <span style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0 12px' }}>No QR Code Uploaded.</span>
            </div>
          )}
          {qr.qrUrl && (
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 8, maxWidth: 200, wordBreak: 'break-all' }}>
              {qr.updatedAt && <div>Updated: {new Date(qr.updatedAt).toLocaleString('en-IN')}</div>}
              {qr.updatedBy && <div>By: {qr.updatedBy}</div>}
            </div>
          )}
        </div>

        <div className="flex-grow-1" style={{ minWidth: 260 }}>
          <div
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); if (!busy) setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#C9A84C' : '#2d3748'}`,
              borderRadius: 10,
              padding: '28px 16px',
              textAlign: 'center',
              cursor: busy ? 'not-allowed' : 'pointer',
              background: dragActive ? 'rgba(201,168,76,0.08)' : 'transparent',
              transition: 'all 0.2s',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin fa-2x mb-2" style={{ color: '#C9A84C' }}></i>
                <div style={{ color: '#9ca3af' }}>Uploading… {progress}%</div>
                <div style={{ height: 6, background: '#1e2436', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#C9A84C', transition: 'width 0.2s' }} />
                </div>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt fa-2x mb-2" style={{ color: '#C9A84C' }}></i>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  Drag &amp; drop a QR image here, or click to browse
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 4 }}>PNG, JPG, JPEG, WEBP — up to 5 MB</div>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="d-none"
            onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
          />

          {error && <div className="text-danger small mt-2"><i className="fas fa-exclamation-circle me-1"></i>{error}</div>}

          <div className="d-flex gap-2 mt-3">
            {qr.qrUrl && (
              <button className="btn sa-btn-outline btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
                <i className="fas fa-sync-alt me-1"></i>Replace QR
              </button>
            )}
            {qr.qrUrl && (
              <button className="btn btn-sm" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} disabled={busy} onClick={() => setConfirmDelete(true)}>
                {deleting ? <><i className="fas fa-spinner fa-spin me-1"></i>Deleting…</> : <><i className="fas fa-trash me-1"></i>Delete QR</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replace confirmation */}
      {pendingFile && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#C9A84C' }}><i className="fas fa-sync-alt me-2"></i>Replace QR Code</h5>
                <button className="btn-close btn-close-white" onClick={() => setPendingFile(null)} disabled={busy}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Replace existing payment QR code?</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setPendingFile(null)} disabled={busy}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={() => doUpload(pendingFile, 'put')} disabled={busy}>
                  {uploading ? <><i className="fas fa-spinner fa-spin me-2"></i>Replacing…</> : 'Replace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-exclamation-triangle me-2"></i>Delete QR Code</h5>
                <button className="btn-close btn-close-white" onClick={() => setConfirmDelete(false)} disabled={busy}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Are you sure you want to delete this payment QR?</p>
              </div>
              <div className="modal-footer sa-modal-footer border-0">
                <button className="btn sa-btn-outline" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button>
                <button className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }} onClick={handleDelete} disabled={busy}>
                  {deleting ? <><i className="fas fa-spinner fa-spin me-2"></i>Deleting…</> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
