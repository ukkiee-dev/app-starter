import { env } from './env';

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>{{SERVICE_NAME}}</h1>
      <p>SPA template — Vite + React + Caddy runtime.</p>
      <section>
        <h2>Environment</h2>
        <pre style={{ background: '#f6f8fa', padding: '1rem', borderRadius: 6 }}>
{JSON.stringify(env, null, 2)}
        </pre>
        <p>
          값은 Vite 가 빌드 타임에 <code>import.meta.env.VITE_*</code> 로 번들에 인라인합니다.
          Dev 에서는 <code>.env.local</code>, prod 는 <code>.env.production</code> 또는
          build arg 로 주입.
        </p>
      </section>
    </main>
  );
}
