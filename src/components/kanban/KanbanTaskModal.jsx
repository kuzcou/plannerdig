import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, X, Trash2 } from "lucide-react";

export default function KanbanTaskModal({ task, boardId, users, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "backlog");
  const [priority, setPriority] = useState(task?.priority || "media");
  const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date) : null);
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "");
  const [checklist, setChecklist] = useState(task?.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (task) {
        return base44.entities.KanbanTask.update(task.id, data);
      }
      return base44.entities.KanbanTask.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanTasks"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KanbanTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanTasks"] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!title.trim()) return;

    saveMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      board_id: boardId,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      assigned_to: assignedTo || null,
      checklist,
    });
  };

  const handleDelete = () => {
    if (task && confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteMutation.mutate(task.id);
    }
  };

  const addChecklistItem = () => {
    if (newCheckItem.trim()) {
      setChecklist([...checklist, { text: newCheckItem.trim(), checked: false }]);
      setNewCheckItem("");
    }
  };

  const toggleChecklistItem = (index) => {
    const updated = [...checklist];
    updated[index].checked = !updated[index].checked;
    setChecklist(updated);
  };

  const removeChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes sobre a tarefa..."
              className="mt-1 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="assigned">Responsável</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Atribuir a..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem responsável</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Checklist</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
                placeholder="Adicionar item..."
              />
              <Button type="button" onClick={addChecklistItem} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {checklist.length > 0 && (
              <div className="mt-3 space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklistItem(index)}
                    />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-500' : ''}`}>
                      {item.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(index)}
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <div>
            {task && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}