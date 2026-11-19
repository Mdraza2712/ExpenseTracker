import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from './firebase';
import { generateId } from '../utils/helpers';

export const cacheKey = (uid, entity) => `@cache:${uid}:${entity}`;

export const writeCache = async (uid, entity, items) => {
  try {
    await AsyncStorage.setItem(cacheKey(uid, entity), JSON.stringify(items));
  } catch {}
};

export const readCache = async (uid, entity) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid, entity));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const listLocal = async (uid, entity) => {
  const cached = await readCache(uid, entity);
  return cached || [];
};

export const listRemote = async (uid, entity) => {
  return firebaseService[entity].list(uid);
};

export const createRemote = async (uid, entity, data) => {
  const { id } = await firebaseService[entity].create(uid, data);
  return id;
};

export const updateRemote = async (uid, entity, id, data) => {
  await firebaseService[entity].update(uid, id, data);
};

export const removeRemote = async (uid, entity, id) => {
  await firebaseService[entity].remove(uid, id);
};

export const enqueueOffline = async (entry) => {
  try {
    const raw = await AsyncStorage.getItem('@sync:queue');
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(entry);
    await AsyncStorage.setItem('@sync:queue', JSON.stringify(queue));
  } catch {}
};

export const drainQueue = async (uid) => {
  try {
    const raw = await AsyncStorage.getItem('@sync:queue');
    const queue = raw ? JSON.parse(raw) : [];
    if (!queue.length) return;
    for (const entry of queue) {
      try {
        if (entry.type.endsWith('/create')) {
          entry.payload.id = await createRemote(uid, entry.entity, entry.payload);
        } else if (entry.type.endsWith('/update')) {
          await updateRemote(uid, entry.entity, entry.payload.id, entry.payload);
        } else if (entry.type.endsWith('/remove')) {
          await removeRemote(uid, entry.entity, entry.payload.id);
        }
      } catch {}
    }
    await AsyncStorage.removeItem('@sync:queue');
  } catch {}
};

export const makeLocalItem = (payload) => ({
  ...payload,
  id: payload.id || `local_${Date.now()}_${generateId()}`,
  createdAt: payload.createdAt || new Date().toISOString(),
});
