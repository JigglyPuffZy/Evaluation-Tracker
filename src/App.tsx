import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './context/AuthContext'
import { EvaluationDataProvider } from './context/EvaluationDataContext'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProgramDetailPage } from './pages/ProgramDetailPage'
import { CsfFormDetailPage } from './pages/CsfFormDetailPage'
import { FeedbackFormsPage } from './pages/FeedbackFormsPage'
import { PublicFeedbackPage } from './pages/PublicFeedbackPage'
import { ProgramsPage } from './pages/ProgramsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EvaluationDataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/f/:slug" element={<PublicFeedbackPage />} />
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/forms" element={<FeedbackFormsPage />} />
                  <Route path="/csf/:formId" element={<CsfFormDetailPage />} />
                  <Route path="/programs" element={<ProgramsPage />} />
                  <Route path="/programs/:programId" element={<ProgramDetailPage />} />
                  <Route path="/evaluations" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </EvaluationDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
