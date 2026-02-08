'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api/client';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  document_count: number;
  is_visible_to_users: boolean;
}

interface CategorySelectorProps {
  value?: string;
  onChange?: (categoryId: string) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (value && categories.length > 0) {
      const cat = categories.find((c) => c.id === value);
      if (cat) setSelected(cat);
    }
  }, [value, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCategories();
      // 只显示对用户可见的类别
      const visibleCategories = response.categories.filter((c) => c.is_visible_to_users);
      setCategories(visibleCategories);

      // 默认选择第一个类别
      if (visibleCategories.length > 0 && !selected) {
        const first = visibleCategories[0];
        setSelected(first);
        onChange?.(first.id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // 使用模拟数据作为后备
      const mockCategories: Category[] = [
        {
          id: 'coaching',
          name: '教练技术',
          icon: '🎯',
          color: '#4A90E2',
          document_count: 150,
          is_visible_to_users: true,
        },
        {
          id: 'leadership',
          name: '领导力测评',
          icon: '📊',
          color: '#50E3C2',
          document_count: 120,
          is_visible_to_users: true,
        },
      ];
      setCategories(mockCategories);
      setSelected(mockCategories[0]);
      onChange?.(mockCategories[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (category: Category) => {
    setSelected(category);
    onChange?.(category.id);
  };

  if (loading) {
    return (
      <Button variant="outline" className="gap-2 min-w-[180px] justify-start" disabled>
        <span>加载中...</span>
      </Button>
    );
  }

  if (categories.length === 0) {
    return (
      <Button variant="outline" className="gap-2 min-w-[180px] justify-start" disabled>
        <span>暂无可用类别</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[180px] justify-start">
          {selected ? (
            <>
              <span className="text-base">{selected.icon}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span>选择类别</span>
          )}
          <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[200px]">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => handleSelect(category)}
            className="gap-2"
          >
            <span className="text-base">{category.icon}</span>
            <span className="flex-1">{category.name}</span>
            <span className="text-xs text-slate-500">{category.document_count}</span>
            {selected?.id === category.id && (
              <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
