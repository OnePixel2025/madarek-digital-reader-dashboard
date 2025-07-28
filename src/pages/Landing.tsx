
import React from 'react';
import { BookOpen, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import aboutUsImage from '@/assets/about-us-students.jpg';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-200 via-lime-400 via-green-500 via-green-700 to-green-950">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-stone-800">Madarek</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-stone-800 mb-6">
          Your Digital Gateway to
          <span className="text-emerald-600 block">Sudanese Literature</span>
        </h1>
        <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
          Discover, read, and learn from the rich collection of Sudanese books, 
          educational content, and podcasts - all in one place.
        </p>
        <Link to="/sign-up">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4">
            Start Reading Today
          </Button>
        </Link>
      </section>

      {/* About Us Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-stone-800 mb-6">About Us</h2>
            <p className="text-lg text-stone-600 mb-6">
              We are a passionate team of Sudanese undergraduate students committed to preserving 
              and promoting our rich cultural heritage through innovative technology solutions.
            </p>
            <p className="text-lg text-stone-600 mb-6">
              Our mission extends beyond just creating a digital library - we aim to protect 
              and celebrate Sudanese culture, ensuring that future generations have access to 
              our invaluable literary and educational treasures.
            </p>
            <p className="text-lg text-stone-600 mb-8">
              As participants in the prestigious <span className="font-semibold text-emerald-600">"Code for Sudan"</span> competition, 
              we are dedicated to leveraging our technical skills to fulfill this meaningful goal 
              and make a lasting impact on our community.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-800">Student-Led Initiative</p>
                <p className="text-stone-600">Driven by passion for cultural preservation</p>
              </div>
            </div>
          </div>
          <div className="lg:order-last">
            <img 
              src={aboutUsImage} 
              alt="Sudanese students working on cultural preservation technology" 
              className="rounded-2xl shadow-xl w-full h-auto object-cover"
            />
          </div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-8 border-stone-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-4">Rich Library</h3>
              <p className="text-stone-600">
                Access thousands of Sudanese books and educational materials curated for modern learners.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8 border-stone-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-4">Track Progress</h3>
              <p className="text-stone-600">
                Monitor your reading journey with detailed analytics and personalized recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8 border-stone-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-4">AI Learning</h3>
              <p className="text-stone-600">
                Get personalized tutoring and interactive learning experiences powered by AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">1,200+</div>
              <div className="text-stone-600">Books Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
              <div className="text-stone-600">Active Readers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">150+</div>
              <div className="text-stone-600">Podcasts & Audio</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-stone-800 mb-6">
          Ready to Start Your Learning Journey?
        </h2>
        <p className="text-lg text-stone-600 mb-8 max-w-xl mx-auto">
          Join thousands of learners exploring Sudanese culture and knowledge through our digital platform.
        </p>
        <Link to="/sign-up">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4">
            Create Your Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-stone-100 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">Madarek</span>
          </div>
          <p className="text-stone-600">
            © 2024 Madarek. Empowering minds through digital learning.
          </p>
        </div>
      </footer>
    </div>
  );
};
