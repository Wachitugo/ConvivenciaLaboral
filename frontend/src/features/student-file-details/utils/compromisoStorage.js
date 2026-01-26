export const getCompromisosKey = (studentId) => `compromisos_${studentId}`;

export const getCompromisosFromStorage = (studentId) => {
  try {
    const data = localStorage.getItem(getCompromisosKey(studentId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCompromisosToStorage = (studentId, compromisos) => {
  try {
    localStorage.setItem(getCompromisosKey(studentId), JSON.stringify(compromisos));
    return true;
  } catch {
    return false;
  }
};
