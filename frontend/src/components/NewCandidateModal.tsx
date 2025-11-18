import React from 'react';
import AddCandidateForm from './AddCandidateForm';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewCandidateModal({ isOpen, onClose, onSuccess }: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-candidate-title"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="document"
        style={{
          width: 720,
          maxWidth: '100%',
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="new-candidate-title" style={{ marginTop: 0 }}>Add Candidate</h2>

        {/* Reuse AddCandidateForm which implements RHF + Yup, file upload progress and accessible UI */}
        <AddCandidateForm
          onSuccess={() => {
            onSuccess && onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}