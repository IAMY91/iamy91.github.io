# OCM Navigator – Lokales Hosting
# ================================

## Schnellstart

### Option A: Python (empfohlen – auf den meisten Rechnern vorinstalliert)

1. Lege `ocm-navigator-v3.html` in einen Ordner, z.B. `C:\OCM-Navigator\`
2. Öffne ein Terminal / PowerShell in diesem Ordner
3. Starte den Server:

```bash
python -m http.server 8080
```

4. Öffne im Browser: **http://localhost:8080/ocm-navigator-v3.html**

### Option B: Node.js

```bash
npx serve . -l 8080
```

### Zugriff für Kollegen im selben Netzwerk

1. Finde deine IP-Adresse:
   - **Windows:** `ipconfig` → IPv4-Adresse (z.B. `192.168.1.42`)
   - **Mac/Linux:** `ifconfig` oder `ip a`

2. Teile diesen Link mit deinen Kollegen:
   ```
   http://192.168.1.42:8080/ocm-navigator-v3.html
   ```
   (ersetze die IP durch deine eigene)

3. Falls Windows-Firewall blockiert: beim ersten Start "Zugriff erlauben" klicken,
   oder manuell Port 8080 freigeben:
   ```powershell
   netsh advfirewall firewall add rule name="OCM Navigator" dir=in action=allow protocol=tcp localport=8080
   ```

## Daten teilen (Export/Import-Workflow)

Da jeder Nutzer seine eigenen Daten im Browser speichert, funktioniert Teamarbeit so:

1. **Datenpfleger** (eine Person) arbeitet mit der App und pflegt alle Daten
2. Regelmäßig: **Import/Export → JSON-Export** klicken
3. Die JSON-Datei in einen Teams-Kanal oder SharePoint-Ordner hochladen
4. Kollegen laden die Datei herunter und importieren sie über **Import/Export → JSON importieren**

## Dateien

| Datei | Zweck |
|-------|-------|
| `ocm-navigator-v3.html` | Die komplette App (einfach im Browser öffnen) |
| `start-server.bat` | Windows-Doppelklick-Starter |
| `start-server.sh` | Mac/Linux-Starter |
| `README.md` | Diese Anleitung |

## Troubleshooting

- **Seite lädt nicht:** Prüfe ob Python installiert ist (`python --version`)
- **Kollegen können nicht zugreifen:** Firewall-Regel prüfen (s.o.)
- **Daten weg nach Browser-Cache löschen:** Regelmäßig JSON exportieren als Backup!
- **Port 8080 belegt:** Anderen Port nutzen, z.B. `python -m http.server 3000`
