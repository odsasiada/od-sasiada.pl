# Język UI (Voice & Tone) — od-sąsiada.pl

> PL, sąsiedzki, bezpośredni — „rozmowa przez płot", nie regulamin.
> Spójny z filozofią „stół kuchenny sąsiada" ([design-system.md](./design-system.md)).

## Charakter głosu

Ciepły, ludzki, na „Ty". Mówimy jak sąsiad, który zna się na tym, co sprzedaje — bez korpo-żargonu,
bez zadęcia. Konkret zamiast ogólników. Spokojnie, nigdy alarmująco (nawet przy błędach i braku towaru).

## Zasady pisania

- Forma **„Ty"** (nie „Państwo", nie bezosobowo).
- Krótkie zdania, prosty język.
- Konkret zamiast ogólników („Dostawa w piątki", nie „Elastyczne opcje dostawy").
- Cena i warunki jawne i czytelne (zaufanie).
- Polskie znaki zawsze poprawne (fonty z subset `latin-ext`).

## Zamiast → napisz

| Kontekst | Zamiast | Napisz |
|----------|---------|--------|
| błąd walidacji | „Wystąpił błąd walidacji" | „Sprawdź, czego brakuje w formularzu" |
| pusty koszyk | „Brak elementów" | „Twój koszyk jest jeszcze pusty" |
| pusta lista | „Brak wyników" | „Nic tu jeszcze nie ma — zajrzyj później" |
| CTA zakup | „Submit / Kup teraz!!!" | „Dodaj do koszyka" |
| brak ceny | „N/A" | „Cena sezonowa" / „Zapytaj o cenę" |
| mało sztuk | „LOW STOCK" | „Zostało N" |
| logowanie | „Authenticate" | „Zaloguj się" |

## Mikrokopia

- Przyciski: „Dodaj do koszyka", „Zamawiam", „Zaloguj się", „Ponów zamówienie".
- Potwierdzenia: „✓ Dodano".
- Etykiety opcjonalne: dopisek „(opcjonalnie)" przy polu (`Field optional`).
- Checkout: podkreśl „Płatność gotówką przy odbiorze".

## Czego unikać

- Korpo-żargon i anglicyzmy bez potrzeby („submit", „checkout" jako widoczny tekst).
- Straszące / techniczne komunikaty błędów (kody, stack-trace, CAPS LOCK).
- Wykrzykniki i sztuczny entuzjazm.
- Bezosobowe formy („Należy uzupełnić pole").
