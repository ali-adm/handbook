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
  Alert,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import EmployeeTable from './components/EmployeeTable'
import AdminPanel from './components/AdminPanel'
import { checkAuth, login } from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  // Создаем тему
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2E86AB',
      },
      secondary: {
        main: '#A23B72',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  })

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <img 
                src="/logo.png" 
                alt="Логотип АКБ Толубай" 
                style={{ 
                  width: 60, 
                  height: 60, 
                  marginRight: 16,
                  borderRadius: 4
                }}
              />
              <Typography variant="h6" component="div">
                Телефонный справочник АКБ "Толубай"
              </Typography>
            </Box>
            
            {/* Кнопка переключения темы */}
            <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 2 }}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            
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
    </ThemeProvider>
  )
}

export default App
