import React from 'react';
import { School } from 'lucide-react';

const getRankingStyles = (index) => {
    const styles = [
        'bg-yellow-100 text-yellow-600',
        'bg-gray-100 text-gray-600',
        'bg-orange-100 text-orange-600'
    ];
    return styles[index] || styles[2];
};

const SchoolRankingCard = ({ school, rank }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg ${getRankingStyles(rank)}`}>
            #{rank + 1}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate" title={school.nombre}>
                {school.nombre}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-gray-500 font-medium">
                    {school.token_usage?.total_tokens?.toLocaleString() || 0} total
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-green-600">
                    In: {school.token_usage?.input_tokens?.toLocaleString() || 0}
                </span>
                <span className="text-yellow-600">
                    Out: {school.token_usage?.output_tokens?.toLocaleString() || 0}
                </span>
            </div>
        </div>
        {school.logo_url ? (
            <img
                src={school.logo_url}
                alt={school.nombre}
                className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100 p-1"
            />
        ) : (
            <div className="p-2 bg-blue-50 rounded-lg">
                <School className="w-5 h-5 text-blue-600" />
            </div>
        )}
    </div>
);

const SchoolsRanking = ({ schools }) => {
    const topSchools = [...schools]
        .sort((a, b) => (b.token_usage?.total_tokens || 0) - (a.token_usage?.total_tokens || 0))
        .slice(0, 3);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {topSchools.map((school, index) => (
                <SchoolRankingCard key={school.id} school={school} rank={index} />
            ))}
        </div>
    );
};

export default SchoolsRanking;
