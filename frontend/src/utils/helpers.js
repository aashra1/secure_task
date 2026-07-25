export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No due date');
export const taskCounts = (tasks = []) => tasks.reduce((acc, task) => ({ ...acc, [task.status]: (acc[task.status] || 0) + 1 }), {});
export const passwordScore = (password = '') => ['[a-z]', '[A-Z]', '\\d', '[^A-Za-z0-9]'].reduce((score, rule) => score + (new RegExp(rule).test(password) ? 1 : 0), password.length >= 8 ? 1 : 0);
