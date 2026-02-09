import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, Plus } from "lucide-react";

export default function DiaryEditor({ entry, onClose }) {
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [category, setCategory] = useState(entry?.category || "pessoal");
  const [favorite, setFavorite] = useState(entry?.favorite || false);
  const [tags, setTags] = useState(entry?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("BookOpen");

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['diaryCategories'],
    queryFn: () => base44.entities.DiaryCategory.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (entry) {
        return base44.entities.DiaryEntry.update(entry.id, data);
      }
      return base44.entities.DiaryEntry.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaryEntries'] });
      onClose();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.DiaryCategory.create(data),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['diaryCategories'] });
      setCategory(newCategory.name);
      setShowNewCategoryDialog(false);
      setNewCategoryName("");
      setNewCategoryIcon("BookOpen");
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    saveMutation.mutate({
      title: title.trim(),
      content,
      category,
      favorite,
      tags,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{entry ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título da entrada..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <div className="mt-1 border rounded-md">
                <ReactQuill
                  value={content}
                  onChange={setContent}
                  placeholder="Escreva seus pensamentos..."
                  className="h-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-16">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewCategoryDialog(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorite"
                    checked={favorite}
                    onCheckedChange={setFavorite}
                  />
                  <Label htmlFor="favorite" className="cursor-pointer">
                    Marcar como favorito ⭐
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Adicionar tag..."
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || saveMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nova Categoria Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="categoryName">Nome da Categoria</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Trabalho, Estudos..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="categoryIcon">Ícone</Label>
              <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BookOpen">📖 Livro</SelectItem>
                  <SelectItem value="Lightbulb">💡 Ideia</SelectItem>
                  <SelectItem value="Brain">🧠 Reflexão</SelectItem>
                  <SelectItem value="Star">⭐ Destaque</SelectItem>
                  <SelectItem value="User">👤 Pessoal</SelectItem>
                  <SelectItem value="Heart">❤️ Sentimento</SelectItem>
                  <SelectItem value="Sparkles">✨ Especial</SelectItem>
                  <SelectItem value="Target">🎯 Meta</SelectItem>
                  <SelectItem value="Coffee">☕ Casual</SelectItem>
                  <SelectItem value="Music">🎵 Arte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}