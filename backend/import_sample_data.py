import sys
sys.path.append('.')
from app import app, db, Employee
import pandas as pd

with app.app_context():
    # Читаем CSV файл
    df = pd.read_csv('../sample_data.csv')
    
    # Очищаем существующие данные
    Employee.query.delete()
    
    # Импортируем данные
    imported_count = 0
    for _, row in df.iterrows():
        # Обрабатываем номера телефонов - убираем .0 и преобразуем в строки
        def clean_phone_number(value):
            if pd.isna(value):
                return ''
            # Преобразуем в строку и убираем .0
            phone_str = str(value)
            if phone_str.endswith('.0'):
                phone_str = phone_str[:-2]
            return phone_str.strip()
        
        employee = Employee(
            department=row.get('Отдел', ''),
            full_name=row.get('ФИО', ''),
            position=row.get('Должность', ''),
            internal_phone=clean_phone_number(row.get('№ вн.', '')),
            common_phone=clean_phone_number(row.get('общ. №', '')),
            city_phone=clean_phone_number(row.get('городской №', '')),
            email=row.get('email', '')
        )
        db.session.add(employee)
        imported_count += 1
    
    db.session.commit()
    print(f'Импортировано {imported_count} записей')
