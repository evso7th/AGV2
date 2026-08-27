
#!/bin/bash

# Временные файлы для хранения отсортированных списков
MANIFEST_FILES="manifest_files.tmp"
REGISTRY_FILES="registry_files.tmp"

# --- Шаг 1: Обработка audio-manifest.json ---
echo "Извлекаем и сортируем файлы из audio-manifest.json..."
jq -r '.[]' public/audio-manifest.json | sort > "$MANIFEST_FILES"

# --- Шаг 2: Обработка assets_registry.txt ---
echo "Извлекаем и сортируем аудиофайлы из assets_registry.txt..."
# Используем awk для парсинга сложного формата assets_registry.txt
awk '
  # Когда строка заканчивается на двоеточие, это директория
  /:$/ {
    # Удаляем "public" и ":", добавляем слэш в начало
    current_dir = substr($0, 8, length($0) - 8)
    # Пропускаем пустые корневые директории, если они есть
    if (current_dir != "") {
      current_dir = "/" current_dir
    }
    next
  }
  # Пропускаем пустые строки
  /^\s*$/ {next}
  # Все остальные строки - это файлы. Фильтруем только аудиофайлы.
  /\.(ogg|mp3|wav)$/ {
    # Выводим полный путь
    print current_dir "/" $0
  }
' assets_registry.txt | sort > "$REGISTRY_FILES"

# --- Шаг 3: Сравнение и вывод ---
echo "Сравниваем списки..."
echo ""

# Ищем файлы, которые есть в манифесте, но отсутствуют в реестре
IN_MANIFEST_ONLY=$(comm -23 "$MANIFEST_FILES" "$REGISTRY_FILES")

if [ -z "$IN_MANIFEST_ONLY" ]; then
  echo "✔️ Все файлы из audio-manifest.json присутствуют в assets_registry.txt."
else
  echo "⚠️ ВНИМАНИЕ: Эти файлы есть в audio-manifest.json, но отсутствуют в assets_registry.txt:"
  echo "$IN_MANIFEST_ONLY"
fi

echo "" # Пустая строка для читаемости

# Ищем файлы, которые есть в реестре, но отсутствуют в манифесте
IN_REGISTRY_ONLY=$(comm -13 "$MANIFEST_FILES" "$REGISTRY_FILES")

if [ -z "$IN_REGISTRY_ONLY" ]; then
  echo "✔️ Все аудиофайлы из assets_registry.txt перечислены в audio-manifest.json."
else
  echo "🔎 ИНФО: Эти аудиофайлы есть в assets_registry.txt, но не используются в audio-manifest.json:"
  echo "$IN_REGISTRY_ONLY"
fi

# --- Шаг 4: Очистка ---
rm "$MANIFEST_FILES" "$REGISTRY_FILES"
echo ""
echo "Готово."

