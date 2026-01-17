import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Application } from '../types';

const ApplicantDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [applicant, setApplicant] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplicant = async () => {
            try {
                if (!id) return;
                const response = await api.get(`/applicants/${id}`);
                setApplicant(response.data);
            } catch (error) {
                console.error('Error fetching applicant:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicant();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading applicant details...</div>
            </div>
        );
    }

    if (!applicant) {
        return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Applicant not found</div>;
    }

    return (
        <div>
            {/* Navigation back to job applicants? Ideally we'd know the job ID. 
                For now, just back to home or history back */}
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: '2rem' }}>
                &larr; Back to Dashboard
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Left Column: Basic Info & AI Rating */}
                <div>
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--bg-secondary), var(--card-bg))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {applicant.firstName[0]}{applicant.lastName[0]}
                            </div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                {applicant.firstName} {applicant.lastName}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }}>{applicant.email}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>{applicant.phone}</p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                                <span style={{ fontWeight: 600 }}>{applicant.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Applied</span>
                                <span>{new Date(applicant.dateApplied).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>AI Assesment</h3>

                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            {/* Rating Scale 1-5 Logic */}
                            {(() => {
                                const ratingOutOf5 = applicant.aiRating ? Math.round(applicant.aiRating / 2) : 0;
                                const ratingColor = ratingOutOf5 === 5
                                    ? '#34d399'
                                    : ratingOutOf5 >= 3
                                        ? '#fbbf24'
                                        : '#f87171';

                                return (
                                    <>
                                        <div style={{
                                            fontSize: '3.5rem',
                                            fontWeight: '800',
                                            color: ratingColor
                                        }}>
                                            {ratingOutOf5 || 'N/A'}
                                            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/5</span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)' }}>Overall Match Score</p>
                                    </>
                                );
                            })()}
                        </div>

                        {applicant.aiSummary && (
                            <div>
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Summary</h4>
                                <p style={{ lineHeight: '1.6' }}>{applicant.aiSummary}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Resume & Details */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Resume Content</h2>

                    {applicant.resumeText ? (
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6',
                            maxHeight: '800px',
                            overflowY: 'auto'
                        }}>
                            {applicant.resumeText}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No resume text available.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicantDetail;
