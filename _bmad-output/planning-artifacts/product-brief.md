# Brief produktu — od-sasiada.pl

> Status: odtworzony 2026-06-20 (po Sprint 1). Właściciel: mateusz. Poziom: Analityk Biznesowy.

## 1. Opis problemu

Mały dostawcy **świeżych i sezonowych produktów spożywczych** w regionie Kaszub (Polska) — gospodarstwa rolne, wędzarnie, lokalni producenci ("od sąsiada") — nie mają prostego, dedykowanego kanału do przyjmowania zamówień. Dziś zamówienia odbywają się ad-hoc przez połączenia telefoniczne i komunikatory, co jest podatne na błędy dla dostawcy (utracone zamówienia, ręczne wyceny, brak historii zamówień) i niejasne dla klienta (brak potwierdzenia, brak statusu, brak zapisu tego, co zostało zamówione).

Ci dostawcy nie są operatorami e-commerce: ich towary są **szybko psujące się i sezonowe**, ceny się zmieniają, a stan magazynowy nie jest śledzony w sensie magazynowym. Potrzebują kanału zamówień bliższego "zamówieniu telefonicznemu, zapisanemu i potwierdzonemu" niż klasycznemu sklepowi internetowemu z inventarzem i płatnościami online.

**od-sasiada.pl** to wielotenantski MVP marketplace, gdzie każdy dostawca jest tenantem z własnym katalogiem i witryną, znany lokalny klient zamawia od dostawcy, któremu już ufa, a dostawca realizuje zamówienie przez prosty workflow dostawy z potwierdzeniem e-mail — płatność przy odbiorze (gotówka / przelew).

## 2. Użytkownicy docelowi

| Użytkownik | Rola w systemie | Potrzeby |
|-------------|-----------------|----------|
| **Operator** | Admin platformy (`platform-admin`, dostęp między-tenantski) | Onboardować dostawców, nadzorować platformę, utrzymywać izolację tenantów. |
| **Dostawca** | Tenant; użytkownik panelu admina przypisany do swojego tenanta | WyListingować produkty/porcje, widzieć tylko własne zamówienia, prowadzić zamówienia przez workflow dostawy, widzieć pełne szczegóły zamówienia. |
| **Klient** | Kolekcja `customers`, z autentykacją, per dostawca | Przeglądać katalog znanego dostawcy, budować koszyk, logować się, zamawiać z płatnością przy odbiorze, zapisywać adresy dostawy, widzieć swoje zamówienia i szczegóły zamówień (tylko do odczytu). |

## 3. Cele

- Dać pojedynczemu dostawcy-pilotowi działający end-to-end kanał zamówień: **dostawca wystawia towary → zalogowany klient zamawia → dostawca realizuje zamówienie przez automat stanów do dostawy → potwierdzenie e-mail.** (Cel Sprintu 1.)
- Ścisła **izolacja wielotenantska**: dostawca nigdy nie widzi zamówień/katalogu/klientów innego dostawcy; klient zalogowany u dostawcy A jest anonimowy u dostawcy B.
- Wiarygodny zapis zamówień: czytelny numer zamówienia + **snapshot cen/danych**, aby historyczne zamówienia przetrwały późniejsze zmiany produktów/cen.
- Model niskiego tarcia dopasowany do świeżych/sezonowych towarów: **bez śledzenia inventarza**, **płatność przy odborze** (bez integracji płatności online).

## 4. Cele pozazakresowe (ten etap)

- Płatności online / Stripe / checkout z płatnością z góry (tylko płatność przy odbiorze).
- Inventarz / śledzenie stanu magazynowego (B2 — celowo wyłączony).
- Checkout gościa (logowanie wymuszone przed checkoutem; koszyk gościa odłożony do backlogu).
- Fakturowanie operatora / subskrypcja per-tenant (odłożone do 3+ tenantów).
- Pełne RODO/GDPR (anonimizacja + UODO) — odłożone do publicznego uruchomienia.
- Zdjęcia produktów, kategorie, okna czasowe dostawy, SMS — odłożone do późniejszych epików.

## 5. Zakres MVP (dostarczony w Sprint 1)

- Izolacja wielotenantska w panelu, Local API i frontendzie.
- Katalog per-tenant z modelem Produkt + Wariant **"porcja"**, ceny w groszach (PLN jako liczby całkowite).
- Serwerowy koszyk na kolekcji ecommerce `carts`, jeden otwarty koszyk per klient+tenant; **wymuszone logowanie** przed checkoutem.
- Checkout gotówkowy generujący zamówienie z czytelnym **numerem zamówienia (`ZAM-RRRR-NNNNN`)** i snapshotami per pozycja.
- Workflow zamówień dostawcy: lista zamówień scopedowana na tenanta + **automat stanów z liniowy z cofaniem**.
- Konta klientów (rejestracja/logowanie/wylogowanie), **reset hasła**, zapisane adresy dostawy (pola PL), "moje zamówienia" + szczegóły zamówienia (tylko do odczytu).
- E-mail potwierdzający zamówienie po złożeniu (e-mail o zmianie statusu zastępczy/opcjonalny).

## 6. Sygnały sukcesu

- Dostawca-pilot może przeprowadzić prawdziwe zamówienie od wystawienia do dostawy bez interwencji operatora.
- Klienci otrzymują e-mail potwierdzający zamówienie i mogą zobaczyć historię/szczegóły zamówień.
- Zero wycieku danych między-tenantskich (zweryfikowane przez test regresyjny `orders-tenant-isolation`, R2/SPIKE-A).
- Zamówienia pozostają czytelne/poprawne nawet po zmianie ceny produktu (snapshot się utrzymuje).

## 7. Główne ograniczenia

- **Izolacja wielotenantska** wymuszana na trzech warstwach (dostęp do panelu, Local API, ręczny `where` + `overrideAccess` na froncie).
- **Płatność przy odbiorze** — zamówienia tworzone bezpośrednio przez Local API, pomijając pluginowy flow z płatnością z góry.
- **Ceny w groszach** (liczby całkowite; 130 = 1,30 zł) end-to-end.
- **Inventarz wyłączony** (świeże/sezonowe) — B2.
- Unikalność e-maili jest obecnie **globalna** (domyślne Payload auth) — konta per-tenant to znany TODO, patrz Założenia.

## 8. Założenia i ryzyka

**Założenia**
- Klient już zna/ufa dostawcy (to jest kanał zamówień, nie odkrywanie).
- Pojedynczy dostawca-pilot wystarcza do walidacji modelu.
- *(Założenie, wywnioskowane)* Witryna w języku polskim; angielski tylko do wewnętrznych/dokumentów BMAD (konfiguracja `document_output_language: English`, fallback `i18n` aplikacji `pl`).

**Rzyka** (z sprint-1.md)
- **R1 — operacyjne:** brak e-maili → klienci dzwonią, dostawca jest przytłoczony. Złagodzone przez S1.7 (adapter e-mail + potwierdzenie) w tym sprincie.
- **R2 — bezpieczeństwa:** izolacja tenantów przy `update` zamówienia nieprzetestowana → rozwiązane przez SPIKE-A (test regresyjny) przed budowaniem automatu stanów.
- **R3 — refaktor:** przejście na serwerowy koszyk może zepsuć koszyk-store/placeOrder/reorder → S1.2 zaplanowany ostatni, z wielokrotnie używalnym rdzeniem walidacji (`cart-validation.ts`).

**Znane ograniczenie (do przeniesienia):** konta klientów per-tenant nie zostały jeszcze zaimplementowane — ten sam e-mail nie może się zarejestrować u dwóch dostawców; niedopasowanie tenantów jest odrzucane przy logowaniu, więc jest to bezpieczne, ale jeszcze nie "oddzielne konto per dostawcy" (patrz architecture.md).
