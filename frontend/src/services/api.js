import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Аутентификация
export const login = (credentials) => api.post('/login', credentials)
export const logout = () => api.post('/logout')
export const checkAuth = () => api.get('/check_auth')

// Сотрудники
export const getEmployees = (params = {}) => api.get('/employees', { params })
export const createEmployee = (data) => api.post('/employees', data)
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data)
export const deleteEmployee = (id) => api.delete(`/employees/${id}`)

// Отделы
export const getDepartments = () => api.get('/departments')

// Загрузка фото
export const uploadPhoto = (employeeId, file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post(`/upload_photo/${employeeId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Импорт
export const importData = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Экспорт
export const exportPDF = () => api.get('/export/pdf', { responseType: 'blob' })

export default api
