
#!/bin/bash

# --- Конфигурация ---
MANIFEST="public/audio-manifest.json"
BACKUP="${MANIFEST}.bak"

# Проверяем, существует ли jq
if ! command -v jq &> /dev/null; then
    echo "Ошибка: утилита 'jq' не найдена. Пожалуйста, установите ее для работы с JSON."
    exit 1
fi

# --- Шаг 1: Резервное копирование ---
echo "Создаю резервную копию: $BACKUP"
cp "$MANIFEST" "$BACKUP"

# --- Шаг 2: Фильтрация ---
echo "Проверяю наличие файлов, указанных в манифесте..."

# Создаем Bash-массив, содержащий только существующие пути
VALID_FILES=()
REMOVED_COUNT=0
ORIGINAL_COUNT=0

# Используем `jq` для чтения и `while` для итерации, чтобы корректно обрабатывать пути с пробелами
while IFS= read -r path; do
    ((ORIGINAL_COUNT++))
    # Формируем путь для проверки: убираем слэш в начале и добавляем префикс 'public'
    path_to_check="public/${path#/}"

    if [ -f "$path_to_check" ]; then
        # Если файл существует, добавляем его в массив для сохранения
        VALID_FILES+=("$path")
    else
        # Иначе, сообщаем об удалении
        echo "  - Не найден (будет удален): $path"
        ((REMOVED_COUNT++))
    fi
done < <(jq -r '.[]' "$MANIFEST")

# --- Шаг 3: Создание нового манифеста ---
echo "Генерирую новый audio-manifest.json..."

# `jq -n` создает новый JSON. `'$ARGS.positional'` получает аргументы как массив.
# `--args` передает элементы массива VALID_FILES как отдельные строковые аргументы.
jq -n --args '$ARGS.positional' -- "${VALID_FILES[@]}" > "$MANIFEST"

FINAL_COUNT=${#VALID_FILES[@]}

# --- Итог ---
echo ""
echo "Готово! Файл $MANIFEST был очищен и перезаписан."
echo "  - Исходное количество записей: $ORIGINAL_COUNT"
echo "  - Удалено несуществующих:     $REMOVED_COUNT"
echo "  - Итоговое количество записей:  $FINAL_COUNT"

