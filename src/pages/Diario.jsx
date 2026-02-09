import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar as CalendarIcon,
  Filter,
  X,
  Lightbulb,
  Brain,
  Star,
  User,
  Heart,
  Sparkles,
  Target,
  Coffee,
  Music
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import DiaryEditor from "../components/diary/DiaryEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap = {
  BookOpen,
  Lightbulb,
  Brain,
  Star,
  User,
  Heart,
  Sparkles,
  Target,
  Coffee,
  Music
};

export default function DiarioPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, entry: null });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diaryEntries'],
    queryFn: () => base44.entities.DiaryEntry.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['diaryCategories'],
    queryFn: () => base44.entities.DiaryCategory.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DiaryEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaryEntries'] });
      setDeleteDialog({ open: false, entry: null });
    },
  });

  // Filtrar entradas por categoria e data
  const filteredEntries = entries.filter(entry => {
    const categoryMatch = categoryFilter === "all" || entry.category === categoryFilter;
    
    let dateMatch = true;
    if (dateFilter === "today") {
      dateMatch = isSameDay(new Date(entry.created_date), new Date());
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateMatch = new Date(entry.created_date) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateMatch = new Date(entry.created_date) >= monthAgo;
    }
    
    return categoryMatch && dateMatch;
  });

  // Entradas da data selecionada no calendário
  const selectedDateEntries = filteredEntries.filter(entry =>
    isSameDay(new Date(entry.created_date), selectedDate)
  );

  // Dias com entradas (para destacar no calendário)
  const daysWithEntries = filteredEntries.map(entry => new Date(entry.created_date));

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleDelete = (entry) => {
    setDeleteDialog({ open: true, entry });
  };

  const confirmDelete = () => {
    if (deleteDialog.entry) {
      deleteMutation.mutate(deleteDialog.entry.id);
    }
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return <BookOpen className="w-4 h-4" />;
    const IconComponent = iconMap[category.icon];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />;
  };

  const hasActiveFilters = categoryFilter !== "all" || dateFilter !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-amber-600" />
              Diário
            </h1>
            <p className="text-slate-600 mt-2">Registre seus pensamentos e memórias</p>
          </div>
          <Button
            onClick={() => {
              setEditingEntry(null);
              setShowEditor(true);
            }}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Entrada
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtros:</span>
              </div>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setDateFilter("all");
                  }}
                  className="text-slate-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}

              <div className="ml-auto text-sm text-slate-600">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entrada' : 'entradas'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border"
                modifiers={{
                  hasEntry: daysWithEntries,
                }}
                modifiersStyles={{
                  hasEntry: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: '#d97706',
                  },
                }}
              />
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-slate-700">
                <p className="font-medium mb-1">Data selecionada:</p>
                <p>{format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entrada' : 'entradas'} neste dia
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Entradas */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedDateEntries.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">
                    Nenhuma entrada para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowEditor(true);
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar nova entrada
                  </Button>
                </CardContent>
              </Card>
            ) : (
              selectedDateEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 items-center text-sm text-slate-600">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getCategoryIcon(entry.category)}
                            {entry.category}
                          </Badge>
                          <span className="text-xs">
                            {format(new Date(entry.created_date), "HH:mm")}
                          </span>
                          {entry.favorite && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              ⭐ Favorito
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                    />
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {entry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Editor Dialog */}
      {showEditor && (
        <DiaryEditor
          entry={editingEntry}
          onClose={() => {
            setShowEditor(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, entry: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a entrada "{deleteDialog.entry?.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, entry: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}