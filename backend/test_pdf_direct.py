import sys
sys.path.append('.')
from app import app, Employee, db

def test_pdf_export_direct():
    """Тест экспорта PDF напрямую через код"""
    
    with app.app_context():
        try:
            print("Тестирование экспорта PDF напрямую...")
            
            # Получаем всех сотрудников
            employees = Employee.query.all()
            print(f"Найдено сотрудников: {len(employees)}")
            
            # Проверяем, что есть данные для экспорта
            if len(employees) == 0:
                print("❌ Нет данных для экспорта")
                return
            
            # Импортируем необходимые библиотеки
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
            from reportlab.lib import colors
            import io
            
            # Создаем PDF в памяти
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=30, bottomMargin=30)
            elements = []
            
            # Подготовка данных таблицы
            data = [['Отдел', 'ФИО', 'Должность', 'Внутр. №', 'Общ. №', 'Городской №', 'Email']]
            
            for emp in employees:
                internal_phone = str(emp.internal_phone) if emp.internal_phone else ''
                common_phone = str(emp.common_phone) if emp.common_phone else ''
                city_phone = str(emp.city_phone) if emp.city_phone else ''
                
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
            
            # Создаем таблицу
            table = Table(data, repeatRows=1)
            
            # Настраиваем стиль таблицы
            table_style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.white),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ])
            
            # Настраиваем ширину колонок
            col_widths = [80, 120, 100, 50, 60, 60, 100]
            table._argW = col_widths
            table.setStyle(table_style)
            
            elements.append(table)
            
            print("Строим PDF документ...")
            doc.build(elements)
            
            buffer.seek(0)
            pdf_size = len(buffer.getvalue())
            
            print(f"✅ PDF успешно создан, размер: {pdf_size} байт")
            print("✅ Экспорт PDF работает корректно!")
            
            # Сохраняем тестовый файл
            with open('test_direct_export.pdf', 'wb') as f:
                f.write(buffer.getvalue())
            print("✅ PDF сохранен как 'test_direct_export.pdf'")
            
        except Exception as e:
            print(f"❌ Ошибка при экспорте PDF: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_pdf_export_direct()
