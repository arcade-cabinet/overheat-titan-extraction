export class CapacitorSQLite {}
export class SQLiteConnection {
  constructor() {}
  async initWebStore() {}
  async createConnection() {
    return {
      open: async () => {},
      query: async () => ({ values: [] }),
      run: async () => {}
    }
  }
}
