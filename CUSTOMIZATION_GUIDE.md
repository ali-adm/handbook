# Гайд по кастомизации интерфейса телефонной книги

## Изменение названия и иконки

### 1. Изменение названия "Телефонная книга"

**Файл для редактирования:** `frontend/src/App.jsx`

**Найдите строку:**
```jsx
<Typography variant="h4" component="h1" gutterBottom>
  Телефонная книга
</Typography>
```

**Замените на нужное название:**
```jsx
<Typography variant="h4" component="h1" gutterBottom>
  Ваше новое название
</Typography>
```

### 2. Изменение иконки трубки

**Файл для редактирования:** `frontend/src/App.jsx`

**Найдите строку:**
```jsx
<Phone fontSize="large" sx={{ mr: 2 }} />
```

**Замените на другую иконку из Material-UI Icons:**

```jsx
// Примеры других иконок:
<Contacts fontSize="large" sx={{ mr: 2 }} />          // Контакты
<People fontSize="large" sx={{ mr: 2 }} />            // Люди
<Business fontSize="large" sx={{ mr: 2 }} />          // Бизнес
<ContactPhone fontSize="large" sx={{ mr: 2 }} />      // Телефон контакта
<ListAlt fontSize="large" sx={{ mr: 2 }} />           // Список
```

**Добавьте импорт новой иконки в начало файла:**
```jsx
import { Contacts, People, Business, ContactPhone, ListAlt } from '@mui/icons-material';
```

## Изменение цветовой схемы

### Основные цвета

**Файл для редактирования:** `frontend/src/App.jsx`

**Найдите создание темы:**
```jsx
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#2E86AB',  // Основной синий цвет
    },
    secondary: {
      main: '#A23B72',  // Вторичный розовый цвет
    },
  },
});
```

**Измените цвета:**
```jsx
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#1976d2',  // Стандартный синий Material-UI
    },
    secondary: {
      main: '#dc004e',  // Стандартный розовый Material-UI
    },
  },
});
```

### Дополнительные варианты цветов:

```jsx
// Корпоративный синий
primary: { main: '#1565c0' }

// Зеленый
primary: { main: '#2e7d32' }

// Фиолетовый
primary: { main: '#7b1fa2' }

// Оранжевый
primary: { main: '#f57c00' }
```

## Изменение логотипа

### Добавление собственного логотипа

1. **Поместите файл логотипа** в папку `frontend/public/`
2. **Измените App.jsx:**

```jsx
// Вместо иконки используйте изображение
<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  <img 
    src="/your-logo.png" 
    alt="Логотип" 
    style={{ width: 40, height: 40, marginRight: 16 }}
  />
  <Typography variant="h4" component="h1">
    Ваше название
  </Typography>
</Box>
```

## Изменение шрифтов

**Добавьте настройки шрифта в тему:**

```jsx
const theme = createTheme({
  palette: {
    // ... цвета
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
  },
});
```

## Изменение макета таблицы

### Настройка колонок таблицы

**Файл:** `frontend/src/components/EmployeeTable.jsx`

**Найдите массив columns:**
```jsx
const columns = [
  { id: 'department', label: 'Отдел' },
  { id: 'full_name', label: 'ФИО' },
  { id: 'position', label: 'Должность' },
  { id: 'internal_phone', label: 'Внутр. №' },
  { id: 'common_phone', label: 'Общ. №' },
  { id: 'city_phone', label: 'Городской №' },
  { id: 'email', label: 'Email' },
]
```

**Измените названия колонок:**
```jsx
const columns = [
  { id: 'department', label: 'Подразделение' },
  { id: 'full_name', label: 'Сотрудник' },
  { id: 'position', label: 'Должность' },
  { id: 'internal_phone', label: 'Внутренний номер' },
  { id: 'common_phone', label: 'Общий номер' },
  { id: 'city_phone', label: 'Городской телефон' },
  { id: 'email', label: 'Электронная почта' },
]
```

### Скрытие колонок

**Удалите ненужные колонки из массива:**
```jsx
const columns = [
  { id: 'department', label: 'Отдел' },
  { id: 'full_name', label: 'ФИО' },
  { id: 'position', label: 'Должность' },
  { id: 'internal_phone', label: 'Внутр. №' },
  // Убраны common_phone, city_phone, email
]
```

## Изменение панели поиска

### Добавление дополнительных фильтров

**В файле `EmployeeTable.jsx` можно добавить новые поля фильтрации:**

```jsx
// Добавьте состояние для нового фильтра
const [positionFilter, setPositionFilter] = useState('')

// Добавьте поле ввода
<TextField
  label="Должность"
  variant="outlined"
  size="small"
  value={positionFilter}
  onChange={(e) => setPositionFilter(e.target.value)}
  sx={{ minWidth: 200 }}
/>

// Обновите функцию loadEmployees
const loadEmployees = async () => {
  setLoading(true)
  try {
    const params = {}
    if (searchTerm) params.search = searchTerm
    if (selectedDepartment) params.department = selectedDepartment
    if (positionFilter) params.position = positionFilter  // Новый фильтр
    
    const response = await getEmployees(params)
    setEmployees(response.data)
  } catch (error) {
    console.error('Ошибка загрузки сотрудников:', error)
  } finally {
    setLoading(false)
  }
}
```

## Изменение стилей компонентов

### Кастомизация Material-UI компонентов

**Используйте sx проп для стилизации:**

```jsx
<Paper 
  sx={{ 
    p: 3, 
    borderRadius: 2,
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
    background: 'linear-gradient(145deg, #ffffff, #f5f5f5)'
  }}
>
  {/* содержимое */}
</Paper>
```

### Темная тема

**Темная тема уже реализована.** Для кастомизации темной темы:

```jsx
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',  // Светло-синий для темной темы
    },
    secondary: {
      main: '#f48fb1',  // Светло-розовый для темной темы
    },
    background: {
      default: '#0a1929',  // Темный фон
      paper: '#132f4c',    // Темная бумага
    },
  },
});
```

## Дополнительные возможности кастомизации

### 1. Добавление фавикона
Замените файл `frontend/public/favicon.ico` на ваш собственный.

### 2. Изменение заголовка страницы
**Файл:** `frontend/index.html`
```html
<title>Ваше новое название</title>
```

### 3. Добавление кастомных CSS
Создайте файл `frontend/src/custom.css` и импортируйте его в `App.jsx`:
```jsx
import './custom.css';
```

## Советы по кастомизации

1. **Сохраняйте консистентность** - используйте единую цветовую схему
2. **Тестируйте на разных устройствах** - убедитесь, что интерфейс адаптивен
3. **Сохраняйте читаемость** - не делайте текст слишком мелким
4. **Используйте семантические названия** - понятные пользователю
5. **Сделайте backup** перед внесением значительных изменений

## После изменений не забудьте перезапустить приложение:

```bash
cd frontend
npm run dev
```

Или пересобрать Docker образы:
```bash
docker compose down
docker compose up --build
