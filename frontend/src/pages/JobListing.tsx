import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Job } from '../types';

const JobListing: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await api.get('/jobs');
                setJobs(response.data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading positions...</div>
            </div>
        );
    }

    return (
        <div>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    Resume<span className="text-gradient">Rater</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    AI-Powered Applicant Tracking System
                </p>
            </header>

            <div className="grid-cols-auto">
                {jobs.map((job) => (
                    <Link
                        to={`/jobs/${job._id}`} // Using _id as backend expects it for lookups
                        key={job._id}
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <span style={{
                                    backgroundColor: job.status === 'Open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                    color: job.status === 'Open' ? '#34d399' : '#94a3b8',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    {job.status}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {new Date(job.dateOpened).toLocaleDateString()}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{job.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                {job.department} · {job.location}
                            </p>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    View Applicants &rarr;
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default JobListing;
