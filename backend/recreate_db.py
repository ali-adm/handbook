from app import app, db

with app.app_context():
    print("Удаляем существующие таблицы...")
    db.drop_all()
    print("Создаем новые таблицы...")
    db.create_all()
    print("База данных пересоздана успешно!")
