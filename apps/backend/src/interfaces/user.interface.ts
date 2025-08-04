
export interface UserNetwork { name: string; created_at: string; friends: { name: string }[]; referred: { name: string }[]; referredBy: { name: string } | null; }
export interface UserScore { name: string; score: number; }
export interface TimeSeriesData { date: string; count: number; }
export interface CountByTime {
	count :number;
	time: string;
}
export interface UserProfileResult { 
    name: string; 
    friendCountByTime: CountByTime[]; 
    referralCountByTime: CountByTime[]; 
}

export interface User { name: string, createdAt: string };

export interface UserReferralCount { name: string; count: number; }