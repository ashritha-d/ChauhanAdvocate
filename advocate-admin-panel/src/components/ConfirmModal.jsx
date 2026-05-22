export default function ConfirmModal({ show, title, message, onConfirm, onCancel, loading }) {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title || 'Confirm Action'}</h5>
            <button className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p className="mb-0">{message || 'Are you sure you want to proceed?'}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin me-1"></i> : null}
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
