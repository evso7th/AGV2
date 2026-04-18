
# Журнал Проекта "AuraGroove"

---

### ЗАПИСЬ: 09-03-2026 (PLAN №1241: FIRESTORE PERMISSIONS FIX)
**СОБЫТИЕ**: Исправление ошибки "Missing or insufficient permissions" для коллекции `routes`.
**ПРИЧИНА**: Правила безопасности не позволяли выполнять операцию `list` на коллекции маршрутов даже при наличии фильтра `userId`.
**ИТОГ**: 
1. В `firestore.rules` разделены правила для `get` и `list`.
2. Добавлена явная проверка `request.auth.uid == resource.data.userId` для листинга.
3. Файл `backend.json` переведен на стандартный формат мапинга путей.

---

### ЗАПИСЬ: 09-03-2026 (PLAN №1240: ROUTE PERSISTENCE & SPINNER CALIBRATION)
... (предыдущие записи)
