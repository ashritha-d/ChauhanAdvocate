import { useRef, useState } from 'react';
import { uploadFile } from '../api';
import { mediaUrl } from '../utils/helpers';

export default function ImageUpload({ value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await uploadFile(fd);
      if (r.data.success) onChange(r.data.url);
      else setError(r.data.message || 'Upload failed');
    } catch { setError('Upload failed. Try again.'); }
    setUploading(false);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="d-flex align-items-start gap-3">
        {value && (
          <img src={mediaUrl(value)} alt="preview" className="img-preview" onError={e => { e.target.style.display='none'; }} />
        )}
        <div className="flex-grow-1">
          <div className="upload-area" onClick={() => inputRef.current.click()}>
            {uploading
              ? <><i className="fas fa-spinner fa-spin me-2 text-gold"></i>Uploading...</>
              : <><i className="fas fa-cloud-upload-alt me-2 text-gold"></i>Click to upload {label.toLowerCase()}<br /><small className="text-muted">PNG, JPG, WebP up to 5MB</small></>
            }
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={handleFile} />
          {value && (
            <div className="mt-2">
              <input type="text" className="form-control form-control-sm" value={value} onChange={e => onChange(e.target.value)} placeholder="Or enter image URL" />
            </div>
          )}
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
      </div>
    </div>
  );
}
