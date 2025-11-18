import React, { useEffect, useState } from 'react';

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3010';

export default function CandidateList() {
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchList() {
      if (!q || q.trim().length === 0) {
        setCandidates([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/candidates/autocomplete?q=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setCandidates(data || []);
      } catch (err: any) {
        setError(err?.message || 'Error fetching candidates');
      } finally {
        setLoading(false);
      }
    }

    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [q]);

  // Professional centered search styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  };

  const panelStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 920,
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)',
    padding: 20,
    boxSizing: 'border-box',
    border: '1px solid rgba(15,23,42,0.04)',
  };

  const searchRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  };

  const inputWrapStyle: React.CSSProperties = {
    position: 'relative',
    flex: '1 1 600px',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 44px 12px 44px',
    borderRadius: 10,
    border: '1px solid rgba(15,23,42,0.08)',
    background: '#fafafa',
    fontSize: 15,
    outline: 'none',
    transition: 'box-shadow 160ms ease, background 160ms ease, transform 120ms ease',
  };

  const inputFocusStyle: React.CSSProperties = {
    boxShadow: '0 6px 18px rgba(11,105,255,0.12)',
    background: '#fff',
    transform: 'translateY(-1px)',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    width: 20,
    height: 20,
    color: '#6b7280',
    pointerEvents: 'none',
  };

  const clearBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: '#0b69ff',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 8,
    fontWeight: 600,
  };

  const listItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 8,
    background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%)',
    border: '1px solid rgba(15,23,42,0.04)',
  };

  // local state for focus effect
  const [focused, setFocused] = useState(false);

  return (
    <section aria-label="Lista de candidatos" style={containerStyle}>
      <div style={panelStyle}>
        <div style={searchRowStyle}>
          <div style={inputWrapStyle}>
            <svg style={iconStyle} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <input
              id="candidate-search"
              placeholder="Buscar candidatos por nombre, apellidos o email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
              aria-label="Buscar candidatos"
            />
          </div>

          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Limpiar búsqueda"
            style={clearBtnStyle}
          >
            Limpiar
          </button>
        </div>

        {loading && <div role="status" style={{ color: '#374151' }}>Cargando...</div>}
        {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

        {!loading && candidates.length === 0 && q.trim().length > 0 && (
          <div role="status" style={{ color: '#6b7280' }}>No se encontraron candidatos.</div>
        )}

        {!loading && candidates.length === 0 && q.trim().length === 0 && (
          <div role="status" style={{ color: '#6b7280' }}>Escribe en el cuadro de búsqueda para listar candidatos.</div>
        )}

        {candidates.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
            {candidates.map((c) => (
              <li key={c.id} style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {c.firstName} {c.lastName}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{c.email}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}