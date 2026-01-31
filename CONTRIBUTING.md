# Contributing

Köszönjük, hogy hozzájárulsz a Magic Draw projekthez!

Kérjük, kövesd az alábbi egyszerű szabályokat, hogy a hozzájárulások gyorsan és áttekinthetően kezelhetők legyenek.

## Gyors indulás
- Klónozd a repót, majd a backend és frontend fejlesztéshez telepítsd a szükséges eszközöket:

```bash
dotnet --version   # használd a projekt által elvárt .NET SDK-t
cd src/MagicDraw.Web
npm install
```

- Fejlesztés indítása lokálisan:

```bash
dotnet run --project ./src/MagicDraw.AppHost
cd src/MagicDraw.Web
npm run dev
```

## Mielőtt PR-t nyitsz
- Hozz létre egy feature ágat: `feature/descr` vagy javításnál `fix/descr`.
- Futtasd a teszteket és a formázót, ahol van.
- Frissítsd a `WORKLOG.txt`-et rövid bejegyzéssel a változtatásokról.
- Szükség esetén frissítsd a `STATUS.md`-t (ha feature állapotot változtatsz).

## Pull request szabályok
- Célág: nyiss PR-t `dev` ág felé.
- Cím: legyen rövid, leíró.
- Leírás: rövid összegzés, miért szükséges a változtatás, hogyan tesztelhető.
- Kérj 1–2 reviewert, dönts megjegyzések alapján.

## Issue-k
- Ha hibát találsz, kérlek hozz létre részletes issue-t: lépések újraalkotásra, elvárt vs. tényleges viselkedés, logok, környezet.

## Commit üzenetek
- Rövid, imperatív egysoros összegzés (max ~50 karakter), opcionális részletes leírás a sor alatt.
- Példa: `Fix: AI generation queue deadlock` vagy `Feat: Add prompt history export`.

## Kódstílus és tesztek
- Tartsd a meglévő projekt struktúrát és stílust.
- Új funkciókhoz írj teszteket, ahol lehetséges (unit/integration).

## Környezeti változók
- Ne tölts fel valódi kulcsokat (OpenAI, DB). Helyett használj mintafájlt: `.env.example` vagy `appsettings.sample.json`.

## Licence és magatartás
- A projekt licence: `LICENSE`.
- Viselkedési alapelvekhez: lásd `CODE_OF_CONDUCT.md` (ha nincs, jelezd és segítek hozzáadni).

Köszönjük a közreműködésedet — ha szeretnél, készítek sablonokat (`ISSUE_TEMPLATE.md`, `PULL_REQUEST_TEMPLATE.md`) is.
