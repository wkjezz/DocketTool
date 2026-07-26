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
        <div className="hero-header">
          <div>
            <p className="department-label">Department of Justice</p>
            <h1>Docket Tool</h1>
          </div>
          <div className="auth-panel">
            {isAuthorized && discordUserName ? <span className="auth-user">{discordUserName}</span> : null}
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
        <div className="action-buttons">
          <button className={`primary-button ${showForm ? 'active' : ''}`} onClick={startNewDocket}>
            Add Docket
          </button>
          <button className={`secondary-button ${showReview ? 'active' : ''}`} onClick={handleOpenReview}>
            Review Existing
          </button>
        </div>
        {discordAuthError ? <p className="auth-error">{discordAuthError}</p> : null}
      </div>
      <div className="hero-image-container">
        <img src={SadojImage} alt="Sadoj" className="hero-image" />
      </div>
    </div>
  );
}
