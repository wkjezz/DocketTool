import DocketCard from './DocketCard';

export default function DocketReview({
  dockets,
  selectedDocketId,
  selectedDocket,
  setSelectedDocketId,
  handleEditDocket,
  handleDeleteDocket,
  clerkFilingEnabled,
  setClerkFilingEnabled,
  selectedEvidenceIds,
  toggleEvidenceSelection,
  generateClerkFiling,
  clerkFilingText,
  copyClerkFiling,
  copyButtonText,
  formatPhoneNumber,
  openLinkPreview,
  openLinkInNewTab,
  isPlaintiffProsecution,
  isDefence,
}) {
  return (
    <section id="docket-list" className="docket-list-section">
      <div className="section-heading">
        <h2>Saved Dockets</h2>
        <span>{dockets.length} total</span>
      </div>

      <div className="docket-list">
        {dockets.length === 0 ? (
          <div className="empty-state">No dockets saved yet. Add one to begin tracking.</div>
        ) : (
          dockets.map((docket) => (
            <DocketCard
              key={docket.id}
              docket={docket}
              selected={selectedDocketId === docket.id}
              onSelect={setSelectedDocketId}
              onEdit={handleEditDocket}
              onDelete={handleDeleteDocket}
              isPlaintiffProsecution={isPlaintiffProsecution}
              isDefence={isDefence}
            />
          ))
        )}
      </div>

      {selectedDocket && (
        <section className="docket-detail-section">
          <div className="section-heading">
            <h2>{selectedDocket.title}</h2>
            <span>{selectedDocket.evidence.length} evidence items</span>
          </div>
          <div className="docket-detail-meta">
            <span>{new Date(selectedDocket.createdAt).toLocaleDateString()}</span>
            <span>
              {selectedDocket.caseType === 'Civil' ? 'Plaintiff' : 'Prosecution'}: {selectedDocket.evidence.filter((item) => isPlaintiffProsecution(item.party)).length}
            </span>
            <span>Defendant: {selectedDocket.evidence.filter((item) => isDefence(item.party)).length}</span>
          </div>

          <div className="clerk-filing-toolbar">
            <label className="clerk-filing-toggle">
              <input
                type="checkbox"
                checked={clerkFilingEnabled}
                onChange={() => setClerkFilingEnabled((enabled) => !enabled)}
              />
              Enable Clerk Filing
            </label>
            {clerkFilingEnabled && (
              <button type="button" className="primary-button" onClick={generateClerkFiling}>
                Generate Clerk Filing
              </button>
            )}
          </div>
          {(!clerkFilingEnabled && selectedDocket.evidence.length > 0) ? (
            <div className="clerk-filing-hint">Enable Clerk Filing to select evidence for email filing output.</div>
          ) : null}

          <div className="selected-evidence-list">
            {selectedDocket.evidence.map((item) => (
              <div key={item.id} className="selected-evidence-row">
                <div className="selected-evidence-header">
                  {clerkFilingEnabled && (
                    <label className="evidence-select-label">
                      <input
                        type="checkbox"
                        checked={selectedEvidenceIds.includes(item.id)}
                        onChange={() => toggleEvidenceSelection(item.id)}
                      />
                      Select
                    </label>
                  )}
                  <span className="evidence-type">{item.type}</span>
                  <span className="evidence-party">{item.party}</span>
                </div>
                {item.type === 'Witness List' ? (
                  <div className="witness-list">
                    <strong>Witnesses</strong>
                    <ul>
                      {item.witnesses.map((witness, idx) => (
                        <li key={idx}>
                          <div className="witness-item-name">{witness.name}</div>
                          <div className="witness-item-meta">
                            {witness.cid && <span>CID: {witness.cid}</span>}
                            {witness.phone && <span>Phone: {formatPhoneNumber(witness.phone)}</span>}
                            {witness.email && <span>Email: {witness.email}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    <p className="selected-evidence-title">{item.number} · {item.title}</p>
                    <div className="selected-evidence-link-row">
                      {item.link && (
                        <>
                          <button type="button" className="text-button" onClick={() => openLinkPreview(item.link)}>
                            View link
                          </button>
                          <button type="button" className="text-button open-new-tab-button" onClick={() => openLinkInNewTab(item.link)}>
                            Open in new tab
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="clerk-filing-output">
            <div className="clerk-filing-output-header">
              <label>Clerk Filing Output</label>
              <button
                type="button"
                className={`secondary-button copy-button ${copyButtonText === 'Copied!' ? 'copied' : ''}`}
                onClick={copyClerkFiling}
                disabled={!clerkFilingText}
              >
                {copyButtonText}
              </button>
            </div>
            <textarea
              readOnly
              value={clerkFilingText}
              className="clerk-filing-textarea"
              placeholder="Generate clerk filing output here..."
            />
          </div>
        </section>
      )}
    </section>
  );
}
