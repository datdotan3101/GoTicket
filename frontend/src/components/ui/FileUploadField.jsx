import { useState } from 'react'
import { toast } from 'react-toastify'
import { UploadCloud } from 'lucide-react'
import { uploadService } from '../../services/uploadService'
import { unwrapData } from '../../utils/apiData'

/**
 * Reusable File Upload field for admin forms.
 * 
 * Props:
 *  - label: string — the label text
 *  - value: string — current URL
 *  - onChange: (url: string) => void — called with the uploaded URL
 *  - accept: string — file accept types (default: "image/*")
 *  - previewType: 'logo' | 'banner' — controls preview layout
 *  - icon: ReactNode — custom icon (defaults to UploadCloud)
 *  - placeholder: string — upload hint text
 */
export default function FileUploadField({
  label = 'File',
  value = '',
  onChange,
  accept = 'image/*',
  previewType = 'logo',
  icon = <UploadCloud size={32} strokeWidth={1.5} color="var(--color-slate-400)" />,
  placeholder = 'Click to upload file'
}) {
  const [uploading, setUploading] = useState(false)
  const [lastFileName, setLastFileName] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Prevent re-uploading the exact same file in this session
    if (file.name === lastFileName) {
      e.target.value = '' // Reset input
      return
    }

    setUploading(true)
    try {
      const res = await uploadService.uploadFile(file)
      const data = unwrapData(res)
      const newUrl = data.url || data

      if (newUrl === value) {
        toast.info('This is the exact same image. No changes made.')
      } else {
        onChange(newUrl)
        setLastFileName(file.name)
        toast.success('File uploaded successfully.')
      }
    } catch {
      toast.error('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-slate-500)', letterSpacing: '1px' }}>
        {label}
      </label>
      {!value && (
        <div style={{
          border: '2px dashed var(--color-slate-300)',
          borderRadius: '16px',
          padding: '30px',
          textAlign: 'center',
          background: 'var(--color-slate-100)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          <input
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploading ? '⏳' : icon}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-slate-600)', fontWeight: 700 }}>
              {uploading ? 'Uploading...' : placeholder}
            </span>
          </div>
        </div>
      )}

      {/* Preview */}
      {value && previewType === 'logo' && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: 'var(--color-slate-50)',
          borderRadius: '16px',
          border: '1px solid var(--color-slate-200)'
        }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', background: 'var(--color-white)', padding: '6px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>File uploaded</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Ready to save</div>
          </div>
          <button 
            type="button" 
            onClick={() => onChange('')}
            style={{ padding: '8px 12px', background: 'var(--color-danger-light)', border: '1px solid #fecaca', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      )}

      {value && previewType === 'banner' && (
        <div style={{
          marginTop: '16px',
          borderRadius: '16px',
          overflow: 'hidden',
          height: '120px',
          border: '4px solid var(--color-slate-50)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <img
            src={value}
            alt="Banner Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <label 
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-danger)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            {uploading ? '⏳...' : 'Change'}
            <input
              type="file"
              accept={accept}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  )
}
