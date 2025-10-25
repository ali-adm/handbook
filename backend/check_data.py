import sys
import os
sys.path.append('.')

from app import db, Employee, app

with app.app_context():
    employees = Employee.query.all()
    print(f'Всего сотрудников: {len(employees)}')
    print('Первые 5 сотрудников:')
    for emp in employees[:5]:
        print(f'ID: {emp.id}, ФИО: {emp.full_name}, Внутр. №: {emp.internal_phone}, Общ. №: {emp.common_phone}, Городской №: {emp.city_phone}')
    
    # Проверим, есть ли сотрудники с заполненными внутренними номерами
    employees_with_internal = Employee.query.filter(Employee.internal_phone != None).filter(Employee.internal_phone != '').all()
    print(f'\nСотрудников с заполненными внутренними номерами: {len(employees_with_internal)}')
    
    if employees_with_internal:
        print('Примеры сотрудников с внутренними номерами:')
        for emp in employees_with_internal[:3]:
            print(f'ФИО: {emp.full_name}, Внутр. №: {emp.internal_phone}')
