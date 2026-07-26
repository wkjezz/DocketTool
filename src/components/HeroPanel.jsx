import SadojImage from '../../Sadoj.webp';

export default function HeroPanel({ showForm, showReview, startNewDocket, handleOpenReview }) {
  return (
    <div className="hero">
      <div className="hero-copy">
        <p className="department-label">Department of Justice</p>
        <h1>Docket Tool</h1>
        <div className="action-buttons">
          <button className={`primary-button ${showForm ? 'active' : ''}`} onClick={startNewDocket}>
            Add Docket
          </button>
          <button className={`secondary-button ${showReview ? 'active' : ''}`} onClick={handleOpenReview}>
            Review Existing
          </button>
        </div>
      </div>
      <div className="hero-image-container">
        <img src={SadojImage} alt="Sadoj" className="hero-image" />
      </div>
    </div>
  );
}
