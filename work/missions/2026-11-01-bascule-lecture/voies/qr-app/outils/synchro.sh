#!/bin/bash
# Copie isolée de la voie qr-app : worktree sans node_modules, .git, dist ni work ; `npm ci` réel dedans (jamais dans la jonction).
# Usage : bash synchro.sh        (première fois : crée la copie et lance npm ci ; ensuite : resynchronise src, tests, functions/src, scripts, config)
SRC="C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie"
DST="$(cygpath -m "$TEMP")/qr-app-copie"
mkdir -p "$DST"
MSYS_NO_PATHCONV=1 robocopy "$SRC" "$DST" /MIR /XD node_modules .git dist work .claude .codex .agents cerveau docs coverage captures output prototypes /XF "*.log" /NFL /NDL /NJH /NJS /NP > /dev/null
# robocopy rend 0 à 7 pour un succès
if [ ! -d "$DST/node_modules" ]; then
  (cd "$DST" && npm ci --no-audit --no-fund --ignore-scripts 2>&1 | tail -5)
fi
echo "copie : $DST"
