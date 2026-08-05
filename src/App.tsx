import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { EvaluationDataProvider } from './context/EvaluationDataContext'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProgramDetailPage } from './pages/ProgramDetailPage'
import { ProgramsPage } from './pages/ProgramsPage'

export default function App() {
  return (
    <ThemeProvider>
      <EvaluationDataProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/:programId" element={<ProgramDetailPage />} />
            <Route path="/evaluations" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </EvaluationDataProvider>
    </ThemeProvider>
  )
}
