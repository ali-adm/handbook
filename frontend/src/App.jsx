import React, { useState, useEffect } from 'react'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material'
import EmployeeTable from './components/EmployeeTable'
import AdminPanel from './components/AdminPanel'
import { checkAuth, login } from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await checkAuth()
      setIsAuthenticated(response.data.authenticated)
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error)
    }
  }

  const handleLogin = async () => {
    try {
      setError('')
      const response = await login(loginData)
      if (response.data.message === 'Успешный вход') {
        setIsAuthenticated(true)
        setLoginOpen(false)
        setLoginData({ username: '', password: '' })
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка входа')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📞 Телефонный справочник
          </Typography>
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          ) : (
            <Button color="inherit" onClick={() => setLoginOpen(true)}>
              Войти
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {isAuthenticated ? (
          <AdminPanel />
        ) : (
          <EmployeeTable />
        )}
      </Container>

      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)}>
        <DialogTitle>Вход в админ-панель</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Имя пользователя"
            type="text"
            fullWidth
            variant="outlined"
            value={loginData.username}
            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Пароль"
            type="password"
            fullWidth
            variant="outlined"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginOpen(false)}>Отмена</Button>
          <Button onClick={handleLogin}>Войти</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App
