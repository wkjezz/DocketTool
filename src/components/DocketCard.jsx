export default function DocketCard({
  docket,
  selected,
  onSelect,
  onEdit,
  onDelete,
  isPlaintiffProsecution,
  isDefence,
}) {
  return (
    <article
      key={docket.id}
      className={`docket-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(docket.id)}
    >
      <div>
        <div className="docket-card-top">
          <h3>{docket.title}</h3>
          <span className="docket-status status-new">{docket.evidence.length} evidence items</span>
        </div>
        <div className="docket-meta">
          <span>{new Date(docket.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="docket-party-summary">
          <span>{docket.caseType === 'Civil' ? 'Plaintiff' : 'Prosecution'}: {docket.evidence.filter((item) => isPlaintiffProsecution(item.party)).length}</span>
          <span>Defendant: {docket.evidence.filter((item) => isDefence(item.party)).length}</span>
        </div>
      </div>
      <div className="docket-actions">
        <button className="edit-button" onClick={(event) => { event.stopPropagation(); onEdit(docket); }}>
          Edit
        </button>
        <button className="delete-button" onClick={(event) => { event.stopPropagation(); onDelete(docket.id); }}>
          Delete
        </button>
      </div>
    </article>
  );
}
