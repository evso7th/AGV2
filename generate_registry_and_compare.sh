
#!/bin/bash

# --- Конфигурация ---
REGISTRY_FILE="assets_registry.txt"
OUTPUT_FILE="asset_differences.txt"
MANIFEST_FILES="manifest_files.tmp"
REGISTRY_FILES_NORMALIZED="registry_files_normalized.tmp"

echo "Процесс запущен..."

# --- Шаг 1: Создание реестра с помощью find ---
echo "1/4: Обновление $REGISTRY_FILE с использованием 'find' для получения полных путей..."
# -type f гарантирует, что в список попадут только файлы, не директории
find public/assets -type f > "$REGISTRY_FILE"

# --- Шаг 2: Извлечение и нормализация путей ---
echo "2/4: Обработка audio-manifest.json..."
# Извлекаем пути из JSON, сортируем и сохраняем
jq -r '.[]' public/audio-manifest.json | sort > "$MANIFEST_FILES"

echo "3/4: Нормализация путей из нового $REGISTRY_FILE..."
# Фильтруем только аудиофайлы и приводим пути к формату как в манифесте (/assets/...)
# sed 's|^public||' убирает префикс 'public' из каждой строки
grep -E '\.(ogg|mp3|wav)$' "$REGISTRY_FILE" | sed 's|^public||' | sort > "$REGISTRY_FILES_NORMALIZED"

# --- Шаг 3: Генерация отчета ---
echo "4/4: Генерация отчета $OUTPUT_FILE..."
# Заголовок отчета
(cat <<EOF
### Отчет о Расхождении Аудио-Ассетов (версия 2) ###

# Реестр 'assets_registry.txt' был пересоздан с использованием команды 'find' для получения полных путей.
# Сравнение производится между 'audio-manifest.json' и аудиофайлами из этого нового реестра.

EOF
) > "$OUTPUT_FILE"

# Сравнение с помощью comm
IN_MANIFEST_ONLY=$(comm -23 "$MANIFEST_FILES" "$REGISTRY_FILES_NORMALIZED")
IN_REGISTRY_ONLY=$(comm -13 "$MANIFEST_FILES" "$REGISTRY_FILES_NORMALIZED")

# Запись отсутствующих файлов
if [ -z "$IN_MANIFEST_ONLY" ]; then
  echo "# ✔️ Целостность: Все файлы из audio-manifest.json присутствуют в файловой системе." >> "$OUTPUT_FILE"
else
  (cat <<EOF
# ⚠️ ВНИМАНИЕ: Отсутствующие файлы
# Следующие файлы требуются манифестом, но не найдены в директории public/assets.
EOF
  ) >> "$OUTPUT_FILE"
  echo "$IN_MANIFEST_ONLY" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Запись неиспользуемых файлов
if [ -z "$IN_REGISTRY_ONLY" ]; then
  echo "# ✔️ Избыточность: Все аудиофайлы из директории public/assets используются в манифесте." >> "$OUTPUT_FILE"
else
  (cat <<EOF
# 🔎 ИНФО: Неиспользуемые аудиофайлы
# Следующие аудиофайлы существуют, но не зарегистрированы в audio-manifest.json.
EOF
  ) >> "$OUTPUT_FILE"

  echo "$IN_REGISTRY_ONLY" | while IFS= read -r line; do
    echo "$line # Есть в registry, но нет в json" >> "$OUTPUT_FILE"
  done
fi

# --- Шаг 4: Очистка ---
rm "$MANIFEST_FILES" "$REGISTRY_FILES_NORMALIZED"

echo "Готово! Новый реестр '$REGISTRY_FILE' и отчет '$OUTPUT_FILE' созданы."

