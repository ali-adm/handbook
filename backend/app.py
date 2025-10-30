from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///handbook.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOADED_PHOTOS_DEST'] = 'uploads/photos'

# Инициализация расширений
db = SQLAlchemy(app)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Настройка загрузки файлов
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = 'uploads/photos'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Модель пользователя (администратора)
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Модель сотрудника
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    department = db.Column(db.String(100), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    position = db.Column(db.String(200), nullable=False)
    internal_phone = db.Column(db.String(20))
    common_phone = db.Column(db.String(20))
    city_phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    photo = db.Column(db.String(255))
    display_order = db.Column(db.Integer, default=0)  # Поле для порядка отображения
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Создание таблиц и администратора по умолчанию - ПЕРЕД запуском приложения
with app.app_context():
    db.create_all()
    # Создание администратора по умолчанию
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

# API endpoints

# Аутентификация
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and user.check_password(data.get('password')):
        login_user(user)
        return jsonify({'message': 'Успешный вход', 'user': {'username': user.username}})
    
    return jsonify({'error': 'Неверные учетные данные'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Успешный выход'})

# Смена пароля администратора
@app.route('/api/change_password', methods=['POST'])
@login_required
def change_password():
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Текущий и новый пароль обязательны'}), 400
        
        # Проверяем текущий пароль
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Неверный текущий пароль'}), 400
        
        # Устанавливаем новый пароль
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Пароль успешно изменен'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка смены пароля: {str(e)}'}), 500

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    return jsonify({'authenticated': current_user.is_authenticated})

# CRUD для сотрудников
@app.route('/api/employees', methods=['GET'])
def get_employees():
    search = request.args.get('search', '')
    department = request.args.get('department', '')
    
    query = Employee.query
    
    if search:
        query = query.filter(
            Employee.full_name.ilike(f'%{search}%') |
            Employee.department.ilike(f'%{search}%') |
            Employee.internal_phone.ilike(f'%{search}%') |
            Employee.position.ilike(f'%{search}%') |
            Employee.common_phone.ilike(f'%{search}%') |
            Employee.city_phone.ilike(f'%{search}%') |
            Employee.email.ilike(f'%{search}%')
        )
    
    if department:
        query = query.filter(Employee.department == department)
    
    # Сортируем по display_order, затем по id
    employees = query.order_by(Employee.display_order, Employee.id).all()
    
    result = []
    for emp in employees:
        result.append({
            'id': emp.id,
            'department': emp.department,
            'full_name': emp.full_name,
            'position': emp.position,
            'internal_phone': emp.internal_phone,
            'common_phone': emp.common_phone,
            'city_phone': emp.city_phone,
            'email': emp.email,
            'photo': emp.photo,
            'display_order': emp.display_order,
            'created_at': emp.created_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/employees', methods=['POST'])
@login_required
def create_employee():
    data = request.get_json()
    
    employee = Employee(
        department=data['department'],
        full_name=data['full_name'],
        position=data['position'],
        internal_phone=data.get('internal_phone'),
        common_phone=data.get('common_phone'),
        city_phone=data.get('city_phone'),
        email=data.get('email')
    )
    
    db.session.add(employee)
    db.session.commit()
    
    return jsonify({'message': 'Сотрудник создан', 'id': employee.id}), 201

@app.route('/api/employees/<int:id>', methods=['PUT'])
@login_required
def update_employee(id):
    employee = Employee.query.get_or_404(id)
    data = request.get_json()
    
    employee.department = data.get('department', employee.department)
    employee.full_name = data.get('full_name', employee.full_name)
    employee.position = data.get('position', employee.position)
    employee.internal_phone = data.get('internal_phone', employee.internal_phone)
    employee.common_phone = data.get('common_phone', employee.common_phone)
    employee.city_phone = data.get('city_phone', employee.city_phone)
    employee.email = data.get('email', employee.email)
    employee.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Сотрудник обновлен'})

@app.route('/api/employees/<int:id>', methods=['DELETE'])
@login_required
def delete_employee(id):
    employee = Employee.query.get_or_404(id)
    db.session.delete(employee)
    db.session.commit()
    
    return jsonify({'message': 'Сотрудник удален'})

# Очистка всей базы данных сотрудников
@app.route('/api/employees/clear', methods=['DELETE'])
@login_required
def clear_database():
    try:
        # Удаляем всех сотрудников
        num_deleted = Employee.query.delete()
        db.session.commit()
        
        return jsonify({'message': f'База данных очищена. Удалено {num_deleted} записей'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка очистки базы: {str(e)}'}), 500

# Обновление порядка сотрудников
@app.route('/api/employees/reorder', methods=['POST'])
@login_required
def reorder_employees():
    try:
        data = request.get_json()
        print(f"Received reorder data: {data}")
        
        # Обрабатываем как массив напрямую (без ключа 'order')
        order_data = data if isinstance(data, list) else data.get('order', [])
        
        print(f"Processing {len(order_data)} employees")
        
        for item in order_data:
            employee = Employee.query.get(item['id'])
            if employee:
                print(f"Updating employee {employee.id} ({employee.full_name}) to order {item['order']}")
                employee.display_order = item['order']
            else:
                print(f"Employee with id {item['id']} not found")
        
        db.session.commit()
        print("Order updated successfully")
        return jsonify({'message': 'Порядок сотрудников обновлен'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error updating order: {str(e)}")
        return jsonify({'error': f'Ошибка обновления порядка: {str(e)}'}), 500

# Загрузка фото
@app.route('/api/upload_photo/<int:employee_id>', methods=['POST'])
@login_required
def upload_photo(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    
    if 'photo' not in request.files:
        return jsonify({'error': 'Файл не найден'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'Файл не выбран'}), 400
    
    if file and allowed_file(file.filename):
        # Создаем папку для загрузок, если её нет
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        employee.photo = filename
        db.session.commit()
        
        return jsonify({'message': 'Фото загружено', 'filename': filename})
    
    return jsonify({'error': 'Неподдерживаемый формат файла'}), 400

# Получение списка отделов
@app.route('/api/departments', methods=['GET'])
def get_departments():
    departments = db.session.query(Employee.department).distinct().all()
    return jsonify([dept[0] for dept in departments if dept[0]])

# Получение статистики сотрудников
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    try:
        # Общее количество сотрудников
        total_employees = Employee.query.count()
        
        # Количество сотрудников по отделам
        department_stats = db.session.query(
            Employee.department,
            db.func.count(Employee.id)
        ).group_by(Employee.department).all()
        
        # Преобразуем в словарь
        department_counts = {dept: count for dept, count in department_stats if dept}
        
        return jsonify({
            'total_employees': total_employees,
            'department_counts': department_counts
        })
    
    except Exception as e:
        return jsonify({'error': f'Ошибка получения статистики: {str(e)}'}), 500

# Импорт из Excel/CSV
@app.route('/api/import', methods=['POST'])
@login_required
def import_data():
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не найден'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Файл не выбран'}), 400
    
    try:
        import pandas as pd
        
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Неподдерживаемый формат файла'}), 400
        
        # Получаем текущее максимальное значение display_order
        max_order = db.session.query(db.func.max(Employee.display_order)).scalar() or 0
        
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
            
            # Поддержка разных названий колонок для совместимости с экспортированными файлами
            internal_phone = clean_phone_number(
                row.get('№ вн.', 
                row.get('№ вн', 
                row.get('внутр. №', 
                row.get('Внутренний номер', ''))))
            )
            
            common_phone = clean_phone_number(
                row.get('общ. №', 
                row.get('Общий номер', ''))
            )
            
            city_phone = clean_phone_number(
                row.get('городской №', 
                row.get('Городской номер', ''))
            )
            
            employee = Employee(
                department=row.get('Отдел', ''),
                full_name=row.get('ФИО', ''),
                position=row.get('Должность', ''),
                internal_phone=internal_phone,
                common_phone=common_phone,
                city_phone=city_phone,
                email=row.get('email', ''),
                display_order=max_order + imported_count + 1  # Автоматически устанавливаем порядок
            )
            db.session.add(employee)
            imported_count += 1
        
        db.session.commit()
        return jsonify({'message': f'Импортировано {imported_count} записей'})
    
    except Exception as e:
        return jsonify({'error': f'Ошибка импорта: {str(e)}'}), 500

# Экспорт в Excel
@app.route('/api/export/excel', methods=['GET'])
def export_excel():
    try:
        import pandas as pd
        import io
        
        employees = Employee.query.all()
        
        # Создаем DataFrame
        data = []
        for emp in employees:
            data.append({
                'Отдел': emp.department or '',
                'ФИО': emp.full_name or '',
                'Должность': emp.position or '',
                'Внутренний номер': str(emp.internal_phone).replace('.0', '') if emp.internal_phone else '',
                'Общий номер': str(emp.common_phone).replace('.0', '') if emp.common_phone else '',
                'Городской номер': str(emp.city_phone).replace('.0', '') if emp.city_phone else '',
                'Email': emp.email or ''
            })
        
        df = pd.DataFrame(data)
        
        # Создаем Excel файл в памяти
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Сотрудники', index=False)
            
            # Настраиваем ширину колонок
            worksheet = writer.sheets['Сотрудники']
            worksheet.column_dimensions['A'].width = 20  # Отдел
            worksheet.column_dimensions['B'].width = 30  # ФИО
            worksheet.column_dimensions['C'].width = 25  # Должность
            worksheet.column_dimensions['D'].width = 15  # Внутренний номер
            worksheet.column_dimensions['E'].width = 15  # Общий номер
            worksheet.column_dimensions['F'].width = 15  # Городской номер
            worksheet.column_dimensions['G'].width = 25  # Email
        
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='phone_directory.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        return jsonify({'error': f'Ошибка экспорта в Excel: {str(e)}'}), 500

# Экспорт в PDF
@app.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    try:
        print("Начало экспорта PDF...")
        
        # Проверяем доступность reportlab
        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
            from reportlab.lib import colors
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            print("ReportLab импортирован успешно")
        except ImportError as e:
            print(f"Ошибка импорта ReportLab: {e}")
            return jsonify({'error': f'ReportLab не установлен: {str(e)}'}), 500
        
        import io
        
        employees = Employee.query.all()
        print(f"Найдено сотрудников для экспорта: {len(employees)}")
        
        buffer = io.BytesIO()
        # Используем альбомную ориентацию для лучшего отображения таблицы
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=30, bottomMargin=30)
        elements = []
        
        # Регистрируем шрифт для поддержки кириллицы
        try:
            # Пробуем использовать стандартные шрифты, поддерживающие кириллицу
            pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
            font_name = 'DejaVuSans'
        except:
            # Если шрифт не найден, используем стандартный
            font_name = 'Helvetica'
            print("Используем стандартный шрифт Helvetica")
        
        # Подготовка данных таблицы
        data = [['Отдел', 'ФИО', 'Должность', 'Внутр. №', 'Общ. №', 'Городской №', 'Email']]
        
        for emp in employees:
            # Преобразуем номера телефонов в строки и убираем лишние символы
            internal_phone = str(emp.internal_phone) if emp.internal_phone else ''
            common_phone = str(emp.common_phone) if emp.common_phone else ''
            city_phone = str(emp.city_phone) if emp.city_phone else ''
            
            # Убираем точки и лишние символы из номеров
            internal_phone = internal_phone.replace('.0', '').strip()
            common_phone = common_phone.replace('.0', '').strip()
            city_phone = city_phone.replace('.0', '').strip()
            
            data.append([
                emp.department or '',
                emp.full_name or '',
                emp.position or '',
                internal_phone,
                common_phone,
                city_phone,
                emp.email or ''
            ])
        
        print("Данные подготовлены для таблицы")
        
        # Создаем таблицу с оптимизированными размерами колонок
        table = Table(data, repeatRows=1)
        
        # Настраиваем стиль таблицы
        table_style = TableStyle([
            # Заголовок таблицы
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Чередование цветов строк для лучшей читаемости
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
            
            # Стиль данных
            ('FONTNAME', (0, 1), (-1, -1), font_name),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Границы
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.white),
            
            # Отступы
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ])
        
        # Настраиваем ширину колонок для альбомной ориентации
        col_widths = [110, 180, 130, 50, 55, 65, 150]  # Оптимизированные ширины колонок
        
        table._argW = col_widths
        table.setStyle(table_style)
        
        elements.append(table)
        
        print("Строим PDF документ...")
        doc.build(elements)
        
        buffer.seek(0)
        print("PDF успешно создан, отправляем файл...")
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='phone_directory.pdf',
            mimetype='application/pdf'
        )
    
    except Exception as e:
        print(f"Критическая ошибка при экспорте PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Ошибка экспорта: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
