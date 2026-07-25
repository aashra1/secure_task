import { useEffect, useState } from 'react';
import * as taskApi from '../services/tasks';

export default function useTasks(params) {
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = async () => {
    setLoading(true);
    setError('');
    try { setData(await taskApi.getTasks(params)); } catch (err) { setError(err.response?.data?.message || 'Unable to load tasks'); } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, [JSON.stringify(params)]);
  return { data, loading, error, reload };
}
