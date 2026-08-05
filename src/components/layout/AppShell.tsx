import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AppShell() {
  return (
    <div className="app-atmosphere flex min-h-svh flex-col">
      <Navbar />
      <main className="panel-grid flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
