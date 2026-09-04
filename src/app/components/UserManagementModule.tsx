import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Shield,
  ShieldAlert,
  RefreshCw,
  Unlock,
  Eye,
  UserCog,
  MapPin,
  Calendar,
  Mail,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from './ui/table';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

interface UserAccount {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  role: 'farmer' | 'agri_officer' | 'researcher' | 'admin' | string;
  phone_no: string;
  district: string;
  country: string;
  is_restricted: boolean;
  restriction_reason: string;
  date_joined: string;
  last_login: string | null;
}

interface StatsData {
  total: number;
  active: number;
  blocked: number;
  restricted: number;
  roles: {
    farmer: number;
    agri_officer: number;
    researcher: number;
    admin: number;
  };
}

export function UserManagementModule() {
  const { t, currentLanguage } = useTranslation();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    blocked: 0,
    restricted: 0,
    roles: { farmer: 0, agri_officer: 0, researcher: 0, admin: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [blockModalUser, setBlockModalUser] = useState<UserAccount | null>(null);
  const [restrictModalUser, setRestrictModalUser] = useState<UserAccount | null>(null);
  const [unrestrictModalUser, setUnrestrictModalUser] = useState<UserAccount | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<UserAccount | null>(null);
  const [detailsModalUser, setDetailsModalUser] = useState<UserAccount | null>(null);

  // Form inputs inside modals
  const [restrictionReason, setRestrictionReason] = useState('');
  const [selectedNewRole, setSelectedNewRole] = useState<'farmer' | 'agri_officer' | 'researcher' | 'admin'>('farmer');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch users from API
  const fetchUsers = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      if (searchTerm.trim()) queryParams.append('search', searchTerm.trim());
      if (selectedRole !== 'all') queryParams.append('role', selectedRole);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);

      const url = `http://127.0.0.1:8000/api/auth/admin/users/?${queryParams.toString()}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(t('umToastAccessDenied'));
          return;
        }
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      setUsers(data.users || []);
      if (data.stats) {
        setStats(data.stats);
      }
      if (showToast) {
        toast.success(t('umToastDirectoryUpdated'));
      }
    } catch (err) {
      console.error("Failed to load user accounts:", err);
      toast.error(t('umToastLoadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(false);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedRole, selectedStatus]);

  // Execute User Action (Block / Unblock / Restrict / Unrestrict / Change Role)
  const handleUserAction = async (
    targetUser: UserAccount,
    action: 'block' | 'unblock' | 'restrict' | 'unrestrict' | 'change_role',
    payload: Record<string, any> = {}
  ) => {
    try {
      setIsSubmittingAction(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/users/${targetUser.id}/action/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...payload })
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || t('umToastActionFailed'));
        return;
      }

      toast.success(result.message || t('umToastAccountUpdated'));

      // Close open modals
      setBlockModalUser(null);
      setRestrictModalUser(null);
      setUnrestrictModalUser(null);
      setRoleModalUser(null);
      setRestrictionReason('');

      // Refresh list
      fetchUsers(false);
    } catch (err) {
      console.error("Action error:", err);
      toast.error(t('umToastNetworkError'));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper formatting
  const formatDate = (isoString: string | null) => {
    if (!isoString) return t('umNever');
    try {
      const d = new Date(isoString);
      const locale = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      return d.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return t('umNever');
    try {
      const d = new Date(isoString);
      const locale = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      return `${d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} ${t('umAt')} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const getRoleBadge = (role: string, isSuper: boolean) => {
    if (isSuper || role === 'admin') {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold gap-1">
          <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          {t('umRoleAdmin')}
        </Badge>
      );
    }
    if (role === 'agri_officer' || role === 'officer') {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 font-medium">
          {t('umRoleAgriOfficer')}
        </Badge>
      );
    }
    if (role === 'researcher') {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 font-medium">
          {t('umRoleResearcher')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium">
        {t('umRoleFarmer')}
      </Badge>
    );
  };

  const getStatusDisplay = (user: UserAccount) => {
    if (!user.is_active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          {t('umStatusBlocked')}
        </span>
      );
    }
    if (user.is_restricted) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
          title={`${t('umStatusRestricted')}: ${user.restriction_reason || t('umDetailActiveRestriction')}`}
          onClick={() => setDetailsModalUser(user)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          {t('umStatusRestricted')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {t('umStatusActive')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-5 border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('umTotalUsers')}</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stats.total}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('umPlatformWideRegistered')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </Card>

        {/* Active Accounts */}
        <Card className="p-5 border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('umActiveAccounts')}</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('umFullSystemAuth')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </Card>

        {/* Blocked Accounts */}
        <Card className="p-5 border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('umBlockedAccounts')}</p>
              <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.blocked}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('umAccessRevoked')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
        </Card>

        {/* Restricted Accounts */}
        <Card className="p-5 border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('umRestrictedAccounts')}</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.restricted}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('umUnderPolicySupervision')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </Card>
      </div>

      {/* Main Control Panel Card */}
      <Card className="p-0 border border-border bg-card text-card-foreground shadow-sm overflow-hidden rounded-2xl">
        {/* Controls Toolbar */}
        <div className="p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('umSearchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{t('umRoleLabel')}</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition cursor-pointer"
              >
                <option value="all" className="bg-card text-card-foreground">{t('umAllRoles')} ({stats.total})</option>
                <option value="farmer" className="bg-card text-card-foreground">{t('umFarmers')} ({stats.roles.farmer})</option>
                <option value="agri_officer" className="bg-card text-card-foreground">{t('umAgriOfficers')} ({stats.roles.agri_officer})</option>
                <option value="researcher" className="bg-card text-card-foreground">{t('umResearchers')} ({stats.roles.researcher})</option>
                <option value="admin" className="bg-card text-card-foreground">{t('umAdministrators')} ({stats.roles.admin})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{t('umStatusLabel')}</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition cursor-pointer"
              >
                <option value="all" className="bg-card text-card-foreground">{t('umAllStatuses')}</option>
                <option value="active" className="bg-card text-card-foreground">{t('umActiveOnly')}</option>
                <option value="blocked" className="bg-card text-card-foreground">{t('umBlockedOnly')}</option>
                <option value="restricted" className="bg-card text-card-foreground">{t('umRestrictedOnly')}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="gap-2 border-border bg-background text-foreground hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#2E7D32]' : ''}`} />
              {t('umRefresh')}
            </Button>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4">{t('umColUserDetails')}</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4">{t('umColSystemRole')}</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4">{t('umColRegionDistrict')}</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4">{t('umColStatus')}</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4">{t('umColJoinedActivity')}</TableHead>
                <TableHead className="font-bold text-muted-foreground text-xs uppercase px-6 py-4 text-right">{t('umColAccountActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium text-sm text-foreground">{t('umLoadingUserDirectory')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">{t('umNoUsersFound')}</p>
                      <p className="text-xs text-muted-foreground">{t('umNoUsersFoundDesc')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const initials = user.display_name
                    ? user.display_name.substring(0, 2).toUpperCase()
                    : user.username.substring(0, 2).toUpperCase();

                  return (
                    <TableRow
                      key={user.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      {/* User Info */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                            !user.is_active
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                              : user.is_restricted
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-[#2E7D32] dark:text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                              <span>{user.display_name || user.username}</span>
                              {user.is_superuser && (
                                <span className="text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono font-bold border border-red-500/20">
                                  SU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0 opacity-70" />
                              <span>{user.email || t('umNoEmail')}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* System Role */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role, user.is_superuser)}
                          <button
                            onClick={() => {
                              setSelectedNewRole(user.role as any);
                              setRoleModalUser(user);
                            }}
                            title={t('umChangeRoleTooltip')}
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Region / District */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{user.district || t('umNotSpecified')}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground pl-5">
                          {user.country || t('umSriLanka')}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusDisplay(user)}
                          {user.is_restricted && user.restriction_reason && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 max-w-[180px] truncate" title={user.restriction_reason}>
                              ⚠️ {user.restriction_reason}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Timestamps */}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span>{t('umJoined')} {formatDate(user.date_joined)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span>{t('umActivePrefix')} {user.last_login ? formatDate(user.last_login) : t('umNever')}</span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setDetailsModalUser(user)}
                            title={t('umViewProfileTooltip')}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-muted rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Restrict / Unrestrict */}
                          {user.is_restricted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUnrestrictModalUser(user)}
                              className="h-8 px-2.5 text-xs text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              title={t('umLiftRestrictionsTooltip')}
                            >
                              <Unlock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              {t('umUnrestrictBtn')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRestrictionReason('');
                                setRestrictModalUser(user);
                              }}
                              className="h-8 px-2.5 text-xs text-foreground border-border hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-500/30"
                              title={t('umApplyRestrictionTooltip')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              {t('umRestrictBtn')}
                            </Button>
                          )}

                          {/* Block / Unblock */}
                          {user.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBlockModalUser(user)}
                              className="h-8 px-2.5 text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                              title={t('umBlockAccountTooltip')}
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              {t('umBlockBtn')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user, 'unblock')}
                              className="h-8 px-2.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                              title={t('umRestoreAccountTooltip')}
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {t('umUnblockBtn')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* MODAL 1: BLOCK USER CONFIRMATION */}
      {/* ==================================================================== */}
      {blockModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {t('umBlockModalTitle')}: {blockModalUser.display_name || blockModalUser.username}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('umBlockModalDesc')} (<strong className="text-foreground">@{blockModalUser.username}</strong>)
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-700 dark:text-red-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t('umSecurityImpact')}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                <li>{t('umSecurityImpact1')}</li>
                <li>{t('umSecurityImpact2')}</li>
                <li>{t('umSecurityImpact3')}</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBlockModalUser(null)}
                disabled={isSubmittingAction}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => handleUserAction(blockModalUser, 'block')}
                disabled={isSubmittingAction}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isSubmittingAction ? t('umBlockingBtn') : t('umConfirmBlockBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: RESTRICT USER MODAL */}
      {/* ==================================================================== */}
      {restrictModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{t('umRestrictModalTitle')}</h3>
                  <p className="text-xs text-muted-foreground">@{restrictModalUser.username} ({restrictModalUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setRestrictModalUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-xs text-muted-foreground">
                {t('umRestrictModalDesc')}
              </p>

              {/* Preset Reason Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('umQuickPresetsFor')} {restrictModalUser.role === 'farmer' ? t('umRoleFarmer') : restrictModalUser.role?.includes('officer') ? t('umRoleAgriOfficer') : restrictModalUser.role === 'researcher' ? t('umRoleResearcher') : t('umColSystemRole')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(restrictModalUser.role === 'farmer' ? [
                    { key: 'umPresetFarmer1', text: t('umPresetFarmer1') },
                    { key: 'umPresetFarmer2', text: t('umPresetFarmer2') },
                    { key: 'umPresetFarmer3', text: t('umPresetFarmer3') },
                    { key: 'umPresetFarmer4', text: t('umPresetFarmer4') },
                    { key: 'umPresetFarmer5', text: t('umPresetFarmer5') }
                  ] : restrictModalUser.role?.includes('officer') ? [
                    { key: 'umPresetOfficer1', text: t('umPresetOfficer1') },
                    { key: 'umPresetOfficer2', text: t('umPresetOfficer2') },
                    { key: 'umPresetOfficer3', text: t('umPresetOfficer3') },
                    { key: 'umPresetOfficer4', text: t('umPresetOfficer4') },
                    { key: 'umPresetOfficer5', text: t('umPresetOfficer5') }
                  ] : restrictModalUser.role === 'researcher' ? [
                    { key: 'umPresetResearcher1', text: t('umPresetResearcher1') },
                    { key: 'umPresetResearcher2', text: t('umPresetResearcher2') },
                    { key: 'umPresetResearcher3', text: t('umPresetResearcher3') },
                    { key: 'umPresetResearcher4', text: t('umPresetResearcher4') },
                    { key: 'umPresetResearcher5', text: t('umPresetResearcher5') }
                  ] : [
                    { key: 'umPresetOther1', text: t('umPresetOther1') },
                    { key: 'umPresetOther2', text: t('umPresetOther2') },
                    { key: 'umPresetOther3', text: t('umPresetOther3') },
                    { key: 'umPresetOther4', text: t('umPresetOther4') },
                    { key: 'umPresetOther5', text: t('umPresetOther5') }
                  ]).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setRestrictionReason(preset.text)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                        restrictionReason === preset.text
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 font-semibold'
                          : 'bg-muted text-muted-foreground border-border hover:border-amber-500/50 hover:text-foreground'
                      }`}
                    >
                      {preset.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('umRestrictionNoteLabel')}</label>
                <textarea
                  rows={3}
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  placeholder={t('umRestrictionPlaceholder')}
                  className="w-full p-3 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRestrictModalUser(null)}
                disabled={isSubmittingAction}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => handleUserAction(restrictModalUser, 'restrict', { reason: restrictionReason })}
                disabled={isSubmittingAction || !restrictionReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {isSubmittingAction ? t('umRestrictingBtn') : t('umApplyRestrictionBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: UNRESTRICT CONFIRMATION */}
      {/* ==================================================================== */}
      {unrestrictModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Unlock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {t('umLiftRestrictionTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('umLiftRestrictionDesc')} <strong className="text-foreground">@{unrestrictModalUser.username}</strong>?
              </p>
              {unrestrictModalUser.restriction_reason && (
                <div className="text-xs bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 text-amber-800 dark:text-amber-300">
                  <strong>{t('umCurrentRestrictionNote')}</strong> "{unrestrictModalUser.restriction_reason}"
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setUnrestrictModalUser(null)}
                disabled={isSubmittingAction}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => handleUserAction(unrestrictModalUser, 'unrestrict')}
                disabled={isSubmittingAction}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmittingAction ? t('umProcessingBtn') : t('umConfirmLiftRestrictionBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CHANGE ROLE */}
      {/* ==================================================================== */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#2E7D32]" />
                <h3 className="font-bold text-foreground">{t('umChangeRoleTitle')}</h3>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('umChangeRoleDesc')} <strong className="text-foreground">@{roleModalUser.username}</strong>:
            </p>

            <div className="space-y-2">
              {[
                { id: 'farmer', name: t('umRoleFarmer'), desc: t('umRoleFarmerDesc') },
                { id: 'agri_officer', name: t('umRoleAgriOfficer'), desc: t('umRoleAgriOfficerDesc') },
                { id: 'researcher', name: t('umRoleResearcher'), desc: t('umRoleResearcherDesc') },
                { id: 'admin', name: t('umRoleAdmin'), desc: t('umRoleAdminDesc') },
              ].map((roleOption) => (
                <label
                  key={roleOption.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedNewRole === roleOption.id
                      ? 'border-[#2E7D32] bg-[#2E7D32]/10'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="account_role"
                    value={roleOption.id}
                    checked={selectedNewRole === roleOption.id}
                    onChange={() => setSelectedNewRole(roleOption.id as any)}
                    className="mt-0.5 accent-[#2E7D32]"
                  />
                  <div>
                    <p className="font-semibold text-xs text-foreground">{roleOption.name}</p>
                    <p className="text-[11px] text-muted-foreground">{roleOption.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRoleModalUser(null)}
                disabled={isSubmittingAction}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => handleUserAction(roleModalUser, 'change_role', { role: selectedNewRole })}
                disabled={isSubmittingAction}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold"
              >
                {isSubmittingAction ? t('umUpdatingBtn') : t('umSaveRoleBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: USER DETAILS INSPECTION DRAWER */}
      {/* ==================================================================== */}
      {detailsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2E7D32]/15 text-[#2E7D32] dark:text-emerald-400 font-bold text-base flex items-center justify-center border border-[#2E7D32]/30">
                  {detailsModalUser.display_name
                    ? detailsModalUser.display_name.substring(0, 2).toUpperCase()
                    : detailsModalUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {detailsModalUser.display_name || detailsModalUser.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">@{detailsModalUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailAccountStatus')}</span>
                <div>{getStatusDisplay(detailsModalUser)}</div>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailAssignedRole')}</span>
                <div>{getRoleBadge(detailsModalUser.role, detailsModalUser.is_superuser)}</div>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailEmailAddress')}</span>
                <p className="font-medium text-foreground truncate">{detailsModalUser.email || t('notProvided')}</p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailPhoneNumber')}</span>
                <p className="font-medium text-foreground">{detailsModalUser.phone_no || t('umNotSet')}</p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailDistrict')}</span>
                <p className="font-medium text-foreground">{detailsModalUser.district || t('umGeneral')}</p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailCountry')}</span>
                <p className="font-medium text-foreground">{detailsModalUser.country || t('umSriLanka')}</p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1 col-span-2">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailRegTimestamp')}</span>
                <p className="font-medium text-foreground">{formatDateTime(detailsModalUser.date_joined)}</p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1 col-span-2">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">{t('umDetailLastLogin')}</span>
                <p className="font-medium text-foreground">{formatDateTime(detailsModalUser.last_login)}</p>
              </div>
            </div>

            {/* Restriction Note Box */}
            {detailsModalUser.is_restricted && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {t('umDetailActiveRestriction')}
                </p>
                <p className="text-xs pl-5">{detailsModalUser.restriction_reason || t('umUnderPolicySupervision')}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setDetailsModalUser(null)}
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                {t('umCloseBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
