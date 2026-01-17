import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import type { Job } from '../types';

const Sidebar: React.FC = () => {
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

    return (
        <aside style={{
            width: '280px',
            height: 'calc(100vh - 60px)',
            position: 'fixed',
            left: 0,
            top: '60px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                    Resume<span className="text-gradient">Rater</span>
                </h1>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
                <h3 style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.75rem'
                }}>
                    Jobs
                </h3>

                {loading ? (
                    <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {jobs.map((job) => (
                            <NavLink
                                key={job._id}
                                to={`/jobs/${job._id}`}
                                className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
                                style={({ isActive }) => ({
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--accent-color)' : 'transparent',
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 500 : 400,
                                    transition: 'all 0.2s'
                                })}
                            >
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {job.title}
                                </div>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        </aside >
    );
};

export default Sidebar;
