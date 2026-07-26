import { useEffect, useMemo, useState } from 'react';
import OverlayPreview from './OverlayPreview';
import HeroPanel from './components/HeroPanel';
import DocketEditor from './components/DocketEditor';
import DocketReview from './components/DocketReview';
import { isDiscordUserAuthorized, normalizeDiscordId } from './auth';

const STORAGE_KEY = 'docket-tool:dockets';
const evidenceTypes = ['Document', 'Picture', 'Witness List', 'Other'];
const caseTypes = ['Criminal', 'Civil'];
const GUEST_LINK_TTL_MS = 6 * 60 * 60 * 1000;

const defaultPartyForCaseType = (caseType) => (caseType === 'Civil' ? 'Plaintiff' : 'Prosecution');

function encodeGuestPayload(payload) {
  try {
    const json = JSON.stringify(payload);
    const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    );
    return btoa(binary);
  } catch (error) {
    return '';
  }
}

function decodeGuestPayload(token) {
  try {
    const binary = atob(token);
    const encoded = Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');
    return JSON.parse(decodeURIComponent(encoded));
  } catch (error) {
    return null;
  }
}

function buildGuestDocket(docket) {
  return {
    title: docket.title,
    caseType: docket.caseType || 'Criminal',
    createdAt: docket.createdAt || null,
    evidence: docket.evidence.map((item) => {
      if (item.type === 'Witness List') {
        return {
          id: item.id,
          type: 'Witness List',
          party: item.party,
          witnesses: (item.witnesses || []).map((witness) => ({
            name: witness.name || '',
            cid: witness.cid || '',
            phone: witness.phone || '',
            email: witness.email || '',
          })),
        };
      }

      return {
        id: item.id,
        type: item.type,
        party: item.party,
        number: item.number || '',
        title: item.title || '',
        link: item.link || '',
      };
    }),
  };
}

function readGuestDocketFromUrl() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const token = params.get('guest');
  if (!token) return null;

  const payload = decodeGuestPayload(token);
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.docket || !Array.isArray(payload.docket.evidence) || !payload.docket.title) return null;

  if (typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) {
    return {
      expired: true,
      expiresAt: payload.expiresAt,
      docket: null,
    };
  }

  return {
    expired: false,
    expiresAt: payload.expiresAt,
    docket: payload.docket,
  };
}

function emptyDraft() {
  return {
    title: '',
    caseType: 'Criminal',
    evidence: [],
    createdAt: null,
    updatedAt: null,
  };
}

function emptyEvidenceForm(caseType = 'Criminal') {
  return {
    type: 'Document',
    party: defaultPartyForCaseType(caseType),
    number: '',
    title: '',
    link: '',
    witnesses: [{ name: '', cid: '', phone: '', email: '' }],
  };
}

function App() {
  const [dockets, setDockets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftStep, setDraftStep] = useState('case');
  const [draft, setDraft] = useState(emptyDraft());
  const [evidenceForm, setEvidenceForm] = useState(emptyEvidenceForm());
  const [editingEvidenceId, setEditingEvidenceId] = useState(null);
  const [previewOverlay, setPreviewOverlay] = useState(null);
  const [selectedDocketId, setSelectedDocketId] = useState(null);
  const [clerkFilingEnabled, setClerkFilingEnabled] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [clerkFilingText, setClerkFilingText] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
  const [guestLink, setGuestLink] = useState('');
  const [guestLinkCopied, setGuestLinkCopied] = useState(false);
  const [discordUserId, setDiscordUserId] = useState('');
  const [discordUserName, setDiscordUserName] = useState('');
  const [discordAuthError, setDiscordAuthError] = useState('');
  const [discordAuthLoading, setDiscordAuthLoading] = useState(false);
  const [guestView] = useState(() => readGuestDocketFromUrl());
  const isAuthorized = isDiscordUserAuthorized(discordUserId);
  const discordClientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDockets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dockets));
  }, [dockets]);

  const docketCount = useMemo(() => dockets.length, [dockets]);

  useEffect(() => {
    const storedUserId = normalizeDiscordId(localStorage.getItem('discord-user-id') || '');
    const storedToken = localStorage.getItem('discord-access-token') || '';
    const storedUserName = normalizeDiscordId(localStorage.getItem('discord-user-name') || '');

    if (storedUserId) {
      setDiscordUserId(storedUserId);
      if (storedUserName) {
        setDiscordUserName(storedUserName);
      }
    }

    if (storedToken && storedUserId) {
      setDiscordAuthLoading(true);
      fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Unable to validate Discord session.');
          return response.json();
        })
        .then((user) => {
          setDiscordUserId(normalizeDiscordId(user.id));
          setDiscordUserName(normalizeDiscordId(user.username || 'Discord user'));
          localStorage.setItem('discord-user-id', normalizeDiscordId(user.id));
          localStorage.setItem('discord-user-name', normalizeDiscordId(user.username || 'Discord user'));
          setDiscordAuthError('');
        })
        .catch(() => {
          localStorage.removeItem('discord-access-token');
          localStorage.removeItem('discord-user-id');
          localStorage.removeItem('discord-user-name');
          setDiscordUserId('');
          setDiscordUserName('');
          setDiscordAuthError('Please sign in with Discord to enable editing and clerk filing.');
        })
        .finally(() => setDiscordAuthLoading(false));
      return;
    }

    setDiscordAuthError('Please sign in with Discord to enable editing and clerk filing.');
  }, []);

  useEffect(() => {
    const handleDiscordMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'discord-auth-success') {
        const user = event.data.user;
        const accessToken = event.data.accessToken;
        if (!user?.id || !accessToken) {
          setDiscordAuthError('Discord authentication failed.');
          setDiscordAuthLoading(false);
          return;
        }

        const nextUserId = normalizeDiscordId(user.id);
        const nextUserName = normalizeDiscordId(user.username || 'Discord user');
        setDiscordUserId(nextUserId);
        setDiscordUserName(nextUserName);
        localStorage.setItem('discord-user-id', nextUserId);
        localStorage.setItem('discord-user-name', nextUserName);
        localStorage.setItem('discord-access-token', accessToken);
        setDiscordAuthError('');
        setDiscordAuthLoading(false);
      }

      if (event.data?.type === 'discord-auth-error') {
        setDiscordAuthError(event.data.error || 'Discord authentication failed.');
        setDiscordAuthLoading(false);
      }
    };

    window.addEventListener('message', handleDiscordMessage);
    return () => window.removeEventListener('message', handleDiscordMessage);
  }, []);

  const handleDiscordLogin = () => {
    if (!discordClientId) {
      setDiscordAuthError('Discord OAuth is not configured. Set the VITE_DISCORD_CLIENT_ID environment variable.');
      return;
    }

    setDiscordAuthLoading(true);
    setDiscordAuthError('');

    const redirectUri = `${window.location.origin}/discord-callback.html`;
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', discordClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'identify');

    const popup = window.open(authUrl.toString(), 'discord-auth', 'width=500,height=700');
    if (!popup) {
      setDiscordAuthError('Popup blocked. Please allow popups for this site and try again.');
      setDiscordAuthLoading(false);
    }
  };

  const handleDiscordLogout = () => {
    localStorage.removeItem('discord-access-token');
    localStorage.removeItem('discord-user-id');
    localStorage.removeItem('discord-user-name');
    setDiscordUserId('');
    setDiscordUserName('');
    setDiscordAuthError('Please sign in with Discord to enable editing and clerk filing.');
    setShowForm(false);
    setShowReview(true);
    setClerkFilingEnabled(false);
    setSelectedEvidenceIds([]);
    setClerkFilingText('');
  };

  const startNewDocket = () => {
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to add a docket.');
      return;
    }
    setShowForm(true);
    setShowReview(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setDraftStep('case');
    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidenceForm());
  };

  const handleCaseTitleChange = (event) => {
    setDraft((prev) => ({ ...prev, title: event.target.value }));
  };

  const handleCaseTypeChange = (event) => {
    const nextType = event.target.value;
    setDraft((prev) => ({
      ...prev,
      caseType: nextType,
      evidence: prev.evidence.map((item) =>
        isPlaintiffProsecution(item.party)
          ? { ...item, party: defaultPartyForCaseType(nextType) }
          : item
      ),
    }));
    setEvidenceForm((prev) => ({
      ...prev,
      party: defaultPartyForCaseType(nextType),
    }));
  };

  const handleCaseSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setDraftStep('evidence');
  };

  const handleEvidenceTypeChange = (event) => {
    const type = event.target.value;
    setEvidenceForm((prev) => ({
      ...emptyEvidenceForm(draft.caseType || 'Criminal'),
      type,
    }));
  };

  const handleEvidenceChange = (event) => {
    const { name, value } = event.target;
    setEvidenceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWitnessChange = (index, field, value) => {
    if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setEvidenceForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addWitnessField = () => {
    setEvidenceForm((prev) => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: '', cid: '', phone: '', email: '' }],
    }));
  };

  const removeWitnessField = (index) => {
    setEvidenceForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, idx) => idx !== index),
    }));
  };

  const createPreviewUrl = (link) => {
    if (!link) return null;
    const trimmedLink = link.trim();
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(trimmedLink)) return trimmedLink;

    try {
      const url = new URL(trimmedLink);
      const hostname = url.hostname.toLowerCase();
      const pathname = url.pathname;

      if (hostname.endsWith('docs.google.com')) {
        const docMatch = pathname.match(/^\/document\/d\/([^/]+)/);
        const sheetMatch = pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
        const slideMatch = pathname.match(/^\/presentation\/d\/([^/]+)/);
        if (docMatch) return `https://docs.google.com/document/d/${docMatch[1]}/preview`;
        if (sheetMatch) return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`;
        if (slideMatch) return `https://docs.google.com/presentation/d/${slideMatch[1]}/preview`;
      }

      if (hostname.endsWith('drive.google.com')) {
        const fileMatch = pathname.match(/^\/file\/d\/([^/]+)/);
        if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
        const openId = url.searchParams.get('id');
        if (openId) return `https://drive.google.com/file/d/${openId}/preview`;
      }
    } catch (error) {
      return null;
    }

    return null;
  };

  const formatPhoneNumber = (value) => {
    const digits = String(value).replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleEvidenceSubmit = (event) => {
    event.preventDefault();
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to edit evidence.');
      return;
    }
    if (evidenceForm.type === 'Witness List') {
      const witnesses = evidenceForm.witnesses
        .map((witness) => ({
          name: witness.name.trim(),
          cid: witness.cid.trim(),
          phone: witness.phone.trim(),
          email: witness.email.trim(),
        }))
        .filter((witness) => witness.name);
      if (witnesses.length === 0) return;
      const nextEvidence = {
        id: editingEvidenceId || crypto.randomUUID(),
        type: 'Witness List',
        party: evidenceForm.party,
        witnesses,
      };

      setDraft((prev) => ({
        ...prev,
        evidence: editingEvidenceId
          ? prev.evidence.map((item) => (item.id === editingEvidenceId ? nextEvidence : item))
          : [...prev.evidence, nextEvidence],
      }));
    } else {
      if (!evidenceForm.number.trim() || !evidenceForm.title.trim() || !evidenceForm.link.trim()) return;
      const nextEvidence = {
        id: editingEvidenceId || crypto.randomUUID(),
        type: evidenceForm.type,
        party: evidenceForm.party,
        number: evidenceForm.number.trim(),
        title: evidenceForm.title.trim(),
        link: evidenceForm.link.trim(),
      };

      setDraft((prev) => ({
        ...prev,
        evidence: editingEvidenceId
          ? prev.evidence.map((item) => (item.id === editingEvidenceId ? nextEvidence : item))
          : [...prev.evidence, nextEvidence],
      }));
    }

    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidenceForm());
  };

  const handleEditEvidence = (evidence) => {
    setEditingEvidenceId(evidence.id);
    if (evidence.type === 'Witness List') {
      setEvidenceForm({
        type: evidence.type,
        party: evidence.party,
        number: '',
        title: '',
        link: '',
        witnesses: evidence.witnesses.map((witness) => ({
          name: witness.name || '',
          cid: witness.cid || '',
          phone: witness.phone || '',
          email: witness.email || '',
        })),
      });
    } else {
      setEvidenceForm({
        type: evidence.type,
        party: evidence.party,
        number: evidence.number,
        title: evidence.title,
        link: evidence.link,
        witnesses: [''],
      });
    }
  };

  const handleRemoveEvidence = (id) => {
    setDraft((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((item) => item.id !== id),
    }));
  };

  const handleSaveDocket = (event) => {
    event.preventDefault();
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to save a docket.');
      return;
    }
    if (!draft.title.trim() || draft.evidence.length === 0) return;

    const savedDocket = editingId
      ? { ...draft, id: editingId, updatedAt: Date.now() }
      : { ...draft, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };

    const updated = editingId
      ? dockets.map((docket) => (docket.id === editingId ? savedDocket : docket))
      : [savedDocket, ...dockets];

    setDockets(updated);
    setShowForm(false);
    setDraft(emptyDraft());
    setDraftStep('case');
    setEditingId(null);
    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidenceForm());
  };

  const handleDeleteDocket = (docketId) => {
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to delete a docket.');
      return;
    }
    setDockets((prev) => prev.filter((docket) => docket.id !== docketId));
    if (selectedDocketId === docketId) {
      setSelectedDocketId(null);
      setClerkFilingEnabled(false);
      setSelectedEvidenceIds([]);
      setClerkFilingText('');
    }
  };

  const handleEditDocket = (docket) => {
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to edit a docket.');
      return;
    }
    setShowForm(true);
    setShowReview(false);
    setEditingId(docket.id);
    setDraft({
      title: docket.title,
      evidence: docket.evidence,
      createdAt: docket.createdAt,
      updatedAt: docket.updatedAt,
      caseType: docket.caseType || 'Criminal',
    });
    setDraftStep('evidence');
    setEvidenceForm(emptyEvidenceForm(docket.caseType || 'Criminal'));
    setEditingEvidenceId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setDraft(emptyDraft());
    setDraftStep('case');
    setEditingId(null);
    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidenceForm());
  };

  const handleOpenReview = () => {
    setShowReview(true);
    setShowForm(false);
    setSelectedDocketId(null);
    document.getElementById('docket-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedDocket = useMemo(
    () => dockets.find((docket) => docket.id === selectedDocketId) || null,
    [dockets, selectedDocketId]
  );

  const casePartyOptions = (caseType) =>
    caseType === 'Civil' ? ['Plaintiff', 'Defendant'] : ['Prosecution', 'Defendant'];

  const getCasePartyName = (party, caseType = 'Criminal') => {
    if (isPlaintiffProsecution(party)) return caseType === 'Civil' ? 'Plaintiff' : 'Prosecution';
    if (isDefence(party)) return 'Defendant';
    return party;
  };

  useEffect(() => {
    if (!selectedDocket) {
      setSelectedEvidenceIds([]);
      setClerkFilingText('');
      setClerkFilingEnabled(false);
      setGuestLink('');
      setGuestLinkCopied(false);
      return;
    }

    if (!clerkFilingEnabled) {
      setSelectedEvidenceIds([]);
      setClerkFilingText('');
    }

    setGuestLink('');
    setGuestLinkCopied(false);
    setSelectedEvidenceIds([]);
    setClerkFilingText('');
  }, [selectedDocket, clerkFilingEnabled]);

  const isPlaintiffProsecution = (party) => /prosecution|plaintiff/i.test(party);
  const isDefence = (party) => /defendant|defence/i.test(party);

  const getPartyPrefix = (party, caseType = 'Criminal') => {
    if (isPlaintiffProsecution(party)) return caseType === 'Civil' ? 'Plaintiff' : 'Prosecution';
    if (isDefence(party)) return 'Defendant';
    return party;
  };

  const formatClerkFiling = (docket, evidenceItems) => {
    const lines = ['```'];
    if (!docket || evidenceItems.length === 0) {
      lines.push('```');
      return lines.join('\n');
    }

    lines.push(docket.title, '');

    evidenceItems.forEach((item, index) => {
      const prefix = getPartyPrefix(item.party, docket.caseType || 'Criminal');
      const label = item.number ? `${prefix} ${item.number}: ${item.title}` : `${prefix}: ${item.title || item.type}`;
      lines.push(label);
      if (item.link) {
        lines.push(`Link: ${item.link}`);
      }
      if (index < evidenceItems.length - 1) {
        lines.push('');
      }
    });

    lines.push('');
    lines.push('```');
    return lines.join('\n');
  };

  const toggleEvidenceSelection = (id) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const generateClerkFiling = () => {
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to generate clerk filings.');
      return;
    }
    if (!selectedDocket) return;
    const selectedEvidence = selectedDocket.evidence.filter((item) => selectedEvidenceIds.includes(item.id));
    setClerkFilingText(formatClerkFiling(selectedDocket, selectedEvidence));
  };

  const copyClerkFiling = async () => {
    if (!clerkFilingText) return;
    try {
      await navigator.clipboard.writeText(clerkFilingText);
      setCopyButtonText('Copied!');
      window.setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const generateGuestLink = () => {
    if (!isAuthorized) {
      setDiscordAuthError('You must be signed in with the permitted Discord account to create guest links.');
      return;
    }
    if (!selectedDocket) return;

    const expiresAt = Date.now() + GUEST_LINK_TTL_MS;
    const payload = {
      version: 1,
      expiresAt,
      docket: buildGuestDocket(selectedDocket),
    };
    const token = encodeGuestPayload(payload);
    if (!token) {
      setDiscordAuthError('Unable to create guest link.');
      return;
    }

    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('guest', token);

    setGuestLink(url.toString());
    setGuestLinkCopied(false);
  };

  const copyGuestLink = async () => {
    if (!guestLink) return;
    try {
      await navigator.clipboard.writeText(guestLink);
      setGuestLinkCopied(true);
      window.setTimeout(() => setGuestLinkCopied(false), 2000);
    } catch (error) {
      console.error('Guest link copy failed', error);
    }
  };

  const openLinkPreview = (link) => {
    if (!link) return;
    const previewUrl = createPreviewUrl(link);
    if (!previewUrl) return;
    setPreviewOverlay(previewUrl);
  };

  const openLinkInNewTab = (link) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const closePreview = () => setPreviewOverlay(null);

  const previewUrl = createPreviewUrl(evidenceForm.link);
  const prosecutionEvidence = draft.evidence.filter((item) => isPlaintiffProsecution(item.party));
  const defendantEvidence = draft.evidence.filter((item) => isDefence(item.party));

  if (guestView) {
    return (
      <div className="app-shell">
        <div className="glass-panel">
          <section className="docket-detail-section guest-detail-section">
            {guestView.expired || !guestView.docket ? (
              <div className="empty-state">
                This guest link has expired. Please request a fresh link from the case owner.
              </div>
            ) : (
              <>
                <div className="section-heading">
                  <h2>{guestView.docket.title}</h2>
                  <span>{guestView.docket.evidence.length} evidence items</span>
                </div>
                <div className="docket-detail-meta">
                  <span>{guestView.docket.caseType || 'Criminal'} case</span>
                  {guestView.docket.createdAt ? (
                    <span>{new Date(guestView.docket.createdAt).toLocaleDateString()}</span>
                  ) : null}
                  {guestView.expiresAt ? (
                    <span>Access expires: {new Date(guestView.expiresAt).toLocaleString()}</span>
                  ) : null}
                </div>
                <p className="clerk-filing-hint">Read-only guest view with access to this case only.</p>

                <div className="selected-evidence-list">
                  {guestView.docket.evidence.map((item) => (
                    <div key={item.id} className="selected-evidence-row">
                      <div className="selected-evidence-header">
                        <span className="evidence-type">{item.type}</span>
                        <span className="evidence-party">{getCasePartyName(item.party, guestView.docket.caseType || 'Criminal')}</span>
                      </div>
                      {item.type === 'Witness List' ? (
                        <div className="witness-list">
                          <strong>Witnesses</strong>
                          <ul>
                            {(item.witnesses || []).map((witness, idx) => (
                              <li key={`${item.id}-${idx}`}>
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
                          {item.link ? (
                            <div className="selected-evidence-link-row">
                              <a
                                className="text-button open-new-tab-button"
                                href={item.link}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                Open evidence link
                              </a>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="glass-panel">
        <HeroPanel
          showForm={showForm}
          showReview={showReview}
          startNewDocket={startNewDocket}
          handleOpenReview={handleOpenReview}
          isAuthorized={isAuthorized}
          discordUserId={discordUserId}
          discordUserName={discordUserName}
          discordAuthError={discordAuthError}
          discordAuthLoading={discordAuthLoading}
          handleDiscordLogin={handleDiscordLogin}
          handleDiscordLogout={handleDiscordLogout}
        />

        {showForm && (
          <DocketEditor
            draft={draft}
            draftStep={draftStep}
            editingId={editingId}
            editingEvidenceId={editingEvidenceId}
            handleCaseTitleChange={handleCaseTitleChange}
            handleCaseTypeChange={handleCaseTypeChange}
            handleCaseSubmit={handleCaseSubmit}
            handleEvidenceTypeChange={handleEvidenceTypeChange}
            handleEvidenceChange={handleEvidenceChange}
            handleEvidenceSubmit={handleEvidenceSubmit}
            evidenceForm={evidenceForm}
            caseTypes={caseTypes}
            casePartyOptions={casePartyOptions}
            evidenceTypes={evidenceTypes}
            previewUrl={previewUrl}
            handleWitnessChange={handleWitnessChange}
            addWitnessField={addWitnessField}
            removeWitnessField={removeWitnessField}
            handleEditEvidence={handleEditEvidence}
            handleRemoveEvidence={handleRemoveEvidence}
            handleCancel={handleCancel}
            handleSaveDocket={handleSaveDocket}
            setDraftStep={setDraftStep}
            prosecutionEvidence={prosecutionEvidence}
            defendantEvidence={defendantEvidence}
            formatPhoneNumber={formatPhoneNumber}
            openLinkPreview={openLinkPreview}
            openLinkInNewTab={openLinkInNewTab}
            isAuthorized={isAuthorized}
            discordAuthError={discordAuthError}
          />
        )}

        {showReview && (
          <DocketReview
            dockets={dockets}
            selectedDocketId={selectedDocketId}
            selectedDocket={selectedDocket}
            setSelectedDocketId={setSelectedDocketId}
            handleEditDocket={handleEditDocket}
            handleDeleteDocket={handleDeleteDocket}
            clerkFilingEnabled={clerkFilingEnabled}
            setClerkFilingEnabled={setClerkFilingEnabled}
            selectedEvidenceIds={selectedEvidenceIds}
            toggleEvidenceSelection={toggleEvidenceSelection}
            generateClerkFiling={generateClerkFiling}
            clerkFilingText={clerkFilingText}
            copyClerkFiling={copyClerkFiling}
            copyButtonText={copyButtonText}
            formatPhoneNumber={formatPhoneNumber}
            openLinkPreview={openLinkPreview}
            openLinkInNewTab={openLinkInNewTab}
            isPlaintiffProsecution={isPlaintiffProsecution}
            isDefence={isDefence}
            isAuthorized={isAuthorized}
            discordAuthError={discordAuthError}
            guestLink={guestLink}
            generateGuestLink={generateGuestLink}
            copyGuestLink={copyGuestLink}
            guestLinkCopied={guestLinkCopied}
          />
        )}

        {previewOverlay && <OverlayPreview previewUrl={previewOverlay} onClose={closePreview} />}
        <footer className="app-footer">
          This is a prototype tool, please use with caution as bugs may occur. Prototype Tool built by Colin Burns. 
          Please contact burning.2k25 to report errors
        </footer>
      </div>
    </div>
  );
}

export default App;
