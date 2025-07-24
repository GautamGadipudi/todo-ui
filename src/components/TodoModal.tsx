import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { format } from "date-fns";

export interface TodoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; due_date?: string; status?: string }) => Promise<void>;
  initialData?: { title?: string; description?: string; due_date?: string; status?: string };
  loading?: boolean;
  mode?: "create" | "update";
}

export default function TodoModal({ open, onClose, onSubmit, initialData, loading, mode = "create" }: TodoModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState(initialData?.due_date ? initialData.due_date.split('T')[0] : "");
  const [status, setStatus] = useState(initialData?.status || "Created");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
    setDueDate(initialData?.due_date ? initialData.due_date.split('T')[0] : "");
    setStatus(initialData?.status || "Created");
    setError("");
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      status,
    });
  };

  const STATUSES = ["Created", "Groomed", "In Progress", "Resolved", "Completed"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === "create" ? "Add Todo" : "Update Todo"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            required
            margin="normal"
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            inputProps={{ maxLength: 2000 }}
          />
          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={status}
              label="Status"
              onChange={e => setStatus(e.target.value)}
            >
              {STATUSES.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <Box color="error.main" mt={1}>{error}</Box>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {mode === "create" ? "Add" : "Update"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 