'use client';
import React, { useContext, useMemo, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageTitle } from '../components/ui/PageTitle';

export const LeaderboardPage = ({ type }: { type: 'strength' | 'referral' }) => {
  const { username } = useContext(UserContext);
  const [timeRange, setTimeRange] = useState('All Time');
  const title = type === 'strength' ? 'Network Strength' : 'Referral Points';
  
  const apiPath = useMemo(() => {
    if (!username) return null;
    const params = new URLSearchParams();
    if (timeRange !== 'All Time') params.set('timeRange', timeRange);
    return `/user/leaderboard/${type}?${params.toString()}`;
  }, [username, type, timeRange]);
  
  const { data, loading, error } = useApi(apiPath, 30000);
  
  const timeRanges = ['All Time', 'hour', 'day', 'week'];

  return (
    <div>
      <PageTitle title={`${title} Leaderboard`} subtitle="Top users ranked by score" />
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
      <Card>
        {loading && !data && <LoadingSpinner />}
        {error && <ErrorDisplay message={error} />}
        {data && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3">Rank</th>
                <th className="p-3">User</th>
                <th className="p-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user: { name: string; score: number }, index: number) => (
                <tr key={user.name} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium text-blue-400">{user.name}</td>
                  <td className="p-3 text-right font-mono">{user.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};