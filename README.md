# Amazon Review Scraper — Foundation Layer

## 📌 О проекте
Данная система предназначена для автоматизированного сбора и анализа данных с Amazon. Основной упор сделан на **масштабируемую архитектуру БД**, способную эффективно обрабатывать сотни миллионов отзывов, и **отказоустойчивый парсинг**.

---

### Как развернуть данное приложение:
git clone git@github.com:Aleksey-00/amazon-scraper.git

docker compose up -d

yarn prisma migrate dev

---
## 🏗 1. Архитектура базы данных (ER-диаграмма)

Для обеспечения целостности данных и скорости выборок выбрана реляционная модель в PostgreSQL.

### Визуализация связей (Mermaid)
```mermaid
erDiagram
    Category ||--o{ Product : contains
    Seller ||--o{ Product : owns
    Product ||--o{ Review : has
    
    Category {
        uuid id PK
        string name
        string url
    }
    
    Seller {
        string id PK "Amazon Seller ID"
        string name
    }
    
    Product {
        string id PK "ASIN (Standard ID)"
        string title
        string url
        decimal price
        float avgRating
        int reviewsCount
        uuid categoryId FK
        string sellerId FK
        datetime lastUpdatedAt
    }
    
    Review {
        uuid id PK
        string externalId UK "Amazon Review ID"
        string asin FK
        int rating
        text text
        boolean isVerified
        datetime reviewDate
    }