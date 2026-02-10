import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatoriosPage() {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedUser, setSelectedUser] = useState("all");

  const { data: boards = [] } = useQuery({
    queryKey: ["kanbanBoards"],
    queryFn: () => base44.entities.KanbanBoard.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["kanbanTasks"],
    queryFn: () => base44.entities.KanbanTask.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list(),
  });

  React.useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(boards[0]?.id);
    }
  }, [boards, selectedBoard]);

  // Filtrar tarefas do quadro selecionado
  const boardTasks = tasks.filter(task => task.board_id === selectedBoard);

  // Relatório por Usuário
  const getUserReport = () => {
    const userTasks = selectedUser === "all" 
      ? boardTasks 
      : boardTasks.filter(task => task.assigned_to === selectedUser);

    const completed = userTasks.filter(task => task.status === "concluido").length;
    const inProgress = userTasks.filter(task => task.status === "em_andamento").length;
    const pending = userTasks.filter(task => task.status === "backlog").length;
    const review = userTasks.filter(task => task.status === "revisao").length;
    const overdue = userTasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < new Date() && task.status !== "concluido";
    }).length;

    return {
      total: userTasks.length,
      completed,
      inProgress,
      pending,
      review,
      overdue,
      completionRate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0,
    };
  };

  // Relatório de Desempenho do Kanban
  const getKanbanPerformance = () => {
    const statusCounts = {
      backlog: boardTasks.filter(t => t.status === "backlog").length,
      em_andamento: boardTasks.filter(t => t.status === "em_andamento").length,
      revisao: boardTasks.filter(t => t.status === "revisao").length,
      concluido: boardTasks.filter(t => t.status === "concluido").length,
    };

    // Identificar gargalos (colunas com muitas tarefas)
    const maxTasks = Math.max(...Object.values(statusCounts));
    const bottlenecks = Object.entries(statusCounts)
      .filter(([status, count]) => count === maxTasks && count > 0 && status !== "concluido")
      .map(([status]) => status);

    // Calcular tempo médio de conclusão (aproximação baseada em created_date)
    const completedTasks = boardTasks.filter(t => t.status === "concluido");
    const avgCompletionTime = completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, task) => {
            const created = new Date(task.created_date);
            const updated = new Date(task.updated_date);
            return sum + differenceInDays(updated, created);
          }, 0) / completedTasks.length
        )
      : 0;

    return {
      statusCounts,
      bottlenecks,
      avgCompletionTime,
      totalTasks: boardTasks.length,
    };
  };

  const userReport = getUserReport();
  const kanbanPerformance = getKanbanPerformance();

  // Exportar para CSV
  const exportToCSV = (type) => {
    let csvContent = "";
    let filename = "";

    if (type === "user") {
      filename = `relatorio_usuario_${format(new Date(), "yyyy-MM-dd")}.csv`;
      csvContent = "Métrica,Valor\n";
      csvContent += `Total de Tarefas,${userReport.total}\n`;
      csvContent += `Concluídas,${userReport.completed}\n`;
      csvContent += `Em Andamento,${userReport.inProgress}\n`;
      csvContent += `Pendentes,${userReport.pending}\n`;
      csvContent += `Em Revisão,${userReport.review}\n`;
      csvContent += `Atrasadas,${userReport.overdue}\n`;
      csvContent += `Taxa de Conclusão,${userReport.completionRate}%\n`;
    } else if (type === "kanban") {
      filename = `relatorio_kanban_${format(new Date(), "yyyy-MM-dd")}.csv`;
      csvContent = "Métrica,Valor\n";
      csvContent += `Total de Tarefas,${kanbanPerformance.totalTasks}\n`;
      csvContent += `Backlog,${kanbanPerformance.statusCounts.backlog}\n`;
      csvContent += `Em Andamento,${kanbanPerformance.statusCounts.em_andamento}\n`;
      csvContent += `Revisão,${kanbanPerformance.statusCounts.revisao}\n`;
      csvContent += `Concluído,${kanbanPerformance.statusCounts.concluido}\n`;
      csvContent += `Tempo Médio de Conclusão,${kanbanPerformance.avgCompletionTime} dias\n`;
      csvContent += `Gargalos,${kanbanPerformance.bottlenecks.join("; ") || "Nenhum"}\n`;
    } else if (type === "detailed") {
      filename = `relatorio_detalhado_${format(new Date(), "yyyy-MM-dd")}.csv`;
      csvContent = "Título,Status,Prioridade,Responsável,Prazo,Criado Em\n";
      
      const tasksToExport = selectedUser === "all" 
        ? boardTasks 
        : boardTasks.filter(task => task.assigned_to === selectedUser);

      tasksToExport.forEach(task => {
        const title = `"${task.title.replace(/"/g, '""')}"`;
        const status = task.status;
        const priority = task.priority;
        const assignedTo = task.assigned_to || "Não atribuído";
        const dueDate = task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "Sem prazo";
        const createdDate = format(new Date(task.created_date), "dd/MM/yyyy");
        
        csvContent += `${title},${status},${priority},${assignedTo},${dueDate},${createdDate}\n`;
      });
    }

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status) => {
    const labels = {
      backlog: "Backlog",
      em_andamento: "Em Andamento",
      revisao: "Revisão",
      concluido: "Concluído",
    };
    return labels[status] || status;
  };

  const getBottleneckBadge = (status) => {
    if (!kanbanPerformance.bottlenecks.includes(status)) return null;
    return (
      <Badge variant="destructive" className="ml-2">
        Gargalo
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-indigo-600" />
              Relatórios
            </h1>
            <p className="text-slate-600 mt-2">Análise de desempenho e progresso</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Quadro
                </label>
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
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Usuário
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório por Usuário */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Relatório de Progresso por Usuário
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV("user")}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Total</div>
                <div className="text-2xl font-bold text-slate-900">{userReport.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Concluídas</div>
                <div className="text-2xl font-bold text-green-700">{userReport.completed}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Em Andamento</div>
                <div className="text-2xl font-bold text-blue-700">{userReport.inProgress}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm text-amber-600 mb-1">Pendentes</div>
                <div className="text-2xl font-bold text-amber-700">{userReport.pending}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-sm text-yellow-600">Em Revisão</div>
                  <div className="text-xl font-bold text-yellow-700">{userReport.review}</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="text-sm text-red-600">Atrasadas</div>
                  <div className="text-xl font-bold text-red-700">{userReport.overdue}</div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div>
                  <div className="text-sm text-indigo-600">Taxa de Conclusão</div>
                  <div className="text-xl font-bold text-indigo-700">{userReport.completionRate}%</div>
                </div>
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório de Desempenho Kanban */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Desempenho do Quadro Kanban
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV("kanban")}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Distribuição por Status</h4>
                <div className="space-y-3">
                  {Object.entries(kanbanPerformance.statusCounts).map(([status, count]) => {
                    const percentage = kanbanPerformance.totalTasks > 0
                      ? Math.round((count / kanbanPerformance.totalTasks) * 100)
                      : 0;
                    
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-700 flex items-center">
                            {getStatusLabel(status)}
                            {getBottleneckBadge(status)}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-3">Métricas de Desempenho</h4>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-600 mb-1">Total de Tarefas</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {kanbanPerformance.totalTasks}
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-indigo-600 mb-1">
                      Tempo Médio de Conclusão
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {kanbanPerformance.avgCompletionTime} dias
                    </div>
                  </div>
                  {kanbanPerformance.bottlenecks.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600 mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Gargalos Identificados
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {kanbanPerformance.bottlenecks.map((status) => (
                          <Badge key={status} variant="destructive">
                            {getStatusLabel(status)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exportação Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Exportação Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Exporte um relatório detalhado com todas as tarefas, incluindo título, status,
              prioridade, responsável e prazos.
            </p>
            <Button onClick={() => exportToCSV("detailed")}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório Completo (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}