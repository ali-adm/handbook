import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import { People, Groups } from '@mui/icons-material'

const StatisticsPanel = ({ statistics, onDepartmentClick, selectedDepartment }) => {
  if (!statistics) return null

  const { total_employees, department_counts } = statistics

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <People color="primary" />
        Статистика сотрудников
      </Typography>
      
      <Grid container spacing={3}>
        {/* Общая статистика */}
        <Grid item xs={12} md={4}>
          <Card 
            variant="outlined" 
            sx={{ 
              height: '100%',
              borderColor: 'primary.main',
              backgroundColor: 'background.default'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {total_employees}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Всего сотрудников
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Статистика по отделам */}
        <Grid item xs={12} md={8}>
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Groups color="secondary" />
              Сотрудники по отделам
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {Object.entries(department_counts).map(([department, count]) => (
                <Chip
                  key={department}
                  label={`${department}: ${count}`}
                  variant={selectedDepartment === department ? "filled" : "outlined"}
                  color={selectedDepartment === department ? "primary" : "default"}
                  onClick={() => onDepartmentClick(department)}
                  clickable
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: selectedDepartment === department ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: selectedDepartment === department ? 'primary.main' : 'action.hover',
                    }
                  }}
                />
              ))}
            </Box>

            {selectedDepartment && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Активный фильтр: <strong>{selectedDepartment}</strong>
                  {' '}
                  <Chip 
                    label="Сбросить" 
                    size="small" 
                    variant="outlined" 
                    onClick={() => onDepartmentClick('')}
                    clickable
                  />
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default StatisticsPanel
