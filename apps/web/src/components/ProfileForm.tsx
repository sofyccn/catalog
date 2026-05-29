import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import { useMe, useUpdateProfile, useUploadPhoto } from '../api/me'
import { getApiErrorMessage } from '../lib/api'

/** Reusable profile form — used on /perfil and embedded in the Pending screen. */
export function ProfileForm() {
  const me = useMe()
  const update = useUpdateProfile()
  const photo = useUploadPhoto()
  const user = me.data

  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setPhone(user.phone ?? '')
      setCity(user.city ?? '')
      setCompany(user.company ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const submit = () => {
    update.mutate(
      { phone: phone.trim() || null, city: city.trim() || null, company: company.trim() || null },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2200)
        },
      },
    )
  }

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) photo.mutate(f)
    e.target.value = ''
  }

  if (me.isLoading || !user) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ink-faint)' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Avatar + photo upload */}
      <div className="row" style={{ gap: 16, alignItems: 'center' }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--bg-tint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {user.photoUrl ? (
            <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={36} color="var(--ink-faint)" />
          )}
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn ghost sm" disabled={photo.isPending}>
            {photo.isPending ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
            {user.photoUrl ? ' Cambiar foto' : ' Subir foto'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
          <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>JPG o PNG (máx 4MB)</p>
        </div>
      </div>

      {/* Read-only Clerk-owned fields */}
      <div className="card" style={{ padding: 14, background: 'var(--bg-tint)' }}>
        <div className="label">Datos de tu cuenta</div>
        <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{user.fullName}</div>
        <div className="muted" style={{ fontSize: 13 }}>{user.email}</div>
        <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>
          Para cambiar nombre o contraseña, abre el menú de tu cuenta (foto arriba a la derecha).
        </p>
      </div>

      <Field label="Teléfono">
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09 9999 9999" />
      </Field>
      <Field label="Ciudad">
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tisaleo / Guayllabamba / …" />
      </Field>
      <Field label="Empresa o finca (opcional)">
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ej. Finca San Pedro" />
      </Field>

      {update.isError && <p style={{ color: 'var(--red)', fontSize: 13 }}>{getApiErrorMessage(update.error)}</p>}
      {photo.isError && <p style={{ color: 'var(--red)', fontSize: 13 }}>{getApiErrorMessage(photo.error)}</p>}

      <button onClick={submit} disabled={update.isPending} className="btn primary lg" style={{ padding: 14 }}>
        {update.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
        {saved ? 'Guardado ✓' : 'Guardar perfil'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}
