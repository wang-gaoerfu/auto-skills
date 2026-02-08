'use client';

import { useState } from 'react';
import { FolderTree, Plus, Edit, Eye, EyeOff, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'coaching',
      name: '教练技术',
      name_en: 'coaching',
      description: '教练技术工具、方法和实践',
      icon: '🎯',
      color: '#4A90E2',
      document_count: 150,
      is_visible_to_users: true,
      subcategories: ['GROW模型', '360度评估', '强有力问题'],
      tags: ['目标设定', '行动计划', '信任建立'],
      expertise_areas: ['教练技术基础理论', '教练文化塑造', '教练受训关系'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    },
    {
      id: 'leadership',
      name: '领导力测评',
      name_en: 'leadership',
      description: '领导力能力评估和发展',
      icon: '📊',
      color: '#50E3C2',
      document_count: 120,
      is_visible_to_users: true,
      subcategories: ['能力矩阵', '360度反馈'],
      tags: ['测评工具', '能力模型'],
      expertise_areas: ['领导力测评基础理论', '测评工具与方法'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    },
    {
      id: 'team',
      name: '团队管理',
      name_en: 'team-management',
      description: '团队建设和管理技巧',
      icon: '👥',
      color: '#FF6B6B',
      document_count: 80,
      is_visible_to_users: false,
      subcategories: ['团队沟通', '冲突管理'],
      tags: ['团队建设', '沟通技巧'],
      expertise_areas: ['团队建设理论', '团队发展阶段'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    },
  ]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, is_visible_to_users: visible } : cat))
    );
    // TODO: 调用 API 更新
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个分类吗？相关文档将变为未分类状态。')) {
      setCategories(categories.filter((cat) => cat.id !== id));
      // TODO: 调用 API 删除
    }
  };

  const handleGeneratePrompt = async (id: string) => {
    // TODO: 调用 AI 生成提示词
    alert('AI 正在生成提示词...');
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">分类管理</h2>
          <p className="text-slate-500 dark:text-slate-400">管理知识库分类和提示词</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              新建分类
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>新建知识库分类</DialogTitle>
              <DialogDescription>创建新的知识库分类，AI 将自动生成提示词</DialogDescription>
            </DialogHeader>
            <CreateCategoryForm onClose={() => setCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="text-xs">{category.name_en}</CardDescription>
                  </div>
                </div>
                <Badge variant={category.is_visible_to_users ? 'default' : 'secondary'}>
                  {category.is_visible_to_users ? '可见' : '隐藏'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {category.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {category.subcategories?.slice(0, 3).map((sub) => (
                  <Badge key={sub} variant="outline" className="text-xs">
                    {sub}
                  </Badge>
                ))}
                {category.subcategories && category.subcategories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{category.subcategories.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">文档数量</span>
                <span className="font-semibold">{category.document_count}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={category.is_visible_to_users}
                  onCheckedChange={(checked) => handleToggleVisibility(category.id, checked)}
                />
                <span className="text-xs text-slate-500">
                  {category.is_visible_to_users ? '用户可见' : '用户不可见'}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCategory(category)}
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleGeneratePrompt(category.id)}
                  title="AI 生成提示词"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-700"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 编辑分类对话框 */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>修改分类信息和设置</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <EditCategoryForm category={editingCategory} onClose={() => setEditingCategory(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 新建分类表单
function CreateCategoryForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    icon: '📚',
    color: '#4A90E2',
  });

  const handleSubmit = async () => {
    // TODO: 调用 API 创建分类
    console.log('Creating category:', formData);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">分类名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：教练技术"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name_en">英文标识 *</Label>
          <Input
            id="name_en"
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="例如：coaching"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="简短描述这个分类..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">图标</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="选择 emoji 图标"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">颜色</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#4A90E2"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={handleSubmit}>
          创建并 AI 生成提示词
        </Button>
      </div>
    </div>
  );
}

// 编辑分类表单
function EditCategoryForm({ category, onClose }: { category: Category; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: category.name,
    name_en: category.name_en,
    description: category.description,
    icon: category.icon,
    color: category.color,
    is_visible_to_users: category.is_visible_to_users,
  });

  const [systemPrompt, setSystemPrompt] = useState('');

  const handleSubmit = async () => {
    // TODO: 调用 API 更新分类
    console.log('Updating category:', formData);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">分类名称 *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-name_en">英文标识 *</Label>
          <Input
            id="edit-name_en"
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">描述</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-icon">图标</Label>
          <Input
            id="edit-icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-color">颜色</Label>
          <div className="flex gap-2">
            <Input
              id="edit-color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="edit-visible">用户可见</Label>
        <Switch
          id="edit-visible"
          checked={formData.is_visible_to_users}
          onCheckedChange={(checked) => setFormData({ ...formData, is_visible_to_users: checked })}
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <Label>系统提示词</Label>
          <Button variant="outline" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            AI 重新生成
          </Button>
        </div>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="系统提示词将在这里显示..."
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSubmit}>保存修改</Button>
      </div>
    </div>
  );
}
