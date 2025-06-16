
import React, { useState } from 'react';
import { BookOpen, Bookmark, Mic, MicOff, MessageCircle, Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const ReadBook = () => {
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <div className="flex gap-6 h-full">
      {/* Main Reading Area */}
      <div className="flex-1 bg-white rounded-xl border border-stone-200 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Book Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-stone-800 mb-2">تاريخ السودان الحديث</h1>
            <p className="text-stone-600">محمد عبدالرحيم</p>
            <div className="mt-4 text-sm text-stone-500">
              Chapter 3: الاستعمار وحركات المقاومة • Page 45 of 280
            </div>
          </div>

          {/* Reading Content */}
          <div className="prose prose-lg max-w-none text-stone-800 leading-relaxed" dir="rtl">
            <p className="mb-6">
              في مطلع القرن العشرين، شهدت أراضي السودان تطورات سياسية واجتماعية مهمة، حيث بدأت حركات المقاومة تتشكل ضد الحكم الاستعماري. كانت هذه الحركات تعكس إرادة الشعب السوداني في الحفاظ على هويته وثقافته الأصيلة.
            </p>
            
            <p className="mb-6">
              لقد اتخذت المقاومة السودانية أشكالاً متعددة، من المقاومة السياسية المنظمة إلى الثورات الشعبية، مما أدى إلى تغييرات جذرية في البنية الاجتماعية والسياسية للبلاد. وكان لهذه الحركات تأثير عميق على مسار التاريخ السوداني.
            </p>

            <p className="mb-6">
              من أبرز قادة هذه المرحلة كانت شخصيات تاريخية مؤثرة، ساهمت في تشكيل الوعي الوطني وبناء الهوية السودانية الحديثة. هؤلاء القادة جمعوا بين الحكمة السياسية والقدرة على تعبئة الجماهير.
            </p>
          </div>
        </div>
      </div>

      {/* Reading Tools Sidebar */}
      <div className="w-80 space-y-6">
        {/* Reading Controls */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reading Tools
            </h3>
            
            <div className="space-y-3">
              <Button 
                variant={isTTSActive ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setIsTTSActive(!isTTSActive)}
              >
                {isTTSActive ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isTTSActive ? "Stop Reading" : "Text-to-Speech"}
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Bookmark className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Reading Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Assistant
            </h3>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowAIChat(!showAIChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat about Book
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-stone-800 mb-4">Reading Progress</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-stone-600 mb-2">
                  <span>Chapter Progress</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full w-2/3"></div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex justify-between text-sm text-stone-600 mb-2">
                  <span>Book Progress</span>
                  <span>16%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-1/6"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Drawer */}
      {showAIChat && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-stone-200 shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-stone-800">Chat with Book</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAIChat(false)}>
              ×
            </Button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="bg-stone-100 rounded-lg p-4">
              <p className="text-sm text-stone-700">
                Hi! I'm your AI reading assistant. Ask me anything about this book or chapter.
              </p>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="border-t border-stone-200 pt-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask about this chapter..."
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
