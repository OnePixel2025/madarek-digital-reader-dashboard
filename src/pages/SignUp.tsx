
import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SignUpPage = () => {
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
            <h2 className="text-3xl font-bold text-stone-900">Create your account</h2>
            <p className="mt-2 text-stone-600">
              Join thousands of learners exploring Sudanese literature
            </p>
          </div>

          {/* Clerk Sign Up */}
          <SignUp 
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

          {/* Sign in link */}
          <p className="mt-6 text-center text-stone-600">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Digital learning"
        />
        <div className="absolute inset-0 bg-blue-600 bg-opacity-20"></div>
        <div className="absolute bottom-10 left-10 right-10">
          <blockquote className="text-white">
            <p className="text-xl font-medium">
              "Start your journey of discovery with Sudanese literature and culture."
            </p>
            <footer className="mt-4">
              <p className="text-blue-100">— Welcome to Madarek</p>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};
