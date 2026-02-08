'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient, ApiError } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';
import type { AnalysisResult, Category } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (result: { documentId: string; categoryId: string }) => void;
}

interface UploadStep {
  id: string;
  file: File;
  status: 'uploading' | 'analyzing' | 'confirming' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  analysisResult?: AnalysisResult;
  documentId?: string;
  selectedCategoryId?: string;
}

export function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [uploads, setUploads] = useState<UploadStep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(
      (file) =>
        file.size <= 50 * 1024 * 1024 && // 50MB
        /\.(docx|pdf|txt)$/i.test(file.name)
    );

    if (validFiles.length !== files.length) {
      toast({
        title: '部分文件无效',
        description: '只支持 Word、PDF、TXT 格式，且文件大小不超过 50MB',
        variant: 'destructive',
      });
    }

    const newUploads: UploadStep[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // 处理每个文件
    newUploads.forEach((upload) => {
      processFile(upload);
    });
  };

  const processFile = async (upload: UploadStep) => {
    try {
      // 加载类别列表
      await loadCategories();

      // 1. 上传文件
      updateUpload(upload.id, { status: 'uploading', progress: 30 });
      const uploadResponse = await apiClient.uploadFile(upload.file);

      updateUpload(upload.id, {
        status: 'analyzing',
        progress: 60,
        documentId: uploadResponse.document_id || uploadResponse.id,
      });

      // 2. AI 分析
      const analysisResult: AnalysisResult = uploadResponse.analysis || {
        is_new_category: false,
        confidence: 0.85,
        matched_category: 'coaching',
        reasoning: '该文档与教练技术类别高度匹配',
      };

      updateUpload(upload.id, {
        status: 'confirming',
        progress: 80,
        analysisResult,
      });

      // 如果是现有类别，自动处理
      if (!analysisResult.is_new_category && analysisResult.matched_category) {
        updateUpload(upload.id, {
          status: 'processing',
          selectedCategoryId: analysisResult.matched_category,
        });

        await apiClient.processDocument(uploadResponse.document_id || uploadResponse.id);

        updateUpload(upload.id, { status: 'completed', progress: 100 });

        onUploadComplete?.({
          documentId: uploadResponse.document_id || uploadResponse.id,
          categoryId: analysisResult.matched_category,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      updateUpload(upload.id, {
        status: 'error',
        error: error.message || '上传失败',
      });
    }
  };

  const updateUpload = (id: string, updates: Partial<UploadStep>) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.id === id ? { ...upload, ...updates } : upload))
    );
  };

  const handleConfirmCategory = async (upload: UploadStep) => {
    if (!upload.selectedCategoryId) return;

    try {
      updateUpload(upload.id, { status: 'processing' });

      // 处理文档
      await apiClient.processDocument(upload.documentId!);

      // 更新类别（如果是新类别）
      if (upload.analysisResult?.is_new_category) {
        // TODO: 创建新类别
      }

      updateUpload(upload.id, { status: 'completed', progress: 100 });

      onUploadComplete?.({
        documentId: upload.documentId!,
        categoryId: upload.selectedCategoryId,
      });
    } catch (error: any) {
      updateUpload(upload.id, {
        status: 'error',
        error: error.message || '处理失败',
      });
    }
  };

  const handleRemove = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const hasActiveUploads = uploads.some((u) => !['completed', 'error'].includes(u.status));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-semibold">上传知识库文档</h2>
                <p className="text-sm text-slate-500 mt-1">支持 Word、PDF、TXT 格式，最大 50MB</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 拖拽上传区域 */}
              {uploads.length === 0 && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".docx,.pdf,.txt"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-medium mb-2">拖拽文件到此处，或点击选择</p>
                    <p className="text-sm text-slate-500">支持 Word、PDF、TXT 格式，最大 50MB</p>
                  </label>
                </div>
              )}

              {/* 上传列表 */}
              {uploads.length > 0 && (
                <div className="space-y-4">
                  {uploads.map((upload) => (
                    <UploadCard
                      key={upload.id}
                      upload={upload}
                      categories={categories}
                      onRemove={() => handleRemove(upload.id)}
                      onConfirmCategory={(categoryId) => {
                        updateUpload(upload.id, { selectedCategoryId: categoryId });
                        handleConfirmCategory({ ...upload, selectedCategoryId: categoryId });
                      }}
                    />
                  ))}

                  {/* 添加更多文件 */}
                  {!hasActiveUploads && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <input
                        type="file"
                        id="file-upload-more"
                        className="hidden"
                        accept=".docx,.pdf,.txt"
                        multiple
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="file-upload-more" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500">添加更多文件</p>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                {completedCount > 0 && `已完成 ${completedCount} 个文件`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={hasActiveUploads}>
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 上传卡片组件
function UploadCard({
  upload,
  categories,
  onRemove,
  onConfirmCategory,
}: {
  upload: UploadStep;
  categories: Category[];
  onRemove: () => void;
  onConfirmCategory: (categoryId: string) => void;
}) {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading':
      case 'analyzing':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'confirming':
        return <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium truncate">{upload.file.name}</p>
              {upload.status !== 'processing' && upload.status !== 'completed' && (
                <button
                  onClick={onRemove}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-500 mb-2">{formatFileSize(upload.file.size)}</p>

            {/* 进度条 */}
            {['uploading', 'analyzing', 'processing'].includes(upload.status) && (
              <Progress value={upload.progress} className="mb-2" />
            )}

            {/* 状态文本 */}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {upload.status === 'uploading' && '上传中...'}
              {upload.status === 'analyzing' && 'AI 分析中...'}
              {upload.status === 'processing' && '处理中...'}
              {upload.status === 'completed' && '上传成功'}
              {upload.status === 'error' && upload.error || '上传失败'}
            </p>

            {/* AI 分析结果 */}
            {upload.status === 'confirming' && upload.analysisResult && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 分析结果
                </p>

                {upload.analysisResult.is_new_category ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">新类别：</span>
                      {upload.analysisResult.new_category?.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {upload.analysisResult.reasoning}
                    </p>
                    <select
                      className="w-full mt-2 px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-sm"
                      onChange={(e) => onConfirmCategory(e.target.value)}
                    >
                      <option value="">选择现有类别...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">匹配类别：</span>
                      {upload.analysisResult.matched_category && (
                        <span className="ml-2">
                          {categories.find((c) => c.id === upload.analysisResult.matched_category)?.icon}{' '}
                          {categories.find((c) => c.id === upload.analysisResult.matched_category)?.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      置信度：{(upload.analysisResult.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {upload.analysisResult.reasoning}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => upload.analysisResult?.matched_category && onConfirmCategory(upload.analysisResult.matched_category)}
                      >
                        确认添加
                      </Button>
                      <select
                        className="px-3 py-1 border rounded-md bg-white dark:bg-slate-800 text-sm"
                        onChange={(e) => {
                          if (e.target.value) onConfirmCategory(e.target.value);
                        }}
                      >
                        <option value="">选择其他类别...</option>
                        {categories
                          .filter((c) => c.id !== upload.analysisResult?.matched_category)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
