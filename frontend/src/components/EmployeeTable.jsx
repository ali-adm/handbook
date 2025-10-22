import React, { useState, useEffect } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  Chip,
  Avatar
} from '@mui/material'
import { Search, Download } from '@mui/icons-material'
import { getEmployees, getDepartments, exportPDF } from '../services/api'

const EmployeeTable = ({ onEdit, onDelete, onPhotoUpload }) => {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [orderBy, setOrderBy] = useState('full_name')
  const [order, setOrder] = useState('asc')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEmployees()
    loadDepartments()
    
    // Слушаем события обновления
    const handleEmployeesUpdated = () => {
      loadEmployees()
      loadDepartments()
    }
    
    window.addEventListener('employeesUpdated', handleEmployeesUpdated)
    return () => {
      window.removeEventListener('employeesUpdated', handleEmployeesUpdated)
    }
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (selectedDepartment) params.department = selectedDepartment
      
      const response = await getEmployees(params)
      setEmployees(response.data)
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await getDepartments()
      setDepartments(response.data)
    } catch (error) {
      console.error('Ошибка загрузки отделов:', error)
    }
  }

  const handleSearch = () => {
    loadEmployees()
  }

  const handleExportPDF = async () => {
    try {
      const response = await exportPDF()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'phone_directory.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Ошибка экспорта:', error)
    }
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    if (order === 'asc') {
      return a[orderBy]?.localeCompare(b[orderBy]) || 0
    } else {
      return b[orderBy]?.localeCompare(a[orderBy]) || 0
    }
  })

  const columns = [
    { id: 'department', label: 'Отдел' },
    { id: 'full_name', label: 'ФИО' },
    { id: 'position', label: 'Должность' },
    { id: 'internal_phone', label: 'Внутр. №' },
    { id: 'common_phone', label: 'Общ. №' },
    { id: 'city_phone', label: 'Городской №' },
    { id: 'email', label: 'Email' },
  ]

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Поиск..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: 200 }}
          InputProps={{
            endAdornment: <Search />
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Отдел</InputLabel>
          <Select
            value={selectedDepartment}
            label="Отдел"
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value="">Все отделы</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          Поиск
        </Button>

        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExportPDF}
        >
          Экспорт PDF
        </Button>

        <Typography variant="body2" color="text.secondary">
          Найдено: {employees.length} сотрудников
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="таблица сотрудников">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEmployees.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell>
                  <Chip 
                    label={employee.department} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {employee.photo && (
                      <Avatar 
                        src={`/api/uploads/photos/${employee.photo}`} 
                        sx={{ width: 32, height: 32 }}
                      />
                    )}
                    {employee.full_name}
                  </Box>
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.internal_phone}</TableCell>
                <TableCell>{employee.common_phone}</TableCell>
                <TableCell>{employee.city_phone}</TableCell>
                <TableCell>
                  {employee.email && (
                    <a href={`mailto:${employee.email}`} style={{ color: 'inherit' }}>
                      {employee.email}
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {employees.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Сотрудники не найдены
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default EmployeeTable
