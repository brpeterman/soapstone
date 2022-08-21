export const getClient = async () => {
  return {
    search: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    index: jest.fn(),
    deleteByQuery: jest.fn()
  }
}
