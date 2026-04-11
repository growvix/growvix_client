import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/config/api';
import { getCookie } from '@/utils/cookies';
import TrackingMap from '@/components/TrackingMap';
import { useBreadcrumb } from '@/context/breadcrumb-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, History, RefreshCcw, Search, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface UserLocation {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  isTrackingAssigned: boolean;
  isTrackingEnabled: boolean;
}

const TrackingPage: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  const [users, setUsers] = useState<UserLocation[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserLocation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [history, setHistory] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Tools', href: '/tools/automation' },
      { label: 'Live Tracking' }
    ]);
  }, [setBreadcrumbs]);

  const fetchUsers = async () => {
    const token = getCookie('token');
    const org = getCookie('organization');
    setRefreshing(true);
    try {
      const resp = await axios.get(`${API.LOCATION.GET_LIVE}?organization=${org}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = resp.data.data?.users || [];
      // Filter for users who are assigned tracking
      const trackableUsers = allUsers.filter((u: any) => u.isTrackingAssigned);
      setUsers(trackableUsers);
      setFilteredUsers(trackableUsers);
    } catch (err) {
      toast.error('Failed to fetch users for tracking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Auto-refresh live locations every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(u => 
          `${u.profile.firstName} ${u.profile.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, users]);

  const handleFetchHistory = async (userId: string) => {
    const token = getCookie('token');
    try {
      const resp = await axios.get(API.LOCATION.GET_HISTORY(userId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const points = resp.data.history || [];
      const path = points.map((p: any) => {
        // Handle MongoDB Decimal128 or plain numbers
        const lat = p.latitude?.$numberDecimal ? p.latitude.$numberDecimal : p.latitude;
        const lng = p.longitude?.$numberDecimal ? p.longitude.$numberDecimal : p.longitude;
        return [Number(lat), Number(lng)] as [number, number];
      });
      setHistory(path);
      setViewMode('history');
      toast.info('Loaded location history');
    } catch (err) {
      toast.error('Failed to load history');
    }
  };

  const markers = users
    .filter(u => u.lastKnownLocation?.latitude && u.lastKnownLocation?.longitude)
    .map(u => ({
      id: u._id,
      position: [u.lastKnownLocation!.latitude, u.lastKnownLocation!.longitude] as [number, number],
      label: `${u.profile.firstName} ${u.profile.lastName}`,
      timestamp: u.lastKnownLocation!.updatedAt
    }));

  const activeUserPoints = markers.find(m => m.id === selectedUser?._id);

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 px-4 py-2">
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* User List Sidebar */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Tracked Users</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchUsers} 
                disabled={refreshing}
                className={refreshing ? 'animate-spin' : ''}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users assigned for tracking.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?._id === user._id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedUser(user);
                      setViewMode('live');
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-full ${user.isTrackingEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium leading-none truncate">
                          {user.profile.firstName} {user.profile.lastName}
                        </p>
                        <p className={`text-[10px] mt-1 ${user.isTrackingEnabled ? 'text-green-500' : 'text-slate-500'}`}>
                          {user.isTrackingEnabled ? '● Online' : '○ Offline'}
                        </p>
                      </div>
                    </div>
                    {user.isTrackingEnabled && (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFetchHistory(user._id);
                            setSelectedUser(user);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map Area */}
        <div className="flex-1 flex flex-col gap-4 relative">
          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            <Button 
              size="sm" 
              variant={viewMode === 'live' ? 'default' : 'secondary'}
              onClick={() => setViewMode('live')}
              className="shadow-md"
            >
              <MapPin className="mr-2 h-4 w-4" /> Live View
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'history' ? 'default' : 'secondary'}
              onClick={() => {
                if (selectedUser) handleFetchHistory(selectedUser._id);
                else toast.warning('Select a user first');
              }}
              className="shadow-md"
            >
              <History className="mr-2 h-4 w-4" /> History
            </Button>
          </div>

          <div className="flex-1 rounded-xl shadow-sm overflow-hidden">
            <TrackingMap 
              markers={viewMode === 'live' ? markers : (activeUserPoints ? [activeUserPoints] : [])}
              historyPath={viewMode === 'history' ? history : []}
              center={selectedUser?.lastKnownLocation ? [selectedUser.lastKnownLocation.latitude, selectedUser.lastKnownLocation.longitude] : undefined}
              zoom={selectedUser?.lastKnownLocation ? 14 : 5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
