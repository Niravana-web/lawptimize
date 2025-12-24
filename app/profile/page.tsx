'use client';

import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { User, Shield, Building2, Mail, Calendar } from 'lucide-react';
import { useUserContext } from '@/lib/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isAdmin } = useUserContext();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 flex-1 p-8 pb-24">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">View your account information</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Profile Info Card */}
        <Card className="mb-8 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || 'User'}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan/20 to-teal/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-cyan" />
                </div>
              )}
              <div>
                <h2 className="text-2xl">
                  {user.firstName} {user.lastName}
                </h2>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* User Details */}
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-purple" />
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className={`text-base px-3 py-1 ${isAdmin ? 'bg-purple text-white' : ''}`}
              >
                {isAdmin ? 'Admin' : 'User'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {isAdmin
                  ? 'You have full admin privileges'
                  : 'You have standard user access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-cyan" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">
                {user.organizationName || 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                ID: {user.organizationId || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-cyan" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Primary email address
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-cyan" />
                Joined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {user.joinedAt
                  ? new Date(user.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Organization member since
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
