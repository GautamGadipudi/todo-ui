"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTodo, updateTodo, deleteTodo, updateTodoStatus } from "@/lib/api";
import { Box, Typography, Paper, Button, IconButton, Menu, MenuItem, Chip, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TodoModal from "@/components/TodoModal";
import { format } from "date-fns";

const STATUSES = ["Created", "Groomed", "In Progress", "Resolved", "Completed"];

function getLocalDateString(dateStr: string) {
  if (!dateStr) return '';
  // Only run on client to avoid SSR mismatch
  if (typeof window === 'undefined') return dateStr.split('T')[0];
  const [yyyy, mm, dd] = dateStr.split('T')[0].split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

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

export default function TodoDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchTodo();
    // eslint-disable-next-line
  }, [id]);

  async function fetchTodo() {
    setLoading(true);
    try {
      const data = await getTodo(id);
      setTodo(data);
    } catch {
      setTodo(null);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (data: { title: string; description?: string; due_date?: string }) => {
    await updateTodo(id, data);
    setModalOpen(false);
    fetchTodo();
  };

  const handleDelete = async () => {
    await deleteTodo(id);
    router.replace("/board");
  };

  const handleStatusMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(e.currentTarget);
  };
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };
  const handleStatusChange = async (status: string) => {
    await updateTodoStatus(id, status);
    setStatusMenuAnchor(null);
    fetchTodo();
  };

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;
  if (!todo) return <Box p={4}><Typography>Todo not found</Typography></Box>;

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>Back</Button>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight={600}>{todo.title}</Typography>
          <Box>
            <IconButton onClick={() => setModalOpen(true)}><EditIcon /></IconButton>
            <IconButton onClick={handleDelete}><DeleteIcon color="error" /></IconButton>
          </Box>
        </Box>
        <Typography mt={2} mb={2}>{todo.description}</Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Chip
            label={todo.status}
            color={todo.status === "Completed" ? "success" : todo.status === "In Progress" ? "primary" : "default"}
            onClick={handleStatusMenuOpen}
            sx={{ cursor: 'pointer' }}
          />
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={handleStatusMenuClose}
          >
            {STATUSES.filter(s => s !== todo.status).map(status => (
              <MenuItem key={status} onClick={() => handleStatusChange(status)}>{status}</MenuItem>
            ))}
          </Menu>
          {todo.due_date && (
            <Chip label={`Due: ${typeof window !== 'undefined' ? getLocalDateString(todo.due_date) : todo.due_date.split('T')[0]}`} color="warning" />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">Created: {format(new Date(todo.created_at ?? ''), 'MMM d, yyyy')}</Typography>
        <Typography variant="body2" color="text.secondary">Updated: {format(new Date(todo.updated_at ?? ''), 'MMM d, yyyy')}</Typography>
      </Paper>
      <TodoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={{ title: todo.title, description: todo.description, due_date: todo.due_date, status: todo.status }}
        mode="update"
      />
    </Box>
  );
} 