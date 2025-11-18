import React, { useEffect, useRef, useState } from 'react';
import FileInput from './FileInput';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function NewCandidateModal({ isOpen, onClose, onSuccess }: Props) {
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [education, setEducation] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstNameRef.current?.focus(), 0);
      setMessage(null);
      setError(null);
    }
  }, [isOpen]);

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name and email are required.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Invalid email format.');
      return;
    }

    const form = new FormData();
    form.append('firstName', firstName.trim());
    form.append('lastName', lastName.trim());
    form.append('email', email.trim());
    if (phone.trim()) form.append('phone', phone.trim());
    if (address.trim()) form.append('address', address.trim());
    if (education.trim()) form.append('education', education.trim());
    if (workExperience.trim()) form.append('workExperience', workExperience.trim());
    if (file) form.append('cv', file);

    try {
      setLoading(true);
      const res = await fetch('/api/candidates', {
        method: 'POST',
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setMessage('Candidate added successfully.');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setEducation('');
        setWorkExperience('');
        setFile(null);
        onSuccess && onSuccess();
      } else {
        setError(body?.error || `Server returned ${res.status}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  // don't render form when modal is closed
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
        // close when clicking backdrop
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
        onClick={(e) => e.stopPropagation()} // prevent backdrop click when interacting inside
      >
        <h2 id="new-candidate-title" style={{ marginTop: 0 }}>Add Candidate</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={firstNameRef}
              placeholder="First name*"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ flex: 1, padding: 8 }}
              aria-required
            />
            <input
              placeholder="Last name*"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ flex: 1, padding: 8 }}
              aria-required
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="Email*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 8 }}
              aria-required
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <textarea
              placeholder="Education (JSON or text)"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              style={{ flex: 1, padding: 8, minHeight: 60 }}
            />
            <textarea
              placeholder="Work experience (JSON or text)"
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              style={{ flex: 1, padding: 8, minHeight: 60 }}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <FileInput
              file={file}
              onChange={setFile}
              ariaLabel="Candidate CV file input"
              maxSizeMB={10}
            />
          </div>

          {error && (
            <div role="alert" style={{ color: 'crimson', marginTop: 8 }}>
              {error}
            </div>
          )}
          {message && (
            <div role="status" style={{ color: 'green', marginTop: 8 }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 12px' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
              {loading ? 'Saving...' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}