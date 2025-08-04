'use client';

import React, { useContext, useMemo, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageTitle } from '../components/ui/PageTitle';

export const PaginatedFriendsPage = () => {
    const { username } = useContext(UserContext);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    const apiPath = useMemo(() => {
        if (!username) return null;
        return `/profile/${username}/friends?page=${page}&limit=${limit}`;
    }, [username, page, limit]);
    
    const { data, loading, error } = useApi(apiPath);
    
    return (
        <div>
            <PageTitle title="Friends List" subtitle={`Paginated list of friends for ${username}`} />
            <Card>
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {data && data.data && (
                    <>
                        <table className="w-full text-left mb-4">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Friends Since</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((friend: { name: string; createdAt: string }) => (
                                    <tr key={friend.name} className="border-b border-gray-800 hover:bg-gray-700/50">
                                        <td className="p-3 font-medium text-blue-400">{friend.name}</td>
                                        <td className="p-3 text-gray-400">{new Date(friend.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                Page {data.currentPage} of {data.totalPage} (Total: {data.total})
                            </span>
                            <div className="flex space-x-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={data.currentPage === 1} className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50">Prev</button>
                                <button onClick={() => setPage(p => Math.min(data.totalPage, p + 1))} disabled={data.currentPage === data.totalPage} className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};
