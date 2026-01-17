import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export type PipelineStatus = {
    step: string;
    status: string;
};

export const useRealTimeStatus = () => {
    const [statusMap, setStatusMap] = useState<Record<number, PipelineStatus>>({});

    useEffect(() => {
        const socket = io(API_URL);

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket');
        });

        socket.on('pipeline_update', (data: { bambooId: number, step: string, status: string }) => {
            console.log('⚡ Update:', data);
            setStatusMap(prev => ({
                ...prev,
                [data.bambooId]: { step: data.step, status: data.status }
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return statusMap;
};
