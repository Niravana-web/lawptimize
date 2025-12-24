'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/lib/user-context';
import { useAuth, useUser } from '@clerk/nextjs';
import { Building2, CheckCircle, UserPlus, Mail, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useUserContext();
  const { signOut } = useAuth();
  const { isSignedIn } = useUser();
  const [step, setStep] = useState<'check' | 'create' | 'success' | 'has-organization'>('check');
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [error, setError] = useState('');

  // Organization creation form state
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!isSignedIn) {
      // Redirect to sign-in page if not authenticated
      router.push('/sign-in');
      return;
    }

    // User is authenticated, check if they have organization
    if (!isLoading && user) {
      if (user.organizationId) {
        // User already has an organization, redirect to dashboard
        // Don't auto-redirect - let them see the message
        setStep('has-organization');
      }
    }
  }, [isSignedIn, user, isLoading, router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoadingAction(true);

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName,
          organizationSlug: organizationSlug.toLowerCase().replace(/\s+/g, '-'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      setStep('success');
      // Refresh user context and redirect after 2 seconds
      setTimeout(async () => {
        await refreshUser();
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'has-organization') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="h-6 w-6 text-orange" />
              You Already Have an Organization
            </CardTitle>
            <CardDescription>
              You're already a member of {user?.organizationName || 'an organization'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-cyan/50 bg-cyan/5">
              <AlertDescription className="text-cyan-900 dark:text-cyan-100">
                You're already part of <strong>{user?.organizationName}</strong>. You don't need to set up a new organization.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
                size="lg"
              >
                Go to Dashboard
              </Button>
              
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'check') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-6 w-6 text-cyan" />
              Welcome to Lawptimize
            </CardTitle>
            <CardDescription>
              Set up your organization to get started with AI-powered legal productivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <h3 className="font-semibold mb-2">You are the first user</h3>
              <p className="text-sm text-muted-foreground">
                As the first user, you will become the <span className="text-cyan font-semibold">Admin</span> and create your organization.
              </p>
            </div>

            <Button
              onClick={() => setStep('create')}
              className="w-full"
              size="lg"
            >
              Create Organization
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-3">
              <p>Already have an organization?</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="text-cyan hover:underline"
                >
                  Contact your admin to invite you
                </button>
                <button
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-red-500 flex items-center gap-1 justify-center"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-6 w-6 text-cyan" />
              Create Your Organization
            </CardTitle>
            <CardDescription>
              Set up your law firm or legal practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  placeholder="e.g., Smith & Associates LLP"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  disabled={isLoadingAction}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationSlug">Organization Slug</Label>
                <Input
                  id="organizationSlug"
                  placeholder="e.g., smith-associates"
                  value={organizationSlug}
                  onChange={(e) => {
                    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setOrganizationSlug(slug);
                  }}
                  required
                  disabled={isLoadingAction}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in URLs and must be unique
                </p>
              </div>

              <div className="p-4 rounded-lg bg-cyan/5 border border-cyan/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cyan mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">You'll be the Admin</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      As the organization creator, you'll have full admin privileges to manage members and settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('check')}
                  disabled={isLoadingAction}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoadingAction || !organizationName || !organizationSlug}
                  className="flex-1"
                >
                  {isLoadingAction ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-cyan/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-cyan" />
            </div>
            <CardTitle className="text-2xl">Organization Created!</CardTitle>
            <CardDescription>
              {organizationName} is now ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You are now the Admin. You can invite team members from your dashboard.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

