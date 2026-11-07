const DB = {
  getAll(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  },
  saveAll(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  },
  nextId(key) {
    const list = this.getAll(key);
    return list.length ? Math.max(...list.map(r => r.id)) + 1 : 1;   // like AUTO_INCREMENT
  },
  insert(key, record) {
    const list = this.getAll(key);
    record.id = this.nextId(key);
    list.push(record);
    this.saveAll(key, list);
    return record;
  },
  update(key, id, changes) {
    const list = this.getAll(key).map(r => r.id === id ? { ...r, ...changes } : r);
    this.saveAll(key, list);
  },
  remove(key, id) {
    this.saveAll(key, this.getAll(key).filter(r => r.id !== id));
  },
  findById(key, id) {
    return this.getAll(key).find(r => r.id === id) || null;
  }
};