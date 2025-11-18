import React, { useState } from 'react';
import NewCandidateModal from './NewCandidateModal';

export default function DashboardHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #eee',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 18 }}>Recruiter Dashboard</h1>
      </div>

      <div>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: '#0b69ff',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
          aria-haspopup="dialog"
        >
          Add Candidate
        </button>
      </div>

      <NewCandidateModal isOpen={open} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
    </header>
  );
}