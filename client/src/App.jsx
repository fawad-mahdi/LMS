import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';

import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Trainings      from './pages/Trainings';
import TrainingDetail from './pages/TrainingDetail';
import TrainingForm   from './pages/TrainingForm';
import Assignments    from './pages/Assignments';
import AssignmentForm from './pages/AssignmentForm';
import Certifications from './pages/Certifications';
import Users          from './pages/Users';
import UserForm       from './pages/UserForm';
import UserDetail     from './pages/UserDetail';

function Protected({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

            <Route path="/trainings" element={<Protected><Trainings /></Protected>} />
            <Route path="/trainings/new" element={<Protected roles={['admin', 'instructor']}><TrainingForm /></Protected>} />
            <Route path="/trainings/:id" element={<Protected><TrainingDetail /></Protected>} />
            <Route path="/trainings/:id/edit" element={<Protected roles={['admin', 'instructor']}><TrainingForm /></Protected>} />

            <Route path="/assignments" element={<Protected><Assignments /></Protected>} />
            <Route path="/assignments/new" element={<Protected roles={['admin']}><AssignmentForm /></Protected>} />
            <Route path="/certifications" element={<Protected roles={['admin', 'manager']}><Certifications /></Protected>} />

            <Route path="/users" element={<Protected roles={['admin']}><Users /></Protected>} />
            <Route path="/users/new" element={<Protected roles={['admin']}><UserForm /></Protected>} />
            <Route path="/users/:id" element={<Protected roles={['admin']}><UserDetail /></Protected>} />
            <Route path="/users/:id/edit" element={<Protected roles={['admin']}><UserForm /></Protected>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
