#!/usr/bin/env python3
"""
Скрипт для смены пароля суперадмина (sadmin)
Использование: python change_superadmin_password.py НОВЫЙ_ПАРОЛЬ
"""

import sys
import os
from werkzeug.security import generate_password_hash

def change_superadmin_password(new_password):
    """
    Изменяет пароль суперадмина в файле docker-compose.yml
    """
    if len(new_password) < 6:
        print("❌ Ошибка: Пароль должен быть не менее 6 символов")
        return False
    
    try:
        # Читаем текущий docker-compose.yml
        with open('docker-compose.yml', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Заменяем пароль суперадмина
        old_line = "      - SUPERADMIN_PASSWORD="
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            if line.strip().startswith(old_line):
                # Извлекаем старый пароль
                old_password = line.split('=')[1].strip()
                # Заменяем на новый
                lines[i] = f"      - SUPERADMIN_PASSWORD={new_password}"
                break
        
        # Записываем обратно
        with open('docker-compose.yml', 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        print(f"✅ Пароль суперадмина успешно изменен!")
        print(f"📝 Старый пароль: {old_password}")
        print(f"🔑 Новый пароль: {new_password}")
        print("\n⚠️  Для применения изменений необходимо:")
        print("   1. Пересобрать контейнер: docker compose up --build -d")
        print("   2. Перезапустить приложение")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при изменении пароля: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Использование: python change_superadmin_password.py НОВЫЙ_ПАРОЛЬ")
        print("Пример: python change_superadmin_password.py MyNewSecurePassword123")
        sys.exit(1)
    
    new_password = sys.argv[1]
    
    if not change_superadmin_password(new_password):
        sys.exit(1)

if __name__ == "__main__":
    main()
