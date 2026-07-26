import SadojImage from '../../Sadoj.webp';

export default function HeroPanel({
  showForm,
  showReview,
  startNewDocket,
  handleOpenReview,
  isAuthorized,
  discordUserId,
  discordUserName,
  discordAuthError,
  discordAuthLoading,
  handleDiscordLogin,
  handleDiscordLogout,
}) {
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
        <div className="auth-panel">
          {discordAuthError ? <p className="auth-error">{discordAuthError}</p> : null}
          {isAuthorized ? (
            <button type="button" className="secondary-button" onClick={handleDiscordLogout}>
              Sign Out
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={handleDiscordLogin} disabled={discordAuthLoading}>
              {discordAuthLoading ? 'Connecting...' : 'Sign In with Discord'}
            </button>
          )}
        </div>
      </div>
      <div className="hero-image-container">
        <img src={SadojImage} alt="Sadoj" className="hero-image" />
      </div>
    </div>
  );
}
