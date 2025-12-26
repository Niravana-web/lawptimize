'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Shield,
  Loader2,
  UserPlus,
} from 'lucide-react';

interface InvitationData {
  organizationName: string;
  email: string;
  role: string;
  invitedAt: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setIsVerifying(false);
      return;
    }

    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setIsVerifying(true);
      const response = await fetch(`/api/organizations/accept-invitation?token=${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Invalid invitation');
      }

      setInvitation(data.invitation);
    } catch (err: any) {
      setError(err.message || 'Failed to verify invitation');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!isSignedIn) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect_url=/accept-invitation?token=${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      setError('');

      const response = await fetch('/api/organizations/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(data.message);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifying invitation
  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Verifying invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Welcome to the Team!</CardTitle>
            <CardDescription className="text-center">
              {success}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting you to the dashboard...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {error || 'This invitation link is no longer valid'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invitation acceptance UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan/20 to-teal/10 flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-cyan" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">You're Invited!</CardTitle>
          <CardDescription className="text-center">
            Join your team on Lawptimize
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Building2 className="h-5 w-5 text-cyan mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Organization</p>
                <p className="font-semibold">{invitation.organizationName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Mail className="h-5 w-5 text-cyan mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-semibold">{invitation.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Shield className="h-5 w-5 text-cyan mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="font-semibold capitalize">{invitation.role}</p>
              </div>
            </div>
          </div>

          {/* User authentication status */}
          {!isSignedIn && (
            <Alert className="border-yellow/30 bg-yellow/5">
              <AlertCircle className="h-4 w-4 text-yellow" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                You need to sign in to accept this invitation
              </AlertDescription>
            </Alert>
          )}

          {isSignedIn && user?.emailAddresses[0]?.emailAddress !== invitation.email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitation.email}, but you're signed in as{' '}
                {user?.emailAddresses[0]?.emailAddress}. Please sign out and sign in with the correct email.
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleAcceptInvitation}
              disabled={isAccepting || (isSignedIn && user?.emailAddresses[0]?.emailAddress !== invitation.email)}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Accepting...
                </>
              ) : !isSignedIn ? (
                'Sign In to Accept'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Decline
            </Button>
          </div>

          {/* Additional info */}
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you'll join {invitation.organizationName} and gain access to their workspace
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
