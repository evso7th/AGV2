
#!/bin/bash

# --- Конфигурация ---
# Файл для вывода отчета
OUTPUT_FILE="asset_differences.txt"
# Временные файлы для отсортированных списков
MANIFEST_FILES="manifest_files.tmp"
REGISTRY_FILES="registry_files.tmp"

echo "Процесс запущен..."

# --- Шаг 1: Обновление assets_registry.txt ---
echo "1/4: Обновление assets_registry.txt..."
# Рекурсивно листим директорию и сохраняем результат
ls -R public/assets > assets_registry.txt

# --- Шаг 2: Извлечение и сортировка списков ---
echo "2/4: Обработка audio-manifest.json..."
# Извлекаем пути из JSON, сортируем и сохраняем
jq -r '.[]' public/audio-manifest.json | sort > "$MANIFEST_FILES"

echo "3/4: Обработка нового assets_registry.txt..."
# Используем awk для парсинга, фильтрации и нормализации путей аудиофайлов
awk '
  /:$/ {
    current_dir = substr($0, 8, length($0) - 8)
    if (current_dir != "") {
      current_dir = "/" current_dir
    }
    next
  }
  /^\s*$/ {next}
  /\.(ogg|mp3|wav)$/ {
    print current_dir "/" $0
  }
' assets_registry.txt | sort > "$REGISTRY_FILES"

# --- Шаг 3: Создание отчета ---
echo "4/4: Генерация отчета asset_differences.txt..."
# Очищаем/создаем файл отчета и добавляем заголовок
(cat <<EOF
### Отчет о Расхождении Аудио-Ассетов ###

# В этом файле перечислены различия между требуемыми ассетами (audio-manifest.json)
# и фактическими аудиофайлами в директории public/assets.

EOF
) > "$OUTPUT_FILE"

# Сравниваем файлы и добавляем результаты в отчет
IN_MANIFEST_ONLY=$(comm -23 "$MANIFEST_FILES" "$REGISTRY_FILES")
IN_REGISTRY_ONLY=$(comm -13 "$MANIFEST_FILES" "$REGISTRY_FILES")

# Записываем информацию о файлах, которые требуются, но отсутствуют
if [ -z "$IN_MANIFEST_ONLY" ]; then
  echo "# ✔️ Целостность: Все файлы из audio-manifest.json присутствуют в файловой системе." >> "$OUTPUT_FILE"
else
  (cat <<EOF
# ⚠️ ВНИМАНИЕ: Отсутствующие файлы
# Следующие файлы требуются манифестом, но не найдены в директории public/assets.
# Это может вызвать ошибки в приложении.
EOF
  ) >> "$OUTPUT_FILE"
  echo "$IN_MANIFEST_ONLY" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE" # Пустая строка для разделения

# Записываем информацию о неиспользуемых (лишних) файлах
if [ -z "$IN_REGISTRY_ONLY" ]; then
  echo "# ✔️ Избыточность: Все аудиофайлы из директории public/assets используются в манифесте." >> "$OUTPUT_FILE"
else
  (cat <<EOF
# 🔎 ИНФО: Неиспользуемые аудиофайлы
# Следующие аудиофайлы существуют в директории public/assets, но не зарегистрированы в audio-manifest.json.
# Они являются кандидатами на удаление для уменьшения размера проекта.
EOF
  ) >> "$OUTPUT_FILE"

  # Добавляем пути с вашим комментарием
  echo "$IN_REGISTRY_ONLY" | while IFS= read -r line; do
    echo "$line # Есть в registry, но нет в json" >> "$OUTPUT_FILE"
  done
fi

# --- Шаг 4: Очистка ---
rm "$MANIFEST_FILES" "$REGISTRY_FILES"

echo "Готово! Отчет сохранен в файл: $OUTPUT_FILE"

