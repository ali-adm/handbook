import React, { useState, useEffect } from 'react'
import {
  Paper,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material'
import { Add, Edit, Delete, Upload, CloudUpload } from '@mui/icons-material'
import EmployeeTable from './EmployeeTable'
import { 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  importData,
  uploadPhoto 
} from '../services/api'

const AdminPanel = () => {
  const [employees, setEmployees] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [employeeData, setEmployeeData] = useState({
    department: '',
    full_name: '',
    position: '',
    internal_phone: '',
    common_phone: '',
    city_phone: '',
    email: ''
  })
  const [importFile, setImportFile] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreate = () => {
    setCurrentEmployee(null)
    setEmployeeData({
      department: '',
      full_name: '',
      position: '',
      internal_phone: '',
      common_phone: '',
      city_phone: '',
      email: ''
    })
    setDialogOpen(true)
  }

  const handleEdit = (employee) => {
    setCurrentEmployee(employee)
    setEmployeeData({
      department: employee.department,
      full_name: employee.full_name,
      position: employee.position,
      internal_phone: employee.internal_phone || '',
      common_phone: employee.common_phone || '',
      city_phone: employee.city_phone || '',
      email: employee.email || ''
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (currentEmployee) {
        await updateEmployee(currentEmployee.id, employeeData)
        showSnackbar('Сотрудник обновлен')
      } else {
        await createEmployee(employeeData)
        showSnackbar('Сотрудник создан')
      }
      setDialogOpen(false)
      // Перезагружаем таблицу через событие или обновление состояния
      window.dispatchEvent(new Event('employeesUpdated'))
    } catch (error) {
      showSnackbar('Ошибка сохранения', 'error')
    }
  }

  const handleDelete = async (employee) => {
    if (window.confirm(`Удалить сотрудника ${employee.full_name}?`)) {
      try {
        await deleteEmployee(employee.id)
        showSnackbar('Сотрудник удален')
        window.dispatchEvent(new Event('employeesUpdated'))
      } catch (error) {
        showSnackbar('Ошибка удаления', 'error')
      }
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      showSnackbar('Выберите файл для импорта', 'error')
      return
    }

    try {
      const response = await importData(importFile)
      showSnackbar(response.data.message)
      setImportOpen(false)
      setImportFile(null)
      window.dispatchEvent(new Event('employeesUpdated'))
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Ошибка импорта', 'error')
    }
  }

  const handlePhotoUpload = async (employeeId, file) => {
    try {
      await uploadPhoto(employeeId, file)
      showSnackbar('Фото загружено')
      window.dispatchEvent(new Event('employeesUpdated'))
    } catch (error) {
      showSnackbar('Ошибка загрузки фото', 'error')
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Панель администратора
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Управление телефонным справочником
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreate}
                >
                  Добавить сотрудника
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => setImportOpen(true)}
                >
                  Импорт из файла
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <EmployeeTable 
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPhotoUpload={handlePhotoUpload}
          />
        </Grid>
      </Grid>

      {/* Диалог создания/редактирования сотрудника */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentEmployee ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Отдел"
                value={employeeData.department}
                onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ФИО"
                value={employeeData.full_name}
                onChange={(e) => setEmployeeData({ ...employeeData, full_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Должность"
                value={employeeData.position}
                onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Внутренний номер"
                value={employeeData.internal_phone}
                onChange={(e) => setEmployeeData({ ...employeeData, internal_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Общий номер"
                value={employeeData.common_phone}
                onChange={(e) => setEmployeeData({ ...employeeData, common_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Городской номер"
                value={employeeData.city_phone}
                onChange={(e) => setEmployeeData({ ...employeeData, city_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={employeeData.email}
                onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог импорта */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)}>
        <DialogTitle>Импорт данных</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Поддерживаемые форматы: Excel (.xlsx) и CSV
          </Typography>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setImportFile(e.target.files[0])}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Отмена</Button>
          <Button onClick={handleImport} variant="contained">
            Импортировать
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AdminPanel
