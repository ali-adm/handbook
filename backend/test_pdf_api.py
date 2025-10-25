import requests
import sys
import os

def test_pdf_export_api():
    """Тест экспорта PDF через API"""
    
    # URL API для экспорта PDF
    url = "http://localhost:5000/api/export/pdf"
    
    try:
        print("Тестирование экспорта PDF через API...")
        
        # Отправляем GET запрос для экспорта PDF
        response = requests.get(url)
        
        print(f"Статус ответа: {response.status_code}")
        print(f"Тип контента: {response.headers.get('content-type')}")
        print(f"Размер данных: {len(response.content)} байт")
        
        if response.status_code == 200:
            # Сохраняем PDF файл для проверки
            with open('test_export.pdf', 'wb') as f:
                f.write(response.content)
            
            print("✅ PDF успешно экспортирован и сохранен как 'test_export.pdf'")
            print("✅ Экспорт PDF работает корректно!")
        else:
            print(f"❌ Ошибка экспорта: {response.status_code}")
            print(f"Текст ответа: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к серверу. Убедитесь, что сервер запущен на localhost:5000")
    except Exception as e:
        print(f"❌ Произошла ошибка: {str(e)}")

if __name__ == '__main__':
    test_pdf_export_api()
