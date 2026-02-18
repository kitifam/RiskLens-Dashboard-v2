import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { MOCK_USERS } from '../data/mockUsers';
import { cn } from '../lib/utils';
import { UserBadge } from '../types/user';

const badgeConfig: Record<UserBadge, { icon: string; color: string; bgColor: string; label: string }> = {
  none: { icon: '', color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'Member' },
  bronze: { icon: '🥉', color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: 'Bronze' },
  silver: { icon: '🥈', color: 'text-slate-300', bgColor: 'bg-slate-400/10', label: 'Silver' },
  gold: { icon: '🥇', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Gold' },
  platinum: { icon: '💎', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'Platinum' }
};

export function Leaderboard() {
  const sortedUsers = [...MOCK_USERS]
    .filter(u => u.role === 'user' || u.role === 'admin')
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topThree = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-amber-400" />
            Risk Reporter Leaderboard
          </CardTitle>
          <p className="text-sm text-slate-500">Top performers in risk identification and reporting</p>
        </CardHeader>
        <CardContent>
          {/* Top 3 Podium */}
          <div className="flex justify-center items-end gap-4 mb-8">
            {topThree.map((user, index) => (
              <div key={user.id} className={cn(
                "flex flex-col items-center",
                index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"
              )}>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 border-2",
                  index === 0 ? "bg-amber-500/20 border-amber-500 text-amber-400 w-20 h-20" :
                  index === 1 ? "bg-slate-400/20 border-slate-400 text-slate-300" :
                  "bg-orange-600/20 border-orange-600 text-orange-400"
                )}>
                  {user.name.charAt(0)}
                </div>
                <div className="text-lg font-bold text-slate-100">{user.name}</div>
                <div className="text-2xl font-bold text-amber-400">{user.score}</div>
                <Badge className={cn(badgeConfig[user.badge].bgColor, badgeConfig[user.badge].color, "mt-1")}>
                  {badgeConfig[user.badge].icon} {badgeConfig[user.badge].label}
                </Badge>
                <div className="text-xs text-slate-500 mt-1">#{index + 1}</div>
              </div>
            ))}
          </div>

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {rest.map((user, index) => (
              <div key={user.id} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <div className="w-8 text-center text-slate-500 font-medium">#{index + 4}</div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.businessUnit}</div>
                </div>
                <Badge className={cn(badgeConfig[user.badge].bgColor, badgeConfig[user.badge].color)}>
                  {badgeConfig[user.badge].icon} {badgeConfig[user.badge].label}
                </Badge>
                <div className="text-lg font-bold text-slate-200 w-16 text-right">{user.score}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to earn points */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400 mb-1">+5</div>
              <div className="text-sm text-slate-300">Create New Risk</div>
              <div className="text-xs text-slate-500">Each risk you identify</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-blue-400 mb-1">+2</div>
              <div className="text-sm text-slate-300">Update Risk</div>
              <div className="text-xs text-slate-500">Keep information current</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-purple-400 mb-1">+10</div>
              <div className="text-sm text-slate-300">Early Warning</div>
              <div className="text-xs text-slate-500">Detect risk 2+ weeks early</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-amber-400 mb-1">+1</div>
              <div className="text-sm text-slate-300">Login Streak</div>
              <div className="text-xs text-slate-500">Daily engagement</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}