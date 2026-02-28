#!/bin/bash
echo ""
echo "  ========================================"
echo "   OCM Navigator - Change Management"
echo "  ========================================"
echo ""

# Get local IP
if command -v ip &> /dev/null; then
    IP=$(ip route get 1 | awk '{print $7; exit}')
elif command -v ifconfig &> /dev/null; then
    IP=$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)
else
    IP="<deine-ip>"
fi

echo "  Lokal:    http://localhost:8080/ocm-navigator-v3.html"
echo "  Netzwerk: http://$IP:8080/ocm-navigator-v3.html"
echo ""
echo "  Server beenden: Ctrl+C"
echo ""
echo "  ========================================"
echo ""

cd "$(dirname "$0")"

if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
elif command -v npx &> /dev/null; then
    npx serve . -l 8080
else
    echo "  Weder Python noch Node.js gefunden!"
    echo "  Installiere Python: https://www.python.org/downloads/"
    exit 1
fi
