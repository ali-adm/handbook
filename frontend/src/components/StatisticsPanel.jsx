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
    <Paper 
      sx={{ 
        p: 2, 
        mb: 3, 
        backgroundColor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 120
      }}
    >
      {/* Логотип на фоне */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: 0.03,
          backgroundImage: 'url(/logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          pointerEvents: 'none'
        }}
      />
      
      <Grid container spacing={2} alignItems="center">
        {/* Общая статистика - компактная версия */}
        <Grid item xs={12} sm={3}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderColor: 'primary.main',
              backgroundColor: 'background.default',
              textAlign: 'center',
              py: 1
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h5" color="primary" gutterBottom>
                {total_employees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего сотрудников
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Статистика по отделам - компактная версия */}
        <Grid item xs={12} sm={9}>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Groups color="secondary" fontSize="small" />
              Сотрудники по отделам:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(department_counts).map(([department, count]) => (
                <Chip
                  key={department}
                  label={`${department}: ${count}`}
                  size="small"
                  variant={selectedDepartment === department ? "filled" : "outlined"}
                  color={selectedDepartment === department ? "primary" : "default"}
                  onClick={() => onDepartmentClick(department)}
                  clickable
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: selectedDepartment === department ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: selectedDepartment === department ? 'primary.main' : 'action.hover',
                    }
                  }}
                />
              ))}
            </Box>

            {selectedDepartment && (
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
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
