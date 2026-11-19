import api from "./api";

export const addPersonApi = async (uid, person) => {
  const response = await api.post(`/users/${uid}/persons.json`, person);
  return response.data;
};

export const updatePersonApi = async (uid, id, person) => {
  await api.patch(`/users/${uid}/persons/${id}.json`, person);
};

export const deletePersonApi = async (uid, id) => {
  await api.delete(`/users/${uid}/persons/${id}.json`);
};

export const getPersonsApi = async (uid) => {
  const response = await api.get(`/users/${uid}/persons.json`);
  return response.data;
};
