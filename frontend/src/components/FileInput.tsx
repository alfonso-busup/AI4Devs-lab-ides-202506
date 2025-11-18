import React from 'react';

type Props = {
  id?: string;
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  file?: File | null;
  onChange: (file: File | null) => void;
  ariaLabel?: string;
};

export default function FileInput({
  id,
  name = 'file',
  accept = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  maxSizeMB = 10,
  file,
  onChange,
  ariaLabel = 'CV file input',
}: Props) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (f) {
      const tooLarge = f.size > maxSizeMB * 1024 * 1024;
      if (tooLarge) {
        onChange(null); // signal upstream about invalid/too large file
        return;
      }
    }
    onChange(f);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 14 }}>
        CV (PDF / DOC / DOCX, max {maxSizeMB}MB)
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={handle}
        aria-label={ariaLabel}
        style={{ padding: 6 }}
      />
      {file && (
        <div style={{ fontSize: 13, color: '#333' }}>
          Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
        </div>
      )}
    </div>
  );
}