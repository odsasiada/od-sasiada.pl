# S1.7 — Adapter e-mail + e-mail potwierdzający zamówienie + reset hasła klienta

Status: udokumentowany 2026-06-20 · ✅ GOTOWE · EPIC-1

## Historyjka

Jako **klient** chcę **e-maila potwierdzającego moje zamówienie i działającego flow resetu hasła**, aby **ufać, że zamówienie przeszło i móc odzyskać moje konto** (ryzyko R1 — cisza powoduje, że klienci dzwonią do dostawcy).

## Kryteria akceptacji (z sprint-1.md)

- Adapter e-maila skonfigurowany.
- E-mail "zamówienie otrzymane" wysyłany po złożeniu zamówienia.
- Reset hasła klienta działa.

## Zależności

- S1.5 (hook statusu), konto klienta (auth).

## Uwagi implementacyjne

- `src/payload.config.ts` — `nodemailerAdapter` (SMTP, Apple `smtp.mail.me.com:587` STARTTLS). `secure` wywnioskowane z portu (465 = implicit TLS, 587 = STARTTLS) zamiast ufania fladze env.
- `src/ecommerce/order-emails.ts` — e-mail potwierdzający zamówienie, wywoływany z ścieżki `afterChange` zamówienia z S1.5.
- Flow resetu hasła klienta przez kolekcję auth `customers`; trasa frontendu `src/app/(frontend)/[tenant]/reset-hasla/page.tsx`.

## Dowody testów / weryfikacji

- Dostarczone wcześniej, zweryfikowane przez `pnpm payload run src/spike-email.ts` (wyjście `/tmp/spike-email.txt`): testowy e-mail wysyłany do `EMAIL_FROM` przez SMTP → **SMTP działa**. E-mail potwierdzający zamówienie i flow resetu zweryfikowane względem live adaptera e-mail zgodnie z sprint-1.md.
