const storage = {
  saveData: (data) => {
    localStorage.setItem('taskMatrix', JSON.stringify(data));
    return Promise.resolve();
  },
  loadData: () => {
    const data = localStorage.getItem('taskMatrix');
    return Promise.resolve(data ? JSON.parse(data) : null);
  }
};

export { storage }; 