import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, User, CheckSquare, Filter, X } from "lucide-react";
import KanbanTaskModal from "../components/kanban/KanbanTaskModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

const columns = [
  { id: "backlog", title: "Backlog", color: "slate" },
  { id: "em_andamento", title: "Em Andamento", color: "blue" },
  { id: "revisao", title: "Revisão", color: "yellow" },
  { id: "concluido", title: "Concluído", color: "green" },
];

const priorityColors = {
  baixa: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
};

export default function KanbanPage() {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");

  const queryClient = useQueryClient();

  const { data: boards = [] } = useQuery({
    queryKey: ["kanbanBoards"],
    queryFn: () => base44.entities.KanbanBoard.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["kanbanTasks", selectedBoard],
    queryFn: () => {
      if (!selectedBoard) return [];
      return base44.entities.KanbanTask.filter({ board_id: selectedBoard });
    },
    enabled: !!selectedBoard,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.KanbanTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanTasks"] });
    },
  });

  React.useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(boards[0].id);
    }
  }, [boards, selectedBoard]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;

    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus, order: result.destination.index },
    });
  };

  // Filtrar tarefas
  const filteredTasks = tasks.filter((task) => {
    // Filtro de prazo
    if (dueDateFilter !== "all" && task.due_date) {
      const dueDate = new Date(task.due_date);
      if (dueDateFilter === "overdue" && !isPast(dueDate)) return false;
      if (dueDateFilter === "today" && !isToday(dueDate)) return false;
      if (dueDateFilter === "tomorrow" && !isTomorrow(dueDate)) return false;
      if (dueDateFilter === "week") {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (dueDate > weekFromNow) return false;
      }
    } else if (dueDateFilter !== "all" && !task.due_date) {
      return false;
    }

    // Filtro de responsável
    if (assignedFilter !== "all") {
      if (assignedFilter === "unassigned" && task.assigned_to) return false;
      if (assignedFilter !== "unassigned" && task.assigned_to !== assignedFilter) return false;
    }

    return true;
  });

  const getTasksByColumn = (columnId) => {
    return filteredTasks
      .filter((task) => task.status === columnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getDueDateBadge = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    
    return (
      <Badge variant="outline" className={`text-xs ${isOverdue ? 'bg-red-100 text-red-800 border-red-300' : ''}`}>
        <Calendar className="w-3 h-3 mr-1" />
        {isToday(date) ? 'Hoje' : isTomorrow(date) ? 'Amanhã' : format(date, 'dd/MM', { locale: ptBR })}
      </Badge>
    );
  };

  const getChecklistProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter(item => item.checked).length;
    const total = checklist.length;
    const percentage = Math.round((completed / total) * 100);
    
    return (
      <Badge variant="outline" className="text-xs">
        <CheckSquare className="w-3 h-3 mr-1" />
        {completed}/{total}
      </Badge>
    );
  };

  const getUserName = (email) => {
    if (!email) return null;
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const hasActiveFilters = dueDateFilter !== "all" || assignedFilter !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Kanban</h1>
          <div className="flex gap-3">
            {boards.length > 0 && (
              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar quadro" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setTaskModal({ open: true, task: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtros:</span>
              </div>

              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os prazos</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="week">Próximos 7 dias</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos responsáveis</SelectItem>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDueDateFilter("all");
                    setAssignedFilter("all");
                  }}
                  className="text-slate-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}

              <div className="ml-auto text-sm text-slate-600">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedBoard ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((column) => (
                <div key={column.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{column.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {getTasksByColumn(column.id).length}
                    </Badge>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] ${
                          snapshot.isDraggingOver ? "bg-slate-100" : ""
                        } rounded-lg p-2 transition-colors`}
                      >
                        {getTasksByColumn(column.id).map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                                  snapshot.isDragging ? "shadow-xl" : ""
                                }`}
                                onClick={() => setTaskModal({ open: true, task })}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-slate-900 text-sm">
                                      {task.title}
                                    </h4>
                                  </div>

                                  {task.description && (
                                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-2 items-center">
                                    <Badge className={priorityColors[task.priority]}>
                                      {task.priority}
                                    </Badge>
                                    {getDueDateBadge(task.due_date)}
                                    {getChecklistProgress(task.checklist)}
                                    {task.assigned_to && (
                                      <Badge variant="outline" className="text-xs">
                                        <User className="w-3 h-3 mr-1" />
                                        {getUserName(task.assigned_to)?.split(' ')[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">Crie um quadro para começar</p>
            </CardContent>
          </Card>
        )}
      </div>

      {taskModal.open && (
        <KanbanTaskModal
          task={taskModal.task}
          boardId={selectedBoard}
          users={users}
          onClose={() => setTaskModal({ open: false, task: null })}
        />
      )}
    </div>
  );
}