export class CapacitorSQLite {}
export class SQLiteConnection {
  async initWebStore() {}
  async createConnection() {
    return {
      open: async () => {},
      query: async () => ({ values: [] }),
      run: async () => {},
    }
  }
}
