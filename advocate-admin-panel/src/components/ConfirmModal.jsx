export default function ConfirmModal({
  show, title, message, children, onConfirm, onCancel, loading,
  confirmLabel, loadingLabel, confirmVariant, confirmDisabled,
}) {
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
            {children || <p className="mb-0">{message || 'Are you sure you want to proceed?'}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className={`btn btn-${confirmVariant || 'danger'}`} onClick={onConfirm} disabled={loading || confirmDisabled}>
              {loading ? <i className="fas fa-spinner fa-spin me-1"></i> : null}
              {loading ? (loadingLabel || 'Deleting...') : (confirmLabel || 'Delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
