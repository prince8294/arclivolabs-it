"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { PROJECT_STATUSES, SERVICE_IDS } from "@/lib/validations/business";
import { formatINR } from "@/lib/finance/money";

interface Project {
  _id: string;
  name: string;
  clientName: string;
  businessName?: string;
  serviceName: string;
  agreedValueMinor: number;
  status: (typeof PROJECT_STATUSES)[number];
  progress: number;
  deadline?: string;
  tasks: { _id: string; title: string; assignedTo?: string; completed: boolean }[];
}

export function ProjectsBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    businessName: "",
    serviceId: "website-development",
    agreedValueMinor: 0,
    deadline: "",
    status: "Not Started",
    progress: 0,
    assignedTo: "",
    description: "",
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/projects", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setProjects(result.items ?? []);
    else setError(result.message || "Projects could not be loaded.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        agreedValueMinor: Number(form.agreedValueMinor),
        status: form.status,
        progress: Number(form.progress),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The project could not be created.");
      return;
    }
    setOpen(false);
    setNotice("Client project created.");
    await load();
  };

  const addTask = async (project: Project) => {
    if (!taskTitle.trim()) return;
    const response = await fetch(`/api/admin/projects/${project._id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, assignedTo: "" }),
    });
    if (response.ok) {
      setTaskTitle("");
      setNotice("Task added.");
      await load();
    } else {
      const result = await response.json();
      setError(result.message || "The task could not be added.");
    }
  };

  const toggleTask = async (project: Project, taskId: string, completed: boolean) => {
    await fetch(`/api/admin/projects/${project._id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, completed: !completed }),
    });
    await load();
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">DELIVERY / WORK</span><h2>Projects</h2><p>Track delivery, tasks, deadlines and project contribution.</p></div>
        <button className="admin-primary-action" onClick={() => setOpen(true)} type="button"><Plus size={16} /> Add project</button>
      </div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}

      {open && (
        <div className="agency-modal-backdrop" onMouseDown={() => setOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createProject}>
            <div className="agency-modal__heading"><div><span className="admin-page-eyebrow">NEW PROJECT</span><h3>Add project</h3></div><button onClick={() => setOpen(false)} type="button">×</button></div>
            <div className="agency-form-grid">
              <label>Project name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Client name<input required value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></label>
              <label>Business name<input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></label>
              <label>Service<select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>{SERVICE_IDS.map((id) => <option key={id}>{id}</option>)}</select></label>
              <label>Agreed value (paise)<input min="0" type="number" value={form.agreedValueMinor} onChange={(event) => setForm({ ...form, agreedValueMinor: Number(event.target.value) })} /></label>
              <label>Deadline<input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label>
              <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{PROJECT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Progress %<input min="0" max="100" type="number" value={form.progress} onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })} /></label>
              <label className="agency-form-grid__full">Description<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Create project</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="agency-loading">Loading projects…</div> : (
        <div className="agency-card-grid">
          {projects.map((project) => (
            <article className="agency-project-card" key={project._id}>
              <div className="agency-project-card__icon"><FolderKanban size={18} /></div>
              <span className="agency-status">{project.status}</span>
              <h3>{project.name}</h3>
              <p>{project.clientName}{project.businessName ? ` · ${project.businessName}` : ""}</p>
              <strong>{formatINR(project.agreedValueMinor)}</strong>
              <div className="agency-progress"><span style={{ width: `${project.progress}%` }} /></div>
              <small>{project.progress}% complete · {project.tasks?.filter((task) => task.completed).length ?? 0}/{project.tasks?.length ?? 0} tasks</small>
              <button type="button" onClick={() => setSelected(project)}>View / add tasks</button>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="agency-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section className="agency-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="agency-modal__heading"><div><span className="admin-page-eyebrow">PROJECT TASKS</span><h3>{selected.name}</h3></div><button onClick={() => setSelected(null)} type="button">×</button></div>
            <div className="agency-task-list">
              {selected.tasks?.map((task) => (
                <label key={task._id}><input type="checkbox" checked={task.completed} onChange={() => void toggleTask(selected, task._id, task.completed)} /><span>{task.title}</span></label>
              ))}
            </div>
            <div className="agency-inline-form"><input aria-label="New task" placeholder="Add task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} /><button className="admin-primary-action" onClick={() => void addTask(selected)} type="button">Add task</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
