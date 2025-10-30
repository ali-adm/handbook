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
  Avatar,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Pagination,
  FormGroup
} from '@mui/material'
import { Search, Download, Edit, Delete, ArrowUpward, ArrowDownward, DragIndicator } from '@mui/icons-material'
import { getEmployees, getDepartments, exportPDF, exportExcel, reorderEmployees, getStatistics } from '../services/api'
import StatisticsPanel from './StatisticsPanel'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Компонент для сортируемой строки таблицы
const SortableTableRow = ({ employee, onEdit, onDelete, reordering }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: employee.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f0f0f0' : 'inherit',
  }

  const columns = [
    { id: 'department', label: 'Отдел' },
    { id: 'full_name', label: 'ФИО' },
    { id: 'position', label: 'Должность' },
    { id: 'internal_phone', label: 'Внутр. №' },
    { id: 'common_phone', label: 'Общ. №' },
    { id: 'city_phone', label: 'Городской №' },
    { id: 'email', label: 'Email' },
  ]

  if (onEdit || onDelete) {
    columns.push({ id: 'actions', label: 'Действия' })
  }

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      {/* Колонка для перетаскивания */}
      {reordering && onEdit && (
        <TableCell width="60">
          <Tooltip title="Перетащите для изменения порядка">
            <IconButton 
              size="small" 
              {...attributes}
              {...listeners}
              sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <DragIndicator />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
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
      {/* Колонка действий - отображается только в админ-панели */}
      {(onEdit || onDelete) && (
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onEdit && (
              <Tooltip title="Редактировать">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onEdit(employee)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Удалить">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onDelete(employee)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      )}
    </TableRow>
  )
}

const EmployeeTable = ({ onEdit, onDelete, onPhotoUpload }) => {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [orderBy, setOrderBy] = useState('display_order')
  const [order, setOrder] = useState('asc')
  const [loading, setLoading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [statistics, setStatistics] = useState(null)

  // Настройка сенсоров для drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadEmployees()
    loadDepartments()
    loadStatistics()
    
    // Слушаем события обновления
    const handleEmployeesUpdated = () => {
      loadEmployees()
      loadDepartments()
      loadStatistics()
    }
    
    window.addEventListener('employeesUpdated', handleEmployeesUpdated)
    return () => {
      window.removeEventListener('employeesUpdated', handleEmployeesUpdated)
    }
  }, [])

  // Перезагружаем сотрудников при изменении фильтров
  useEffect(() => {
    loadEmployees()
  }, [selectedDepartment])

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

  const loadStatistics = async () => {
    try {
      const response = await getStatistics()
      setStatistics(response.data)
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    }
  }

  const handleDepartmentClick = (department) => {
    setSelectedDepartment(department)
    setPage(1) // Сбрасываем на первую страницу при смене фильтра
  }

  const handleSearch = () => {
    loadEmployees()
  }

  const handleExportPDF = async () => {
    try {
      console.log('Начало экспорта PDF...')
      const response = await exportPDF()
      console.log('PDF получен, размер:', response.data.size)
      
      // Создаем blob из данных
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'phone_directory.pdf')
      document.body.appendChild(link)
      
      // Имитируем клик для скачивания
      link.click()
      
      // Очищаем
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      console.log('PDF успешно скачан')
    } catch (error) {
      console.error('Ошибка экспорта:', error)
      alert('Ошибка при экспорте PDF. Проверьте консоль для подробностей.')
    }
  }

  const handleExportExcel = async () => {
    try {
      console.log('Начало экспорта Excel...')
      const response = await exportExcel()
      console.log('Excel получен, размер:', response.data.size)
      
      // Создаем blob из данных
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'phone_directory.xlsx')
      document.body.appendChild(link)
      
      // Имитируем клик для скачивания
      link.click()
      
      // Очищаем
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      console.log('Excel успешно скачан')
    } catch (error) {
      console.error('Ошибка экспорта Excel:', error)
      alert('Ошибка при экспорте Excel. Проверьте консоль для подробностей.')
    }
  }

  const handleMoveUp = async (employee, index) => {
    if (index === 0) return // Нельзя поднять первую запись
    
    const newEmployees = [...employees]
    const temp = newEmployees[index]
    newEmployees[index] = newEmployees[index - 1]
    newEmployees[index - 1] = temp
    
    // Обновляем порядок в базе данных
    const orderData = newEmployees.map((emp, idx) => ({
      id: emp.id,
      order: idx
    }))
    
    try {
      await reorderEmployees(orderData)
      setEmployees(newEmployees)
    } catch (error) {
      console.error('Ошибка перемещения:', error)
      alert('Ошибка при перемещении записи')
    }
  }

  const handleMoveDown = async (employee, index) => {
    if (index === employees.length - 1) return // Нельзя опустить последнюю запись
    
    const newEmployees = [...employees]
    const temp = newEmployees[index]
    newEmployees[index] = newEmployees[index + 1]
    newEmployees[index + 1] = temp
    
    // Обновляем порядок в базе данных
    const orderData = newEmployees.map((emp, idx) => ({
      id: emp.id,
      order: idx
    }))
    
    try {
      await reorderEmployees(orderData)
      setEmployees(newEmployees)
    } catch (error) {
      console.error('Ошибка перемещения:', error)
      alert('Ошибка при перемещении записи')
    }
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // Обработчик перетаскивания
  const handleDragEnd = async (event) => {
    const { active, over } = event

    console.log('Drag event:', { active: active.id, over: over?.id })

    if (active.id !== over?.id && over) {
      // Находим индексы в полном отсортированном списке
      const oldIndex = sortedEmployees.findIndex((emp) => emp.id === active.id)
      const newIndex = sortedEmployees.findIndex((emp) => emp.id === over.id)

      console.log('Indices:', { oldIndex, newIndex, total: sortedEmployees.length })

      if (oldIndex !== -1 && newIndex !== -1) {
        // Создаем новый массив с измененным порядком
        const newEmployees = arrayMove(sortedEmployees, oldIndex, newIndex)
        
        // Обновляем порядок в базе данных
        const orderData = newEmployees.map((emp, idx) => ({
          id: emp.id,
          order: idx
        }))
        
        console.log('New order data:', orderData)
        
        try {
          console.log('Sending reorder request to server...')
          const response = await reorderEmployees(orderData)
          console.log('Server response:', response.data)
          // Обновляем состояние и принудительно перезагружаем данные
          setEmployees(newEmployees)
          // Принудительно перезагружаем данные с сервера для синхронизации
          setTimeout(() => {
            loadEmployees()
          }, 100)
          setSnackbar({
            open: true,
            message: 'Порядок сотрудников успешно обновлен',
            severity: 'success'
          })
        } catch (error) {
          console.error('Ошибка перемещения:', error)
          console.error('Error details:', error.response?.data || error.message)
          setSnackbar({
            open: true,
            message: `Ошибка при перемещении записи: ${error.response?.data?.error || error.message}`,
            severity: 'error'
          })
        }
      } else {
        console.log('Invalid indices - cannot move')
      }
    } else {
      console.log('No valid drop target or same element')
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Обработчики пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(1)
  }

  // Вычисление данных для текущей страницы
  const startIndex = (page - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage

  const sortedEmployees = [...employees].sort((a, b) => {
    // Если включено перетаскивание, используем display_order
    if (reordering) {
      return (a.display_order || 0) - (b.display_order || 0)
    }
    
    const aValue = a[orderBy] || ''
    const bValue = b[orderBy] || ''
    
    // Для числовых полей используем числовое сравнение
    if (orderBy === 'display_order' || orderBy === 'id') {
      return order === 'asc' ? (aValue - bValue) : (bValue - aValue)
    }
    
    // Для строковых полей используем localeCompare
    if (order === 'asc') {
      return String(aValue).localeCompare(String(bValue))
    } else {
      return String(bValue).localeCompare(String(aValue))
    }
  })

  // Пагинированные данные для отображения
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex)

  const columns = [
    { id: 'department', label: 'Отдел' },
    { id: 'full_name', label: 'ФИО' },
    { id: 'position', label: 'Должность' },
    { id: 'internal_phone', label: 'Внутр. №' },
    { id: 'common_phone', label: 'Общ. №' },
    { id: 'city_phone', label: 'Городской №' },
    { id: 'email', label: 'Email' },
  ]

  // Добавляем колонку действий только если переданы соответствующие пропсы
  if (onEdit || onDelete) {
    columns.push({ id: 'actions', label: 'Действия' })
  }

  return (
    <Box>
      {/* Панель статистики */}
      <StatisticsPanel 
        statistics={statistics}
        onDepartmentClick={handleDepartmentClick}
        selectedDepartment={selectedDepartment}
      />
      
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

        {/* Экспорт Excel только для админа */}
        {onEdit && (
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportExcel}
            color="success"
          >
            Экспорт Excel
          </Button>
        )}

        {/* Переключатель режима перетаскивания */}
        {onEdit && (
          <FormControlLabel
            control={
              <Switch
                checked={reordering}
                onChange={(e) => setReordering(e.target.checked)}
                color="primary"
              />
            }
            label="Режим перетаскивания"
          />
        )}

        <Typography variant="body2" color="text.secondary">
          Найдено: {employees.length} сотрудников
        </Typography>
      </Box>

      {reordering && onEdit ? (
        // Режим с drag & drop
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="таблица сотрудников">
              <TableHead>
                <TableRow>
                  {/* Колонка для перетаскивания */}
                  <TableCell width="60">Перетаскивание</TableCell>
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
                <SortableContext items={sortedEmployees.map(emp => emp.id)} strategy={verticalListSortingStrategy}>
                  {paginatedEmployees.map((employee) => (
                    <SortableTableRow
                      key={employee.id}
                      employee={employee}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      reordering={reordering}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </TableContainer>
        </DndContext>
      ) : (
        // Обычный режим (без перетаскивания)
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="таблица сотрудников">
            <TableHead>
              <TableRow>
                {/* Колонка для кнопок перемещения */}
                {reordering && onEdit && (
                  <TableCell width="80">Перемещение</TableCell>
                )}
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
              {paginatedEmployees.map((employee, index) => (
                <TableRow key={employee.id} hover>
                  {/* Кнопки перемещения */}
                  {reordering && onEdit && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Переместить вверх">
                          <span>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleMoveUp(employee, startIndex + index)}
                              disabled={startIndex + index === 0}
                            >
                              <ArrowUpward />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Переместить вниз">
                          <span>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleMoveDown(employee, startIndex + index)}
                              disabled={startIndex + index === employees.length - 1}
                            >
                              <ArrowDownward />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
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
                  {/* Колонка действий - отображается только в админ-панели */}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onEdit && (
                          <Tooltip title="Редактировать">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => onEdit(employee)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Удалить">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => onDelete(employee)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {employees.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Сотрудники не найдены
          </Typography>
        </Box>
      )}

      {/* Пагинация */}
      {employees.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Записей на странице:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Показано {Math.min((page - 1) * rowsPerPage + 1, employees.length)}-
              {Math.min(page * rowsPerPage, employees.length)} из {employees.length} записей
            </Typography>
          </Box>
          
          <Pagination
            count={Math.ceil(employees.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default EmployeeTable
