
import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SignInPage = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left side - Authentication */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-stone-800">Madarek</span>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-stone-900">Welcome back</h2>
            <p className="mt-2 text-stone-600">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Clerk Sign In */}
          <SignIn 
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
                card: "shadow-none p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-stone-200 hover:bg-stone-50",
                formFieldInput: "border-stone-200 focus:ring-emerald-600 focus:border-emerald-600",
                footerActionLink: "text-emerald-600 hover:text-emerald-700",
              }
            }}
          />

          {/* Sign up link */}
          <p className="mt-6 text-center text-stone-600">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Create one here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Learning environment"
        />
        <div className="absolute inset-0 bg-emerald-600 bg-opacity-20"></div>
        <div className="absolute bottom-10 left-10 right-10">
          <blockquote className="text-white">
            <p className="text-xl font-medium">
              "Knowledge is power, and Madarek makes it accessible to everyone."
            </p>
            <footer className="mt-4">
              <p className="text-emerald-100">— Sudanese Proverb</p>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};
