
import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Layout } from './Layout';
import { Landing } from '../pages/Landing';

export const ProtectedRoutes = () => {
  return (
    <>
      <SignedOut>
        <Landing />
      </SignedOut>
      <SignedIn>
        <Layout />
      </SignedIn>
    </>
  );
};
