'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  MoreVertical,
  CheckCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useUserContext } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Member {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'user';
  joinedAt: string;
}

export default function OrganizationPage() {
  const { user, isAdmin } = useUserContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/organizations/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsInviting(true);

    try {
      const response = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: inviteEmail,
          organizationName: user?.organizationName || 'Lawptimize',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      setSuccess(data.message || 'User invited successfully!');
      setInviteLink(data.inviteLink || '');
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setSuccess('Invite link copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Shield className="h-12 w-12 text-orange mx-auto mb-4" />
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only organization admins can access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 flex-1 p-8 pb-24">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Organization</h1>
            <p className="text-muted-foreground">
              Manage your team and organization settings
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Organization Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan" />
              {user?.organizationName || 'Your Organization'}
            </CardTitle>
            <CardDescription>
              Organization ID: {user?.organizationId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-purple border-purple/30">
                <Shield className="h-3 w-3 mr-1" />
                You are Admin
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Invite User */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Add a new member to your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteUser} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && !inviteLink && (
                <Alert className="border-green-500/30 bg-green-500/5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {inviteLink && (
                <Alert className="border-cyan-500/30 bg-cyan-500/5">
                  <CheckCircle className="h-4 w-4 text-cyan-500" />
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="text-cyan-700 dark:text-cyan-300">
                      {success}
                    </AlertDescription>
                    <div className="flex items-center gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={copyInviteLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              )}

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={isInviting}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isInviting || !inviteEmail}
                >
                  {isInviting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan" />
              Team Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No members yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Invite team members to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan/20 to-teal/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-cyan">
                          {(member.firstName || member.email)[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {member.firstName || 'User'} {member.lastName || ''}
                        </h4>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={member.role === 'admin' ? 'default' : 'secondary'}
                        className={member.role === 'admin' ? 'bg-purple text-white' : ''}
                      >
                        {member.role === 'admin' ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          'Member'
                        )}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          {member.role !== 'admin' && (
                            <>
                              <DropdownMenuItem>Change Role</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Remove Member
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

