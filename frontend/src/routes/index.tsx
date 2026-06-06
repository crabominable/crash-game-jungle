import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main>
      <h1>Crash Game frontend scaffold</h1>
      <p>Workspace restored. Gameplay UI comes in later MVP commits.</p>
    </main>
  )
}
