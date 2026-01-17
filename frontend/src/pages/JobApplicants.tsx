import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Job, Application } from '../types';

type SortField = 'name' | 'rating' | 'status' | 'date';
type SortDirection = 'asc' | 'desc';

const JobApplicants: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [applicants, setApplicants] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('rating');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;

                const [jobRes, applicantsRes] = await Promise.all([
                    api.get(`/jobs/${id}`),
                    api.get(`/jobs/${id}/applicants`)
                ]);

                setJob(jobRes.data);
                setApplicants(applicantsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // Default to desc for new field
        }
    };

    const getSortedApplicants = () => {
        return [...applicants].sort((a, b) => {
            let result = 0;
            switch (sortField) {
                case 'name':
                    result = a.firstName.localeCompare(b.firstName);
                    break;
                case 'rating':
                    // Handle null/undefined ratings
                    const ratingA = a.aiRating || 0;
                    const ratingB = b.aiRating || 0;
                    result = ratingA - ratingB;
                    break;
                case 'status':
                    const statusA = a.status || '';
                    const statusB = b.status || '';
                    result = statusA.localeCompare(statusB);
                    break;
                case 'date':
                    const dateA = new Date(a.dateApplied).getTime();
                    const dateB = new Date(b.dateApplied).getTime();
                    result = dateA - dateB;
                    break;
            }
            return sortDirection === 'asc' ? result : -result;
        });
    };

    const sortedApplicants = getSortedApplicants();

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>↕</span>;
        return <span style={{ marginLeft: '0.25rem' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading applicants...</div>
            </div>
        );
    }

    if (!job) {
        return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Job not found</div>;
    }

    const thStyle = {
        padding: '1rem 1.5rem',
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none' as const,
        transition: 'color 0.2s'
    };

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{job.title}</h1>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{applicants.length} Applicants</span>
                </div>
            </header>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                            <th style={thStyle} onClick={() => handleSort('name')}>
                                Name <SortIcon field="name" />
                            </th>
                            <th style={thStyle} onClick={() => handleSort('rating')}>
                                Rating <SortIcon field="rating" />
                            </th>
                            <th style={thStyle} onClick={() => handleSort('status')}>
                                Status <SortIcon field="status" />
                            </th>
                            <th style={thStyle} onClick={() => handleSort('date')}>
                                Date Applied <SortIcon field="date" />
                            </th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedApplicants.map((app) => {
                            // Handle legacy 1-10 scale if detected (rating > 5)
                            // otherwise assume 1-5 scale (native)
                            let ratingOutOf5 = app.aiRating || null;
                            if (ratingOutOf5 && ratingOutOf5 > 5) {
                                ratingOutOf5 = Math.round(ratingOutOf5 / 2);
                            }

                            let ratingColor = '#d1d5db'; // gray default
                            if (ratingOutOf5) {
                                if (ratingOutOf5 === 5) ratingColor = '#34d399'; // Green
                                else if (ratingOutOf5 >= 3) ratingColor = '#fbbf24'; // Yellow
                                else ratingColor = '#f87171'; // Red
                            }

                            return (
                                <tr key={app._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {app.firstName} {app.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {app.email}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {ratingOutOf5 ? (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: ratingColor,
                                                fontWeight: 600
                                            }}>
                                                <span style={{ fontSize: '1.25rem' }}>{ratingOutOf5}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/5</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                                        {new Date(app.dateApplied).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <Link
                                            to={`/applicants/${app._id}`}
                                            style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}
                                        >
                                            View &rarr;
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobApplicants;
