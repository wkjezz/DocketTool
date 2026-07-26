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
  const maskedDiscordId = discordUserId ? `ID ${discordUserId.slice(-4).padStart(4, '*')}` : '';

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
        {discordAuthError ? <p className="auth-error">{discordAuthError}</p> : null}
      </div>
      <div className="hero-image-container">
        <img src={SadojImage} alt="Sadoj" className="hero-image" />
      </div>
      <div className="hero-utility">
        <div className="auth-panel discreet-auth">
          {isAuthorized && discordUserName ? <span className="auth-user">{discordUserName}</span> : null}
          {isAuthorized && maskedDiscordId ? <span className="auth-id">{maskedDiscordId}</span> : null}
          {isAuthorized ? (
            <button type="button" className="secondary-button auth-button" onClick={handleDiscordLogout}>
              Sign Out
            </button>
          ) : (
            <button type="button" className="secondary-button auth-button" onClick={handleDiscordLogin} disabled={discordAuthLoading}>
              {discordAuthLoading ? 'Connecting...' : 'Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
