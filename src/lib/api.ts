import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function register(email: string, password: string) {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
}

// Todos
export async function getTodos() {
  const res = await api.get('/todos/');
  return res.data;
}

export async function getTodo(id: string) {
  const res = await api.get(`/todos/${id}`);
  return res.data;
}

export async function createTodo(data: { title: string; description?: string; due_date?: string; status?: string }) {
  const res = await api.post('/todos/', data);
  console.log('Created todo:', res.data);
  return res.data;
}

export async function updateTodo(id: string, data: { title?: string; description?: string; due_date?: string; status?: string; completed?: boolean }) {
  const res = await api.put(`/todos/${id}`, data);
  return res.data;
}

export async function updateTodoStatus(id: string, status: string) {
  const res = await api.put(`/todos/${id}/status`, { status });
  return res.data;
}

export async function deleteTodo(id: string) {
  const res = await api.delete(`/todos/${id}`);
  return res.data;
} 