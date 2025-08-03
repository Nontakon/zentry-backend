'use client';

import React, { useContext, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserContext } from '../context/UserContext';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageTitle } from '../components/ui/PageTitle';

const parseIntervalToMs = (interval: string): number => {
    const duration = parseInt(interval, 10);
    if (isNaN(duration)) return 60000; // Default to 1 minute

    if (interval.endsWith('s')) return duration * 1000;
    if (interval.endsWith('min')) return duration * 60 * 1000;
    if (interval.endsWith('hr')) return duration * 60 * 60 * 1000;
    if (interval.endsWith('days')) return duration * 24 * 60 * 60 * 1000;
    
    return 60000; // Default fallback
};

const generateTimeSeriesData = (
    data: { time: string; count: number }[] | undefined, 
    intervalStr: string,
    timeRange: string // New parameter to determine the start time
) => {
    if (!data) {
        return [];
    }

    const intervalMs = parseIntervalToMs(intervalStr);
    const endTime = new Date().getTime(); // End time is always now
    let startTime: number;

    // Determine the start time for the graph based on the selected time range
    switch (timeRange) {
        case 'hour':
            startTime = endTime - 3600 * 1000; // 1 hour ago
            break;
        case 'day':
            startTime = endTime - 24 * 3600 * 1000; // 1 day ago
            break;
        case 'week':
            startTime = endTime - 7 * 24 * 3600 * 1000; // 1 week ago
            break;
        default: // 'All Time'
            if (data.length === 0) {
                // If there's no data, default to showing the last hour to have a valid range
                startTime = endTime - 3600 * 1000; 
            } else {
                // Find the earliest timestamp from the data to start the chart
                const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                if (!sortedData[0]) {
                    return []
                } 
                startTime = new Date(sortedData[0].time).getTime();
            }
            break;
    }

    // Create a map for quick lookups of existing data points
    const dataMap = new Map<number, number>();
    data.forEach(d => {
        const timestamp = new Date(d.time).getTime();
        dataMap.set(timestamp, d.count);
    });

    const fullTimeSeries: { time: string; count: number }[] = [];
    
    // Align the starting point of our loop to the interval grid to match API buckets
    let currentTime = Math.floor(startTime / intervalMs) * intervalMs;

    while (currentTime <= endTime) {
        const count = dataMap.get(currentTime) || 0;
        fullTimeSeries.push({
            time: new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            count: count,
        });
        currentTime += intervalMs;
    }

    return fullTimeSeries;
};

export const UserProfilePage = () => {
    const { username } = useContext(UserContext);
    const [interval, setInterval] = useState('1min');
    const [timeRange, setTimeRange] = useState('All Time');
    const apiPath = useMemo(() => {
        if (!username) return null;
        const params = new URLSearchParams();
        if (timeRange !== 'All Time') params.set('timeRange', timeRange);
        return `/user/profile/${username}?group-by=${interval}&${params.toString()}`;
    }, [username, interval,timeRange]);
    
    const { data, loading, error } = useApi(apiPath, 30000);

    const timeIntervals = ['30s','1min','5min','10min','30min','1hr','4hr','1days'];
    const timeRanges = ['All Time', 'hour', 'day', 'week'];

    const friendChartData = useMemo(() => generateTimeSeriesData(data?.friendCountByTime, interval,timeRange), [data, interval,timeRange]);
    const referralChartData = useMemo(() => generateTimeSeriesData(data?.referralCountByTime, interval,timeRange), [data, interval,timeRange]);

    return (
        <div>
            <PageTitle title="User Profile" subtitle={`Detailed analytics for ${username}`} />
            
            <div className="mb-4">
                <label htmlFor="interval-select" className="text-sm text-gray-400 mr-2">Time Interval:</label>
                <select 
                    id="interval-select" 
                    value={interval} 
                    onChange={e => setInterval(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {timeIntervals.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex justify-center mb-4">
                <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
                {timeRanges.map(range => (
                    <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                        timeRange === range ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    >
                    {range}
                    </button>
                ))}
                </div>
            </div>
            {loading && !data && <LoadingSpinner />}
            {error && <ErrorDisplay message={error} />}
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4 text-white">Friends Added Over Time</h3>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-blue-400">{data.totalFriendCount}</span>
                            <p className="text-sm text-gray-400">Total Friends</p>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={friendChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="time" stroke="#A0AEC0" />
                                <YAxis stroke="#A0AEC0" allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                                <Legend />
                                <Line type="monotone" dataKey="count" name="New Friends" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold mb-4 text-white">Referrals Made Over Time</h3>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-green-400">{data.totalReferralCount}</span>
                            <p className="text-sm text-gray-400">Total Referrals</p>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={referralChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="time" stroke="#A0AEC0" />
                                <YAxis stroke="#A0AEC0" allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                                <Legend />
                                <Line type="monotone" dataKey="count" name="New Referrals" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}
        </div>
    );
};
