
#!/bin/bash

# --- Конфигурация ---
MANIFEST="public/audio-manifest.json"
TEMP_MANIFEST="manifest.tmp.json"

# Временные файлы для списков
ACTUAL_FILES_TMP="actual_files.tmp"
MANIFEST_FILES_TMP="manifest_files.tmp"
FILES_TO_ADD_TMP="files_to_add.tmp"
FILES_TO_ADD_JSON="files_to_add.json"

echo "Запускаю финальную синхронизацию audio-manifest.json..."

# --- Шаг 1: Получаем актуальный список аудиофайлов из директорий ---
echo "1/4: Сканирую public/assets на наличие аудиофайлов..."
# Используем find для рекурсивного поиска и sed для нормализации путей
find public/assets -type f \( -name "*.ogg" -o -name "*.mp3" -o -name "*.wav" \) \
| sed 's|^public||' \
| sort > "$ACTUAL_FILES_TMP"

# --- Шаг 2: Получаем список файлов из текущего манифеста ---
echo "2/4: Читаю текущий audio-manifest.json..."
# Используем jq для извлечения путей и sort для подготовки к сравнению
jq -r '.[]' "$MANIFEST" | sort > "$MANIFEST_FILES_TMP"

# --- Шаг 3: Находим файлы, которые нужно добавить ---
echo "3/4: Сравниваю реальные файлы и записи в манифесте..."
# comm -23 выводит строки, уникальные для первого файла (т.е. те, что нужно добавить)
comm -23 "$ACTUAL_FILES_TMP" "$MANIFEST_FILES_TMP" > "$FILES_TO_ADD_TMP"

# Считаем количество строк в файле с новыми путями
COUNT_TO_ADD=$(wc -l < "$FILES_TO_ADD_TMP")

if [ "$COUNT_TO_ADD" -eq 0 ]; then
    echo -e "\n\033[0;32m✔️ Синхронизация не требуется. Манифест уже на 100% соответствует файлам в проекте.\033[0m"
    # Удаляем временные файлы
    rm "$ACTUAL_FILES_TMP" "$MANIFEST_FILES_TMP" "$FILES_TO_ADD_TMP"
    exit 0
fi

echo "Найдено $COUNT_TO_ADD файлов для добавления в манифест."

# --- Шаг 4: Добавляем новые файлы в JSON ---
echo "4/4: Обновляю audio-manifest.json..."

# Сначала конвертируем наш список строк в валидный JSON-массив строк
jq -R '.' "$FILES_TO_ADD_TMP" | jq -s '.' > "$FILES_TO_ADD_JSON"

# Затем, с помощью jq, "складываем" основной массив манифеста и новый массив
# -s читает оба файла и передает их как массив .[0] и .[1]
jq -s '.[0] + .[1]' "$MANIFEST" "$FILES_TO_ADD_JSON" > "$TEMP_MANIFEST"

# Перемещаем временный файл на место основного, завершая операцию
mv "$TEMP_MANIFEST" "$MANIFEST"

# --- Очистка ---
rm "$ACTUAL_FILES_TMP" "$MANIFEST_FILES_TMP" "$FILES_TO_ADD_TMP" "$FILES_TO_ADD_JSON"

FINAL_COUNT=$(jq 'length' "$MANIFEST")
echo ""
echo "\033[0;32m✔️ Готово! Манифест успешно синхронизирован.\033[0m"
echo "  - Добавлено новых записей: $COUNT_TO_ADD"
echo "  - Итоговое количество записей: $FINAL_COUNT"

