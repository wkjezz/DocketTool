function OverlayPreview({ previewUrl, onClose }) {
  if (!previewUrl) return null;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-content" onClick={(event) => event.stopPropagation()}>
        <button className="overlay-close" onClick={onClose}>&times;</button>
        {/\.(jpg|jpeg|png|gif|webp)$/i.test(previewUrl) ? (
          <img src={previewUrl} alt="Evidence preview" className="overlay-image" />
        ) : (
          <iframe title="Evidence preview" src={previewUrl} className="overlay-frame" />
        )}
      </div>
    </div>
  );
}

export default OverlayPreview;
