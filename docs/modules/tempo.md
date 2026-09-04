# Модуль: Tempo (трейсинг)

OTel SDK стоит в API всегда (Core), экспортёр выключен. Модуль добавляет
Tempo и включает экспорт.

## Когда включать

Когда появляются внешние вызовы или worker — то есть цепочки, которые не
видно одним requestId в логах. До этого derived field requestId в Grafana
закрывает типовой случай.

## Включение

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318    # прод
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 # локально (make observability)
```

Путь трейса: api → OTLP → Alloy → Tempo → Grafana (datasource Tempo,
связка trace ↔ log настроена).

## Проверка

Сделать пару запросов к API → Grafana → Explore → Tempo → трейсы приходят,
из спана по кнопке Logs открываются записи Loki того же периода.
