import { Button } from "@/components/ui/button";
import { FileCode, Server, Database, Layout } from "lucide-react";

const examples = [
  {
    icon: FileCode,
    label: "React Component",
    code: `import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

export function TaskList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (filter === 'active') query = query.eq('completed', false);
      if (filter === 'done') query = query.eq('completed', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      if (error) throw error;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'active', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} 
            className={\`px-3 py-1 rounded \${filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100'}\`}>
            {f}
          </button>
        ))}
      </div>
      {isLoading ? <p>Loading...</p> : tasks?.map(task => (
        <div key={task.id} className="flex items-center gap-3 p-3 border rounded">
          <input type="checkbox" checked={task.completed} onChange={() => toggleMutation.mutate(task)} />
          <span className={task.completed ? 'line-through opacity-50' : ''}>{task.title}</span>
        </div>
      ))}
    </div>
  );
}`,
  },
  {
    icon: Server,
    label: "Express API",
    code: `const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, hash, name]
  );
  const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: rows[0], token });
});

app.get('/api/tasks', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]
  );
  res.json(rows);
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const { title, description } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
    [title, description, req.user.id]
  );
  res.status(201).json(rows[0]);
});

app.listen(3000, () => console.log('Server running on :3000'));`,
  },
  {
    icon: Database,
    label: "Database Schema",
    code: `-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Project members with roles
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Tasks with status tracking
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority INTEGER DEFAULT 0,
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_project_members_user ON project_members(user_id);`,
  },
  {
    icon: Layout,
    label: "Next.js Page",
    code: `import { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

interface DashboardProps {
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: { tasks: number; members: number };
  }>;
  stats: { totalTasks: number; completedTasks: number; activeProjects: number };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) return { redirect: { destination: '/login', permanent: false } };

  const [projects, totalTasks, completedTasks] = await Promise.all([
    prisma.project.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: { _count: { select: { tasks: true, members: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.task.count({ where: { project: { members: { some: { userId: session.user.id } } } } }),
    prisma.task.count({ where: { status: 'done', project: { members: { some: { userId: session.user.id } } } } }),
  ]);

  return {
    props: {
      projects: JSON.parse(JSON.stringify(projects)),
      stats: { totalTasks, completedTasks, activeProjects: projects.length },
    },
  };
};

export default function Dashboard({ projects, stats }: DashboardProps) {
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <>
      <Head><title>Dashboard</title></Head>
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Active Projects" value={stats.activeProjects} />
          <StatCard label="Total Tasks" value={stats.totalTasks} />
          <StatCard label="Completion Rate" value={\`\${completionRate}%\`} />
        </div>
        <div className="grid gap-4">
          {projects.map(project => (
            <Link key={project.id} href={\`/projects/\${project.id}\`}>
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-400">
                  <span>{project._count.tasks} tasks</span>
                  <span>{project._count.members} members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}`,
  },
];

interface ExampleSnippetsProps {
  onSelect: (code: string) => void;
}

export function ExampleSnippets({ onSelect }: ExampleSnippetsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
      {examples.map((example) => (
        <Button
          key={example.label}
          variant="outline"
          size="sm"
          onClick={() => onSelect(example.code)}
          className="flex items-center gap-2 text-xs h-9 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <example.icon className="h-3.5 w-3.5 text-primary" />
          {example.label}
        </Button>
      ))}
    </div>
  );
}
