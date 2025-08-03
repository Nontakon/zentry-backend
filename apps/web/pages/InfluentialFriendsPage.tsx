'use client';
import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageTitle } from '../components/ui/PageTitle';

export const InfluentialFriendsPage = () => {
    const { username } = useContext(UserContext);
    const { data, loading, error } = useApi(username ? `/user/profile/${username}/influential-friends` : null);

    return (
        <div>
            <PageTitle title="Influential Friends" subtitle={`Top 3 most influential friends for ${username}`} />
            <Card>
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {data && (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3">Rank</th>
                                <th className="p-3">Friend</th>
                                <th className="p-3 text-right">Influence Score</th>
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