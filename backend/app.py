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
    
    employees = query.all()
    
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
                internal_phone=clean_phone_number(row.get('№ вн.', row.get('№ вн', row.get('внутр. №', '')))),
                common_phone=clean_phone_number(row.get('общ. №', '')),
                city_phone=clean_phone_number(row.get('городской №', '')),
                email=row.get('email', '')
            )
            db.session.add(employee)
            imported_count += 1
        
        db.session.commit()
        return jsonify({'message': f'Импортировано {imported_count} записей'})
    
    except Exception as e:
        return jsonify({'error': f'Ошибка импорта: {str(e)}'}), 500

# Экспорт в PDF
@app.route('/api/export/pdf', methods=['GET'])
def export_pdf():
    try:
        print("Начало экспорта PDF...")
        
        # Проверяем доступность reportlab
        try:
            from reportlab.lib.pagesizes import A4
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
        # Используем книжную ориентацию
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
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
        
        # Настраиваем ширину колонок для книжной ориентации
        col_widths = [80, 120, 100, 50, 60, 60, 100]  # Ширина колонок в пунктах
        
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
