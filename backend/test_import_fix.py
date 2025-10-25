import sys
sys.path.append('.')
from app import app, Employee, db
import pandas as pd
import io

def test_import_with_different_column_names():
    """Тест импорта с разными названиями колонок для внутреннего номера"""
    
    with app.app_context():
        # Очищаем базу для теста
        Employee.query.delete()
        db.session.commit()
        
        # Тестовые данные с разными названиями колонок
        test_data_1 = {
            'Отдел': ['IT', 'HR'],
            'ФИО': ['Тестовый 1', 'Тестовый 2'],
            'Должность': ['Разработчик', 'Менеджер'],
            '№ вн.': [200, 201],
            'общ. №': ['+996555111222', '+996555111223'],
            'городской №': ['312345', '312346'],
            'email': ['test1@example.com', 'test2@example.com']
        }
        
        test_data_2 = {
            'Отдел': ['Finance', 'Marketing'],
            'ФИО': ['Тестовый 3', 'Тестовый 4'],
            'Должность': ['Бухгалтер', 'Маркетолог'],
            'внутр. №': [300, 301],
            'общ. №': ['+996555111224', '+996555111225'],
            'городской №': ['312347', '312348'],
            'email': ['test3@example.com', 'test4@example.com']
        }
        
        df1 = pd.DataFrame(test_data_1)
        df2 = pd.DataFrame(test_data_2)
        
        print("Тест 1: Импорт с колонкой '№ вн.'")
        for _, row in df1.iterrows():
            employee = Employee(
                department=row['Отдел'],
                full_name=row['ФИО'],
                position=row['Должность'],
                internal_phone=str(row['№ вн.']).replace('.0', ''),
                common_phone=row['общ. №'],
                city_phone=row['городской №'],
                email=row['email']
            )
            db.session.add(employee)
        
        db.session.commit()
        
        print("Тест 2: Импорт с колонкой 'внутр. №'")
        for _, row in df2.iterrows():
            employee = Employee(
                department=row['Отдел'],
                full_name=row['ФИО'],
                position=row['Должность'],
                internal_phone=str(row['внутр. №']).replace('.0', ''),
                common_phone=row['общ. №'],
                city_phone=row['городской №'],
                email=row['email']
            )
            db.session.add(employee)
        
        db.session.commit()
        
        # Проверяем результат
        employees = Employee.query.all()
        print(f"\nВсего сотрудников после импорта: {len(employees)}")
        
        for emp in employees:
            print(f"Сотрудник: {emp.full_name}, Отдел: {emp.department}, Внутр. №: {emp.internal_phone}")
        
        print("\n✅ Тест импорта завершен успешно!")

if __name__ == '__main__':
    test_import_with_different_column_names()
