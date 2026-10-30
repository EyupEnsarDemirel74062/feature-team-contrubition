export function createTaskApi(config, request = fetch) {
  const url = new URL(config.supabaseUrl);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
      url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Use the HTTPS project URL from Supabase.');
  }
  if (config.tableName !== 'tasks') throw new Error('The database table must be named tasks.');
  if (!config.supabasePublishableKey?.startsWith('sb_publishable_')) {
    throw new Error('Add the public Supabase publishable key to config.json.');
  }

  const base = `${url.origin}/rest/v1/tasks`;
  const headers = { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' };

  async function send(method, query = '', data) {
    let response;
    try {
      response = await request(base + query, {
        method,
        headers: { ...headers, ...(method === 'GET' ? {} : { Prefer: 'return=representation' }) },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      throw new Error('Cannot reach the database. Check your connection and try again.');
    }
    if (!response.ok) {
      const hint = response.status === 401 || response.status === 403
        ? 'Check the public API key and tasks table permissions.'
        : 'Please try again. If it continues, check the database setup.';
      throw new Error(`Database request failed (${response.status}). ${hint}`);
    }
    return response.status === 204 ? [] : response.json();
  }

  function byId(id) {
    if (!/^\d+$/.test(String(id))) throw new Error('Invalid task ID.');
    return `?id=eq.${id}`;
  }

  function taskData(title, description) {
    title = title.trim();
    if (!title) throw new Error('Please enter a task title.');
    return { title, description: description.trim() };
  }

  return {
    list: () => send('GET', '?select=*&order=id.asc'),
    get: id => send('GET', `${byId(id)}&select=*`),
    add: (title, description) => send('POST', '', { ...taskData(title, description), completed: false }),
    edit: (id, title, description) => send('PATCH', byId(id), taskData(title, description)),
    toggle: (id, completed) => send('PATCH', byId(id), { completed: !completed }),
    remove: id => send('DELETE', byId(id))
  };
}

async function startApp() {
  const form = document.getElementById('task-form');
  const titleInput = document.getElementById('task-title');
  const descriptionInput = document.getElementById('task-description');
  const submit = document.getElementById('task-submit');
  const cancel = document.getElementById('cancel-edit');
  const heading = document.getElementById('form-heading');
  const list = document.getElementById('task-list');
  const status = document.getElementById('status-message');
  const count = document.getElementById('task-count');
  let api;
  let editingId = null;
  let busy = false;

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input, textarea, button').forEach(element => { element.disabled = value; });
    list.querySelectorAll('button').forEach(button => { button.disabled = value; });
    list.setAttribute('aria-busy', String(value));
  }

  function resetForm() {
    editingId = null;
    form.reset();
    heading.textContent = 'Add a task';
    submit.textContent = 'Add task +';
    cancel.hidden = true;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function render(tasks) {
    list.replaceChildren();
    count.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
    if (!tasks.length) {
      const empty = element('p', 'empty', 'Add your first task using the form.');
      empty.prepend(element('strong', '', 'A fresh start.'));
      list.append(empty);
    }
    tasks.forEach(task => {
      const item = element('article', 'task-item', '');
      item.dataset.id = String(task.id);
      item.classList.toggle('is-completed', task.completed);
      const top = element('div', 'task-top', '');
      top.append(element('h3', 'task-title', task.title),
        element('span', 'task-status', task.completed ? 'Completed' : 'Incomplete'));
      const actions = element('div', 'task-actions', '');
      const edit = element('button', 'edit-task', 'Edit');
      const toggle = element('button', 'toggle-task', task.completed ? 'Mark incomplete' : 'Mark complete');
      const remove = element('button', 'delete-task', 'Delete');
      [edit, toggle, remove].forEach(button => { button.type = 'button'; });

      edit.addEventListener('click', () => run(async () => {
        const [current] = await api.get(task.id);
        if (!current) throw new Error('This task no longer exists. Refresh the page to update the list.');
        editingId = String(current.id);
        titleInput.value = current.title;
        descriptionInput.value = current.description || '';
        heading.textContent = 'Edit task';
        submit.textContent = 'Save changes';
        cancel.hidden = false;
        message('Editing task. Save your changes or cancel.');
      }).then(() => titleInput.focus()));
      toggle.addEventListener('click', () => run(async () => {
        const changed = await api.toggle(task.id, task.completed);
        if (!changed.length) throw new Error('This task no longer exists. Refresh the page.');
        await refresh();
        message(task.completed ? 'Task marked incomplete.' : 'Task completed.');
      }));
      remove.addEventListener('click', () => run(async () => {
        await api.remove(task.id);
        if (editingId === String(task.id)) resetForm();
        await refresh();
        message('Task deleted.');
      }));

      actions.append(edit, toggle, remove);
      item.append(top, element('p', 'task-description', task.description || 'No description.'), actions);
      list.append(item);
    });
  }

  async function refresh() {
    const tasks = await api.list();
    if (!Array.isArray(tasks)) throw new Error('The database returned an unexpected response.');
    render(tasks);
  }

  async function run(action) {
    if (busy || !api) return;
    setBusy(true);
    try { await action(); }
    catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!titleInput.value.trim()) {
      message('Please enter a task title.', true);
      titleInput.focus();
      return;
    }
    run(async () => {
      const editing = editingId !== null;
      const changed = editing
        ? await api.edit(editingId, titleInput.value, descriptionInput.value)
        : await api.add(titleInput.value, descriptionInput.value);
      if (!changed.length) throw new Error('The task could not be saved. Refresh and try again.');
      resetForm();
      await refresh();
      message(editing ? 'Task updated.' : 'Task added.');
    });
  });
  cancel.addEventListener('click', () => { resetForm(); message('Editing cancelled.'); });

  setBusy(true);
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load config.json.');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey) {
      throw new Error('Database setup is pending. Add the project URL and public publishable key to config.json.');
    }
    api = createTaskApi(config);
    await refresh();
    message('Tasks loaded.');
  } catch (error) {
    message(error.message, true);
  } finally {
    setBusy(!api);
    list.setAttribute('aria-busy', 'false');
  }
}

if (typeof document !== 'undefined') startApp();
