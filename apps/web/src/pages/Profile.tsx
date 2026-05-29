import { Header } from '../components/Header'
import { WorkerHeader } from '../components/WorkerHeader'
import { ProfileForm } from '../components/ProfileForm'
import { useMe } from '../api/me'

export default function Profile() {
  const me = useMe()
  const isClient = me.data?.role === 'CLIENT'
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {isClient ? <Header /> : <WorkerHeader />}
      <main className="fade-up">
        <div style={{ background: 'var(--bg-tint)', borderBottom: '1px solid var(--line)' }}>
          <div className="container" style={{ padding: '28px 24px' }}>
            <div className="label">Tu cuenta</div>
            <h1 style={{ fontSize: 36, marginTop: 4 }}>Mi perfil</h1>
          </div>
        </div>
        <div className="container" style={{ padding: '24px 24px 64px', maxWidth: 560 }}>
          <div className="card" style={{ padding: 24 }}>
            <ProfileForm />
          </div>
        </div>
      </main>
    </div>
  )
}
