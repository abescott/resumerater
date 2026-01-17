import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JobListing from './pages/JobListing';
import JobApplicants from './pages/JobApplicants';
import ApplicantDetail from './pages/ApplicantDetail';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Route - Full Width (No Sidebar) */}
        <Route path="/admin" element={
          <Layout withSidebar={false}>
            <AdminDashboard />
          </Layout>
        } />

        {/* Job Routes - With Sidebar */}
        <Route path="/jobs" element={
          <Layout withSidebar={true}>
            <JobListing />
          </Layout>
        } />

        <Route path="/jobs/:id" element={
          <Layout withSidebar={true}>
            <JobApplicants />
          </Layout>
        } />

        <Route path="/applicants/:id" element={
          <Layout withSidebar={false}>
            <ApplicantDetail />
          </Layout>
        } />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
