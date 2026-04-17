# SpecialAcademy

Piattaforma separata **frontend + backend** per gestione corsi di toelettatura.

## Struttura progetto

- `frontend/` → sito pubblico + pagina backend admin (UI).
- `backend/` → API REST con autenticazione JWT, ruoli admin e permessi.

## Palette e stile

Frontend in stile **bento layout** con palette richiesta:
- Bianco
- Nero
- `#0ABABA` (accent/details)
- Scale di grigio chiaro per sfondi e bordi

## Funzionalità principali

### Frontend pubblico
- Home con hero, presentazione academy, corsi, maestri, eventi.
- Pagina corsi a blocchi.
- Pagina dettaglio corso con richiesta info + calendario se disponibile.
- Pagine maestri (con foto), eventi live e calendario.

### Backend admin (accesso riservato)
- Login admin con JWT.
- Gestione admin interna con livelli:
  - `superadmin`
  - `manager`
  - `editor`
- Permessi granulari (RBAC) su:
  - corsi
  - maestri
  - eventi
  - contatti
  - calendario
  - richieste generiche
  - lista email contatti
- Categorizzazione contatti con tag:
  - tag manuali
  - tag automatici in base alla categoria richiesta

## Avvio locale

### 1) Backend
```bash
cd backend
python3 src/server.py
```
API su `http://localhost:4000/api`.

### 2) Frontend
Avvia un server statico nella cartella `frontend` (esempio con Python):
```bash
cd frontend
python3 -m http.server 5500
```
Apri: `http://localhost:5500`.

## Credenziali demo admin
- `admin@specialacademy.local` / `Admin123!`
- `manager@specialacademy.local` / `Manager123!`

## Consigli evolutivi
- Spostare storage da JSON a PostgreSQL con audit log per modifiche admin.
- Aggiungere coda email (es. Resend/Sendgrid) con template e tracking.
- Implementare workflow stati lead (nuovo, qualificato, in trattativa, cliente).
- Introdurre soft-delete + versioning su corsi/eventi/calendario.
- Abilitare 2FA per admin superadmin/manager.
