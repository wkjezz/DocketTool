export default function DocketEditor({
  draft,
  draftStep,
  editingId,
  editingEvidenceId,
  handleCaseTitleChange,
  handleCaseTypeChange,
  handleCaseSubmit,
  handleEvidenceTypeChange,
  handleEvidenceChange,
  handleEvidenceSubmit,
  evidenceForm,
  caseTypes,
  casePartyOptions,
  evidenceTypes,
  previewUrl,
  handleWitnessChange,
  addWitnessField,
  removeWitnessField,
  handleEditEvidence,
  handleRemoveEvidence,
  handleCancel,
  handleSaveDocket,
  setDraftStep,
  prosecutionEvidence,
  defendantEvidence,
  formatPhoneNumber,
  openLinkPreview,
  openLinkInNewTab,
}) {
  return (
    <section className="docket-panel">
      <div className="docket-header">
        <div>
          <h2>{editingId ? 'Edit Docket' : 'Add New Docket'}</h2>
        </div>
        <button className="text-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>

      {draftStep === 'case' ? (
        <form className="docket-form" onSubmit={handleCaseSubmit}>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="title">Case Name</label>
              <input
                id="title"
                name="title"
                value={draft.title}
                onChange={handleCaseTitleChange}
                className="text-input"
                placeholder="Enter case name"
              />
            </div>
            <div className="field-group">
              <label htmlFor="case-type">Case Type</label>
              <select
                id="case-type"
                name="caseType"
                value={draft.caseType || 'Criminal'}
                onChange={handleCaseTypeChange}
                className="select-input"
              >
                {caseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="primary-button">
              Continue to Evidence
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="draft-summary">
            <strong>Case:</strong> {draft.title}
          </div>

          <form className="docket-form" onSubmit={handleEvidenceSubmit}>
            <div className="field-row">
              <div className="field-group">
                <label htmlFor="evidence-type">Evidence Type</label>
                <select
                  id="evidence-type"
                  name="type"
                  value={evidenceForm.type}
                  onChange={handleEvidenceTypeChange}
                  className="select-input"
                >
                  {evidenceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="party">Party</label>
                <select
                  id="party"
                  name="party"
                  value={evidenceForm.party}
                  onChange={handleEvidenceChange}
                  className="select-input"
                >
                  {casePartyOptions(draft.caseType || 'Criminal').map((party) => (
                    <option key={party} value={party}>
                      {party}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {evidenceForm.type === 'Witness List' ? (
              <div className="witness-group">
                <label>Witnesses</label>
                {evidenceForm.witnesses.map((witness, index) => (
                  <div key={index} className="witness-row witness-fields">
                    <div className="witness-field">
                      <label>Name</label>
                      <input
                        type="text"
                        value={witness.name}
                        onChange={(event) => handleWitnessChange(index, 'name', event.target.value)}
                        className="text-input"
                        placeholder={`Witness ${index + 1} name`}
                      />
                    </div>
                    <div className="witness-field">
                      <label>CID</label>
                      <input
                        type="text"
                        value={witness.cid}
                        onChange={(event) => handleWitnessChange(index, 'cid', event.target.value)}
                        className="text-input"
                        placeholder="CID (optional)"
                      />
                    </div>
                    <div className="witness-field">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={witness.phone}
                        onChange={(event) => handleWitnessChange(index, 'phone', event.target.value)}
                        className="text-input"
                        placeholder="Phone number (optional)"
                      />
                    </div>
                    <div className="witness-field">
                      <label>Email</label>
                      <input
                        type="text"
                        value={witness.email}
                        onChange={(event) => handleWitnessChange(index, 'email', event.target.value)}
                        className="text-input"
                        placeholder="Email (optional)"
                      />
                    </div>
                    <div className="witness-actions">
                      {evidenceForm.witnesses.length > 1 && (
                        <button type="button" className="text-button remove-button" onClick={() => removeWitnessField(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="secondary-button add-witness-button" onClick={addWitnessField}>
                  + Add witness
                </button>
              </div>
            ) : (
              <>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="number">Evidence Number</label>
                    <input
                      id="number"
                      name="number"
                      value={evidenceForm.number}
                      onChange={handleEvidenceChange}
                      className="text-input"
                      placeholder="Enter evidence number"
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="title">Title</label>
                    <input
                      id="title"
                      name="title"
                      value={evidenceForm.title}
                      onChange={handleEvidenceChange}
                      className="text-input"
                      placeholder="Evidence title"
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="link">Link</label>
                  <input
                    id="link"
                    name="link"
                    value={evidenceForm.link}
                    onChange={handleEvidenceChange}
                    className="text-input"
                    placeholder="Paste Google or image link"
                  />
                </div>
                {previewUrl && (
                  <div className="preview-card">
                    {/(jpg|jpeg|png|gif|webp)$/i.test(previewUrl) ? (
                      <img src={previewUrl} alt="Evidence preview" className="preview-image" />
                    ) : (
                      <iframe
                        title="Evidence preview"
                        src={previewUrl}
                        className="preview-frame"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    )}
                  </div>
                )}
              </>
            )}

            <div className="form-buttons">
              <button type="submit" className="primary-button">
                {editingEvidenceId ? 'Update Evidence' : 'Add Evidence'}
              </button>
            </div>
          </form>

          <div className="evidence-list">
            <h3>Evidence Submitted</h3>
            {draft.evidence.length === 0 ? (
              <div className="empty-state">No evidence added yet.</div>
            ) : (
              <>
                <div className="evidence-group">
                  <h4>{draft.caseType === 'Civil' ? 'Plaintiff' : 'Prosecution'}</h4>
                  {prosecutionEvidence.length === 0 ? (
                    <div className="empty-state small">No evidence for this party.</div>
                  ) : (
                    prosecutionEvidence.map((item) => (
                      <div key={item.id} className="evidence-row">
                        <div>
                          <span className="evidence-type">{item.type}</span>
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
                            <p>{`${item.number} · ${item.title}`}</p>
                          )}
                          <div className="evidence-meta">
                            <span>{item.party}</span>
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
                        </div>
                        <div className="evidence-actions">
                          <button className="text-button" onClick={() => handleEditEvidence(item)}>
                            Edit
                          </button>
                          <button className="text-button" onClick={() => handleRemoveEvidence(item.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="evidence-group">
                  <h4>Defendant</h4>
                  {defendantEvidence.length === 0 ? (
                    <div className="empty-state small">No evidence for this party.</div>
                  ) : (
                    defendantEvidence.map((item) => (
                      <div key={item.id} className="evidence-row">
                        <div>
                          <span className="evidence-type">{item.type}</span>
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
                            <p>{`${item.number} · ${item.title}`}</p>
                          )}
                          <div className="evidence-meta">
                            <span>{item.party}</span>
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
                        </div>
                        <div className="evidence-actions">
                          <button className="text-button" onClick={() => handleEditEvidence(item)}>
                            Edit
                          </button>
                          <button className="text-button" onClick={() => handleRemoveEvidence(item.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="form-buttons docket-save-row">
            <button type="button" className="secondary-button" onClick={() => setDraftStep('case')}>
              Back to Case Name
            </button>
            <button type="button" className="primary-button" onClick={handleSaveDocket}>
              Save Docket
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
