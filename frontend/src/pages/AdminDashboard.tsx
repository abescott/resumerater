import React, { useState, useEffect } from 'react';

import api from '../services/api';
import type { Job } from '../types';
import '../App.css'; // Using the CSS the user created

const AdminDashboard: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [ratingEnabled, setRatingEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const handleSelectJob = (job: Job) => {
        setSelectedJob(job);
        setEditDescription(job.description || '');
        setRatingEnabled(job.ratingEnabled !== false);
        setMessage('');
    };

    const handleUpdate = async () => {
        if (!selectedJob) return;
        setLoading(true);
        try {
            await api.put(`/jobs/${selectedJob._id}`, {
                description: editDescription,
                ratingEnabled: ratingEnabled
            });
            setMessage('Job updated successfully.');
            fetchJobs();

            setSelectedJob(prev => prev ? {
                ...prev,
                description: editDescription,
                descriptionManuallyUpdated: true,
                ratingEnabled: ratingEnabled
            } : null);

        } catch (error) {
            console.error('Error updating job:', error);
            setMessage('Failed to update job.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginTop: 0 }}>Resume Rater Admin</h1>
            <div className="layout">
                <div className="sidebar" style={{ background: 'transparent' }}> {/* Override if needed */}
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Jobs</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {jobs.map(job => (
                            <li
                                key={job._id}
                                className={selectedJob?._id === job._id ? 'active' : ''}
                                onClick={() => handleSelectJob(job)}
                                style={{
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: selectedJob?._id === job._id ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                                    color: selectedJob?._id === job._id ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 500 }}>{job.title}</div>
                                    <div className="status-icons" style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.8 }}>
                                        {job.ratingEnabled !== false ? '🟢 Rating On' : '🔴 Rating Off'}
                                        {job.descriptionManuallyUpdated && ' • ✏️ Manual'}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="content" style={{ flex: 1, paddingLeft: '2rem' }}>
                    {selectedJob ? (
                        <div className="editor">
                            <h2 style={{ marginTop: 0 }}>Edit Description: {selectedJob.title}</h2>
                            <div className="meta" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                <span>{selectedJob.department}</span> • <span>{selectedJob.location}</span>
                            </div>

                            <div className="controls" style={{ marginBottom: '1rem' }}>
                                <label className="toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={ratingEnabled}
                                        onChange={(e) => setRatingEnabled(e.target.checked)}
                                        style={{ width: '1.2rem', height: '1.2rem' }}
                                    />
                                    Enable AI Rating for this Job
                                </label>
                            </div>

                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Paste Job Description Here..."
                                rows={20}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    marginBottom: '1rem'
                                }}
                            />

                            <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                {message && <p className="message" style={{ margin: 0, color: message.includes('Success') ? '#34d399' : '#f87171' }}>{message}</p>}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)' }}>Select a job to edit its description.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
