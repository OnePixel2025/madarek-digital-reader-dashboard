
import React from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const uploads = [
  {
    id: 1,
    filename: 'الثقافة_الشعبية_السودانية.pdf',
    title: 'الثقافة الشعبية السودانية',
    author: 'محمد أحمد',
    uploadDate: '2024-01-15',
    status: 'approved',
    fileSize: '2.3 MB',
    pages: 156,
    processingProgress: 100
  },
  {
    id: 2,
    filename: 'تاريخ_الخرطوم.pdf',
    title: 'تاريخ مدينة الخرطوم',
    author: 'سارة عبدالله',
    uploadDate: '2024-01-10',
    status: 'pending',
    fileSize: '4.1 MB',
    pages: 203,
    processingProgress: 65
  },
  {
    id: 3,
    filename: 'الشعر_الصوفي.pdf',
    title: 'الشعر الصوفي في السودان',
    author: 'عبدالرحمن النور',
    uploadDate: '2024-01-08',
    status: 'rejected',
    fileSize: '1.8 MB',
    pages: 124,
    processingProgress: 100,
    rejectionReason: 'Poor scan quality, please re-upload with higher resolution'
  },
  {
    id: 4,
    filename: 'الاقتصاد_الزراعي.pdf',
    title: 'الاقتصاد الزراعي في السودان',
    author: 'أحمد محمد علي',
    uploadDate: '2024-01-12',
    status: 'processing',
    fileSize: '3.7 MB',
    pages: 189,
    processingProgress: 45
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'rejected': return <XCircle className="w-4 h-4" />;
    case 'processing': return <Clock className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

export const Uploads = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Uploads</h1>
          <p className="text-stone-600">Track your uploaded books and their status</p>
        </div>
        
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload New Book
        </Button>
      </div>

      {/* Upload Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Approved</p>
                <p className="text-lg font-semibold text-stone-800">
                  {uploads.filter(u => u.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Pending</p>
                <p className="text-lg font-semibold text-stone-800">
                  {uploads.filter(u => u.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Processing</p>
                <p className="text-lg font-semibold text-stone-800">
                  {uploads.filter(u => u.status === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Rejected</p>
                <p className="text-lg font-semibold text-stone-800">
                  {uploads.filter(u => u.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploads List */}
      <div className="space-y-4">
        {uploads.map((upload) => (
          <Card key={upload.id} className="border-stone-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-16 bg-gradient-to-br from-stone-400 to-stone-500 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-stone-800 mb-1">
                        {upload.title}
                      </h3>
                      <p className="text-sm text-stone-600 mb-2">
                        by {upload.author}
                      </p>
                      <p className="text-xs text-stone-500">
                        {upload.filename} • {upload.fileSize} • {upload.pages} pages
                      </p>
                    </div>
                    
                    <Badge className={getStatusColor(upload.status)}>
                      {getStatusIcon(upload.status)}
                      <span className="ml-1 capitalize">{upload.status}</span>
                    </Badge>
                  </div>
                  
                  {upload.status === 'processing' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-stone-600 mb-1">
                        <span>Processing</span>
                        <span>{upload.processingProgress}%</span>
                      </div>
                      <Progress value={upload.processingProgress} className="h-2" />
                    </div>
                  )}
                  
                  {upload.status === 'rejected' && upload.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {upload.rejectionReason}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">
                      Uploaded on {new Date(upload.uploadDate).toLocaleDateString()}
                    </p>
                    
                    <div className="flex gap-2">
                      {upload.status === 'rejected' && (
                        <Button variant="outline" size="sm">
                          Re-upload
                        </Button>
                      )}
                      {upload.status === 'approved' && (
                        <Button variant="outline" size="sm">
                          View Book
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {uploads.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">No uploads yet</h3>
          <p className="text-stone-600 mb-6">Upload your first book to get started</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload Your First Book
          </Button>
        </div>
      )}
    </div>
  );
};
