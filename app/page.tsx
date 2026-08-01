export default function Home() {
  return (
    <main className="min-h-screen bg-bg p-10">
      <div className="rounded-token border border-default bg-surface p-6 shadow-token">
        <h1 className="text-fg text-2xl font-semibold">Test des tokens</h1>
        <p className="text-muted mt-2">Texte secondaire sur surface.</p>
        <button className="bg-accent text-on-accent rounded-token mt-4 px-4 py-2">
          Action principale
        </button>
      </div>
    </main>
  )
}
