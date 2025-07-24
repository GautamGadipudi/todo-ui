"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodos, deleteTodo, createTodo, updateTodo, updateTodoStatus } from "@/lib/api";
import { Box, Typography, IconButton, Menu, MenuItem, Paper, Tooltip, Snackbar, Alert } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TodoModal from "@/components/TodoModal";

// Add Todo type
interface Todo {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date?: string;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

const STATUSES = ["Created", "Groomed", "In Progress", "Resolved", "Completed"];

const STATUS_COLORS: Record<string, string> = {
  Created: '#bdbdbd', // grey
  Groomed: '#29b6f6', // info (light blue)
  'In Progress': '#1976d2', // primary (blue)
  Resolved: '#ab47bc', // secondary (purple)
  Completed: '#43a047', // success (green)
};

function trimText(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function getLocalDateString(dateStr: string) {
  if (!dateStr) return '';
  // Only run on client to avoid SSR mismatch
  if (typeof window === 'undefined') return dateStr.split('T')[0];
  const [yyyy, mm, dd] = dateStr.split('T')[0].split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDueDateDisplay(dueDateStr: string) {
  if (!dueDateStr) return null;
  const today = new Date();
  const dueDate = new Date(dueDateStr.split('T')[0]);
  // Remove time for comparison
  today.setHours(0,0,0,0);
  dueDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = getLocalDateString(dueDateStr);
  if (diffDays < 0) {
    // Overdue
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <ErrorOutlineIcon fontSize="inherit" sx={{ color: 'error.main' }} />
        <Typography fontSize={12} color="error.main"><b>Overdue:</b> {formatted}</Typography>
      </Box>
    );
  } else if (diffDays <= 3) {
    // Due soon
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <WarningAmberIcon fontSize="inherit" sx={{ color: 'orange' }} />
        <Typography fontSize={12} sx={{ color: 'orange' }}><b>Due soon:</b> {formatted}</Typography>
      </Box>
    );
  } else {
    // Not urgent
    return (
      <Typography fontSize={12} color="text.primary">Due: {formatted}</Typography>
    );
  }
}

export default function BoardPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTodoId, setMenuTodoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateInitialData, setUpdateInitialData] = useState<Partial<Todo> | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

  // Drag and drop handlers
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodoId(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTodoId) {
      setActionLoading(true);
      try {
        await updateTodoStatus(draggedTodoId, newStatus);
        setSnackbar({ open: true, message: "Todo status updated", severity: "success" });
        fetchTodos();
      } catch {
        setSnackbar({ open: true, message: "Failed to update status", severity: "error" });
      } finally {
        setActionLoading(false);
        setDraggedTodoId(null);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) router.replace("/login");
    }
    fetchTodos();
    // eslint-disable-next-line
  }, []);

  async function fetchTodos() {
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data);
      console.log('Fetched todos:', data);
    } catch {
      setTodos([]);
      setSnackbar({ open: true, message: "Failed to load todos", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, todoId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTodoId(todoId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTodoId(null);
  };

  const handleDelete = async () => {
    if (menuTodoId) {
      setActionLoading(true);
      try {
        await deleteTodo(menuTodoId);
        setSnackbar({ open: true, message: "Todo deleted", severity: "success" });
        fetchTodos();
      } catch {
        setSnackbar({ open: true, message: "Failed to delete todo", severity: "error" });
      } finally {
        setActionLoading(false);
        handleMenuClose();
      }
    }
  };

  const handleCreate = async (data: { title: string; description?: string; due_date?: string }) => {
    setActionLoading(true);
    try {
      await createTodo(data);
      setSnackbar({ open: true, message: "Todo created", severity: "success" });
      setCreateModalOpen(false);
      fetchTodos();
    } catch {
      setSnackbar({ open: true, message: "Failed to create todo", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: { title: string; description?: string; due_date?: string }) => {
    if (menuTodoId) {
      setActionLoading(true);
      try {
        await updateTodo(menuTodoId, data);
        setSnackbar({ open: true, message: "Todo updated", severity: "success" });
        setUpdateModalOpen(false);
        fetchTodos();
      } catch {
        setSnackbar({ open: true, message: "Failed to update todo", severity: "error" });
      } finally {
        setActionLoading(false);
        handleMenuClose();
      }
    }
  };

  const handleOpenUpdateModal = () => {
    const todo = todos.find(t => t.id === menuTodoId);
    if (todo) {
      setUpdateInitialData({
        title: todo.title,
        description: todo.description,
        due_date: todo.due_date,
        status: todo.status, // Pass current status
      });
      setUpdateModalOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  console.log('Rendering todos:', todos);
  return (
    <Box p={2} minHeight="100vh" bgcolor="#f5f5f5">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4">My Todos</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Add Todo">
            <IconButton color="primary" onClick={() => setCreateModalOpen(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton color="secondary" onClick={handleLogout} aria-label="logout">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* Replace Grid container with Box for horizontal scrollable swimlanes */}
      <Box display="flex" gap={2} sx={{ overflowX: 'auto', minHeight: '80vh' }}>
        {STATUSES.map((status) => (
          <Box
            key={status}
            minWidth={260}
            flexShrink={0}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, status)}
          >
            <Paper elevation={2} sx={{ p: 1, bgcolor: '#f9fafb', height: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="h6"
                align="center"
                mb={1}
                sx={{
                  color: '#fff',
                  bgcolor: STATUS_COLORS[status] || '#bdbdbd',
                  borderRadius: 1,
                  py: 0.5,
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontSize: 18,
                  boxShadow: 1,
                }}
              >
                {status}
              </Typography>
              {loading ? (
                <Typography align="center">Loading...</Typography>
              ) : Array.isArray(todos) && todos.filter(t => t.status === status).length === 0 ? (
                <Typography align="center" color="text.secondary" fontSize={14}>No todos</Typography>
              ) : (
                (Array.isArray(todos) ? todos : []).filter(t => t.status === status).map(todo => (
                  <Paper
                    key={todo.id}
                    sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: '#fffbe7',
                      borderRadius: 2,
                      minHeight: 140,
                      cursor: 'pointer',
                      boxShadow: 2,
                      position: 'relative',
                      maxWidth: 240,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 6 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => router.push(`/todo/${todo.id}`)}
                    tabIndex={0}
                    aria-label={`View todo ${todo.title}`}
                    draggable
                    onDragStart={e => handleDragStart(e, todo.id)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography fontWeight={600} fontSize={14} gutterBottom>
                          {trimText(todo.title, 40)}
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          {trimText(todo.description, 40)}
                        </Typography>
                        {todo.due_date && (
                          <Box mt={0.5}>{typeof window !== 'undefined' ? getDueDateDisplay(todo.due_date) : <Typography fontSize={12} color="text.primary">Due: {todo.due_date.split('T')[0]}</Typography>}</Box>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); handleMenuOpen(e, todo.id); }}
                        sx={{ ml: 1 }}
                        aria-label="todo actions"
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))
              )}
            </Paper>
          </Box>
        ))}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenUpdateModal} disabled={actionLoading}>Update</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }} disabled={actionLoading}>Delete</MenuItem>
      </Menu>
      <TodoModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
        loading={actionLoading}
      />
      <TodoModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={updateInitialData}
        mode="update"
        loading={actionLoading}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Box mt={2} textAlign="center">
        <Box display="inline-flex" alignItems="center" gap={0.5} justifyContent="center">
          <InfoOutlinedIcon fontSize="small" color="info" sx={{ verticalAlign: 'middle' }} />
          <Typography variant="caption" color="text.secondary">
            Drag and drop todos to change status
          </Typography>
        </Box>
      </Box>
    </Box>
  );
} 