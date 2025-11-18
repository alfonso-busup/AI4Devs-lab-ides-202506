import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FileInput from './FileInput';

const MAX_FILE_MB = 10;
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const phoneRegex = /^\+?[0-9\s\-().]{7,30}$/;

const schema = yup
  .object({
    firstName: yup.string().trim().required('First name is required').max(100),
    lastName: yup.string().trim().required('Last name is required').max(100),
    email: yup.string().trim().required('Email is required').email('Invalid email'),
    phone: yup.string().trim().notRequired().matches(phoneRegex, 'Invalid phone').nullable(),
    address: yup.string().trim().notRequired().max(2000).nullable(),
    education: yup.string().notRequired().nullable(),
    workExperience: yup.string().notRequired().nullable(),
    cv: yup
      .mixed()
      .test('fileSize', `File must be <= ${MAX_FILE_MB} MB`, (value: any) => {
        if (!value) return true;
        return value.size <= MAX_FILE_MB * 1024 * 1024;
      })
      .test('fileType', 'Unsupported file type', (value: any) => {
        if (!value) return true;
        return ALLOWED_MIMES.includes(value.type);
      })
      .nullable(),
  })
  .required();

// infer form values from schema
type FormValues = yup.InferType<typeof schema>;

export default function AddCandidateForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: undefined,
      address: undefined,
      education: undefined,
      workExperience: undefined,
      cv: undefined,
    } as unknown as FormValues,
  });

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  // API base (configurable)
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3010';

  // Helper: upload with XHR to get progress callbacks
  function uploadWithProgress(url: string, formData: FormData, onProgress: (percent: number) => void) {
    return new Promise<{ status: number; body: any }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        const status = xhr.status;
        let body: any = null;
        try {
          body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          body = xhr.responseText;
        }
        resolve({ status, body });
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));

      xhr.send(formData);
    });
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError(null);
    setSuccessMessage(null);
    setUploadProgress(null);

    const form = new FormData();
    form.append('firstName', data.firstName.trim());
    form.append('lastName', data.lastName.trim());
    form.append('email', data.email.trim());
    if (data.phone) form.append('phone', data.phone.trim());
    if (data.address) form.append('address', data.address.trim());
    if (data.education) form.append('education', data.education.trim());
    if (data.workExperience) form.append('workExperience', data.workExperience.trim());
    if (data.cv) form.append('cv', data.cv as Blob);

    try {
      const { status, body } = await uploadWithProgress(`${API_BASE}/api/candidates`, form, (p) => {
        setUploadProgress(p);
      });

      // handle responses
      if (status === 201) {
        setSuccessMessage('Candidate added successfully.');
        reset();
        setUploadProgress(null);
        onSuccess && onSuccess();
      } else if (status === 409) {
        setServerError(body?.error || 'Duplicate email');
      } else if (status === 413) {
        setServerError(body?.error || 'Uploaded file too large');
      } else if (status >= 400 && status < 500) {
        setServerError(body?.error || `Validation error (${status})`);
      } else {
        setServerError(body?.error || `Server error (${status})`);
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error');
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
      <div
        style={{
          background: '#ffffff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
          border: '1px solid rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Row: First + Last */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label htmlFor="firstName" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>
              First name*
            </label>
            <input
              id="firstName"
              {...register('firstName')}
              ref={(e) => { register('firstName').ref(e); firstNameRef.current = e; }}
              aria-describedby={errors.firstName ? 'err-firstName' : undefined}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.08)',
                background: '#fbfdff',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
            {errors.firstName && <div id="err-firstName" role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{errors.firstName.message}</div>}
          </div>

          <div style={{ flex: '1 1 280px' }}>
            <label htmlFor="lastName" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>
              Last name*
            </label>
            <input
              id="lastName"
              {...register('lastName')}
              aria-describedby={errors.lastName ? 'err-lastName' : undefined}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.08)',
                background: '#fbfdff',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
            {errors.lastName && <div id="err-lastName" role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{errors.lastName.message}</div>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>Email*</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            aria-describedby={errors.email ? 'err-email' : undefined}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(15,23,42,0.08)',
              background: '#fbfdff',
              fontSize: 15,
              boxSizing: 'border-box',
            }}
          />
          {errors.email && <div id="err-email" role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{errors.email.message}</div>}
        </div>

        {/* Phone + Address */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label htmlFor="phone" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>Phone</label>
            <input
              id="phone"
              {...register('phone')}
              aria-describedby={errors.phone ? 'err-phone' : undefined}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.08)',
                background: '#fbfdff',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
            {errors.phone && <div id="err-phone" role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{errors.phone.message}</div>}
          </div>

          <div style={{ flex: '1 1 420px' }}>
            <label htmlFor="address" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>Address</label>
            <textarea
              id="address"
              {...register('address')}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.08)',
                background: '#fbfdff',
                fontSize: 15,
                minHeight: 56,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Education + Work */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px' }}>
            <label htmlFor="education" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>Education</label>
            <textarea id="education" {...register('education')} placeholder='Free text or JSON array, e.g. [{"degree":"BSc","year":2018}]' style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', background: '#fbfdff', minHeight: 88, boxSizing: 'border-box', fontSize: 15 }} />
          </div>

          <div style={{ flex: '1 1 340px' }}>
            <label htmlFor="workExperience" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#0f172a' }}>Work experience</label>
            <textarea id="workExperience" {...register('workExperience')} placeholder='Free text or JSON array' style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', background: '#fbfdff', minHeight: 88, boxSizing: 'border-box', fontSize: 15 }} />
          </div>
        </div>

        {/* File input */}
        <div>
          <Controller
            control={control}
            name="cv"
            render={({ field }) => {
              const file = (field.value as unknown) as File | null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#0f172a' }}>CV (pdf/doc/docx)</label>
                  <FileInput id="cv" name="cv" file={file ?? null} onChange={(f) => field.onChange(f)} maxSizeMB={MAX_FILE_MB} />
                </div>
              );
            }}
          />
          {errors.cv && <div role="alert" style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{errors.cv.message}</div>}
        </div>

        {/* upload progress bar */}
        {uploadProgress !== null && (
          <div aria-live="polite" style={{ marginTop: 6 }}>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg,#0b69ff,#60a5fa)', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: '#374151' }}>{uploadProgress}%</div>
          </div>
        )}

        {/* server messages */}
        {serverError && (
          <div role="alert" style={{ color: '#dc2626', fontSize: 14 }}>
            {serverError}
          </div>
        )}
        {successMessage && (
          <div role="status" style={{ color: '#16a34a', fontSize: 14 }}>
            {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || uploadProgress !== null}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(15,23,42,0.06)',
              background: '#ffffff',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting || uploadProgress !== null}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: !isValid || isSubmitting || uploadProgress !== null ? 'rgba(11,105,255,0.45)' : 'linear-gradient(90deg,#0b69ff,#2563eb)',
              color: '#fff',
              cursor: !isValid || isSubmitting || uploadProgress !== null ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Candidate'}
          </button>
        </div>
      </div>
    </form>
  );
}