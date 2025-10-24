#!/usr/bin/env python3
"""
Тестовый скрипт для проверки импорта данных из CSV/XLSX файлов
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

def test_pandas_import():
    """Тестирует возможность импорта pandas и чтения файлов"""
    try:
        import pandas as pd
        print("+ pandas успешно импортирован")
        print(f"Версия pandas: {pd.__version__}")
        
        # Проверим версию numpy
        import numpy as np
        print(f"Версия numpy: {np.__version__}")
        
        # Попробуем прочитать тестовый CSV файл
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'sample_data.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            print(f"+ CSV файл успешно прочитан: {len(df)} записей")
            print("Первые 3 записи:")
            print(df.head(3))
        else:
            print("- Тестовый CSV файл не найден")
            
        return True
        
    except Exception as e:
        print(f"- Ошибка при тестировании импорта: {e}")
        return False

if __name__ == "__main__":
    print("Тестирование импорта данных...")
    success = test_pandas_import()
    if success:
        print("\n+ Все тесты пройдены успешно!")
    else:
        print("\n- Тесты не пройдены")
        sys.exit(1)
