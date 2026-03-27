// Thermal Printer Receipt Component

// ╔══════════════════════════════════════════════════════════════╗
// ║              ⚙️  CONFIGURATION DU SALON                     ║
// ║         Modifiez uniquement cette section                    ║
// ╚══════════════════════════════════════════════════════════════╝
const SalonConfig = {
    nom:      'JL Beauty',       // ← Nom de votre salon
    slogan:   'Univers à vivre',     // ← Slogan (laisser vide '' pour masquer)
    adresse:  'Gombe haut commandement, Ref.Immeuble Werra', // ← Adresse complète
    ville:    'Kinshasa',              // ← Ville
    telephone:'  +243 970 312 856',    // ← Numéro de téléphone
    telephone2: '',                    // ← 2ème numéro (laisser vide '' pour masquer)
    email:    '',                      // ← Email (laisser vide '' pour masquer)
    merci:    'Merci de votre visite !', // ← Message de bas de page
    sousMerci:'À bientôt parmi nous',    // ← Sous-message de bas de page
};

const ThermalReceipt = {

    // ─── Helpers ────────────────────────────────────────────────────────────────

    // Pad text à gauche, droite ou centré sur N caractères
    _padLeft:   (str, n) => String(str).padStart(n),
    _padRight:  (str, n) => String(str).padEnd(n),
    _center:    (str, n) => {
        const s = String(str);
        if (s.length >= n) return s;
        const left  = Math.floor((n - s.length) / 2);
        const right = n - s.length - left;
        return ' '.repeat(left) + s + ' '.repeat(right);
    },

    // Ligne de séparation sur toute la largeur (32 chars pour 80mm)
    _sep: (char = '-', n = 32) => char.repeat(n),

    // ─── Parse items robuste (Array ou JSON string depuis Supabase) ───────────
    _parseItems(venteData) {
        if (!venteData.items) return null;
        if (Array.isArray(venteData.items)) return venteData.items;
        if (typeof venteData.items === 'string') {
            try { return JSON.parse(venteData.items); } catch (e) { return null; }
        }
        return null;
    },

    // ─── Generate ────────────────────────────────────────────────────────────
    generate(venteData) {
        const COL = 32; // largeur totale en caractères (80mm ≈ 32 chars Courier 12px)

        const date = new Date(venteData.date_vente);
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);

        // ── Construire les lignes d'articles ─────────────────────────────────
        const items = this._parseItems(venteData);
        let itemsRows = '';

        if (items && items.length > 0) {
            items.forEach(item => {
                const nom      = String(item.item_nom || item.service_nom || item.nom || '?');
                const qty      = item.quantite || 1;
                const pu       = parseFloat(item.prix_unitaire || 0);
                const subtotal = pu * qty;

                // Ligne 1 : nom de l'article (tronqué si besoin)
                const nomTronque = nom.length > COL ? nom.substring(0, COL) : nom;
                // Ligne 2 : qty × pu → subtotal (aligné à droite)
                const qtyPu    = `  ${qty} x ${Utils.formatUSD(pu)}`;
                const subStr   = Utils.formatUSD(subtotal);
                const spaces   = COL - qtyPu.length - subStr.length;
                const ligne2   = qtyPu + ' '.repeat(Math.max(1, spaces)) + subStr;

                itemsRows += `
                    <tr><td colspan="2" class="item-name">${nomTronque}</td></tr>
                    <tr>
                        <td class="item-detail">${qty} x ${Utils.formatUSD(pu)}</td>
                        <td class="item-total">${Utils.formatUSD(subtotal)}</td>
                    </tr>
                `;
            });
        } else {
            // Fallback article unique
            const qty      = venteData.quantite || 1;
            const pu       = parseFloat(venteData.prix_unitaire || 0);
            const subtotal = venteData.montant_total;
            const nom      = venteData.item_nom || '-';
            itemsRows = `
                <tr><td colspan="2" class="item-name">${nom}</td></tr>
                <tr>
                    <td class="item-detail">${qty} x ${Utils.formatUSD(pu)}</td>
                    <td class="item-total">${Utils.formatUSD(subtotal)}</td>
                </tr>
            `;
        }

        // ── Monnaie rendue ────────────────────────────────────────────────────
        let changeHTML = '';
        if (venteData.montant_percu && parseFloat(venteData.montant_percu) > 0) {
            const change = venteData.monnaie || (venteData.montant_percu - venteData.montant_total);
            changeHTML = `
                <div class="sep-dashed"></div>
                <div class="money-row">
                    <span>Reçu :</span>
                    <span>${Utils.formatUSD(venteData.montant_percu)}</span>
                </div>
                <div class="money-row money-change">
                    <span>Monnaie :</span>
                    <span>${Utils.formatUSD(Math.max(0, change))}</span>
                </div>
            `;
        }

        // ── CDF équivalent ────────────────────────────────────────────────────
        let cdfHTML = '';
        if (typeof CurrencyConfig !== 'undefined') {
            const cdfTotal = CurrencyConfig.convertToCDF(venteData.montant_total);
            cdfHTML = `<div class="cdf-equiv">≈ ${Utils.formatCDF(venteData.montant_total)}</div>`;
        }

        // ── ID reçu court ─────────────────────────────────────────────────────
        const receiptId = venteData.id
            ? venteData.id.substring(0, 8).toUpperCase()
            : Date.now().toString(36).toUpperCase();

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu ${receiptId} — JL Beauty</title>
    <style>
        /* ── Reset ── */
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        /* ── Page thermique 80mm ── */
        @page {
            size: 80mm auto;
            margin: 0mm 2mm;
        }

        html, body {
            width: 76mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.45;
            color: #000;
            background: #fff;
        }

        .receipt {
            width: 76mm;
            padding: 4mm 2mm 6mm 2mm;
        }

        /* ── Séparateurs ── */
        .sep-solid  { border-top: 1.5px solid #000; margin: 5px 0; }
        .sep-dashed { border-top: 1.5px dashed #000; margin: 5px 0; }

        /* ── Header ── */
        .header { text-align: center; padding-bottom: 6px; }
        .logo   { font-size: 20px; font-weight: 900; letter-spacing: 3px; }
        .tagline { font-size: 9px; font-style: italic; margin: 2px 0; }
        .contact { font-size: 9px; line-height: 1.5; margin-top: 3px; }

        /* ── Infos vente ── */
        .info-table { width: 100%; margin: 5px 0; font-size: 10px; }
        .info-table td { padding: 1px 0; vertical-align: top; }
        .info-table td:last-child { text-align: right; font-weight: bold; word-break: break-all; }

        /* ── Tableau articles ── */
        .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        .items-table thead th {
            font-size: 10px;
            font-weight: bold;
            padding: 3px 0;
            border-bottom: 1px solid #000;
        }
        .items-table thead th:last-child { text-align: right; }

        .item-name   { font-size: 11px; font-weight: bold; padding-top: 5px; }
        .item-detail { font-size: 10px; color: #333; padding-bottom: 3px; padding-left: 4px; }
        .item-total  { font-size: 11px; font-weight: bold; text-align: right; vertical-align: bottom; padding-bottom: 3px; }

        /* ── Total ── */
        .total-block { margin: 4px 0; }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            padding: 4px 0;
            letter-spacing: 0.5px;
        }
        .cdf-equiv {
            text-align: right;
            font-size: 9px;
            color: #444;
            margin-top: -3px;
            margin-bottom: 3px;
        }

        /* ── Monnaie ── */
        .money-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 2px 0;
        }
        .money-change {
            font-size: 13px;
            font-weight: 900;
        }

        /* ── Paiement ── */
        .payment-mode {
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            margin: 5px 0 2px 0;
        }

        /* ── Type badge ── */
        .type-badge {
            display: inline-block;
            font-size: 9px;
            border: 1px solid #000;
            padding: 0px 4px;
            margin-top: 3px;
        }

        /* ── Footer ── */
        .footer {
            text-align: center;
            padding-top: 8px;
            font-size: 9px;
            line-height: 1.6;
        }
        .thank-you { font-size: 11px; font-weight: bold; margin-bottom: 3px; }

        /* ── Boutons (écran uniquement) ── */
        .print-buttons {
            text-align: center;
            padding: 12px 0 8px 0;
        }
        .btn-print {
            background: #E8B44C;
            color: #000;
            padding: 9px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            font-family: sans-serif;
        }
        .btn-close {
            background: #555;
            color: #fff;
            padding: 9px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: sans-serif;
            margin-left: 8px;
        }

        /* ── Impression : cacher les boutons, couper proprement ── */
        @media print {
            html, body { width: 80mm; }
            .print-buttons { display: none !important; }
            .receipt { padding-bottom: 10mm; }
        }
    </style>
</head>
<body>

<div class="receipt">

    <!-- ══ HEADER ══ -->
    <div class="header">
        <div class="logo">✂ JL BEAUTY</div>
        <div class="tagline">— Un univers à vivre —</div>
        <div class="contact">
            Kinshasa, République Démocratique du Congo<br>
            Tél : +243 XXX XXX XXX
        </div>
    </div>

    <div class="sep-dashed"></div>

    <!-- ══ INFOS ══ -->
    <table class="info-table">
        <tr>
            <td>Date :</td>
            <td>${formattedDate}</td>
        </tr>
        <tr>
            <td>Reçu N° :</td>
            <td>${receiptId}</td>
        </tr>
        <tr>
            <td>Client :</td>
            <td>${venteData.client_nom || venteData.client_telephone || 'Anonyme'}</td>
        </tr>
        ${venteData.client_nom && venteData.client_telephone ? `
        <tr>
            <td>Tél :</td>
            <td>${venteData.client_telephone}</td>
        </tr>` : ''}
        ${venteData.type === 'Service' && venteData.coiffeuse_nom ? `
        <tr>
            <td>Coiffeuse :</td>
            <td>${venteData.coiffeuse_nom}</td>
        </tr>` : ''}
        <tr>
            <td>Type :</td>
            <td><span class="type-badge">${venteData.type || 'Service'}</span></td>
        </tr>
    </table>

    <div class="sep-solid"></div>

    <!-- ══ ARTICLES ══ -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="text-align:left;">Article</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemsRows}
        </tbody>
    </table>

    <div class="sep-solid"></div>

    <!-- ══ TOTAL ══ -->
    <div class="total-block">
        <div class="total-row">
            <span>TOTAL</span>
            <span>${Utils.formatUSD(venteData.montant_total)}</span>
        </div>
        ${cdfHTML}
    </div>

    <!-- ══ MONNAIE ══ -->
    ${changeHTML}

    <!-- ══ MODE PAIEMENT ══ -->
    <div class="sep-dashed"></div>
    <div class="payment-mode">
        <span>Paiement :</span>
        <span><strong>${venteData.mode_paiement || 'Espèces'}</strong></span>
    </div>

    <!-- ══ FOOTER ══ -->
    <div class="sep-dashed"></div>
    <div class="footer">
        <div class="thank-you">Merci pour votre visite !</div>
        <div>À bientôt chez JL Beauty ✂</div>
        <div style="margin-top:4px;">★ ★ ★</div>
    </div>

</div>

<!-- Boutons écran uniquement -->
<div class="print-buttons">
    <button class="btn-print" onclick="window.print()">🖨 Imprimer</button>
    <button class="btn-close" onclick="window.close()">Fermer</button>
</div>

</body>
</html>`;

        return html;
    },

    // ─── Print ────────────────────────────────────────────────────────────────
    print(venteData) {
        const html = this.generate(venteData);
        const printWindow = window.open('', '_blank', 'width=340,height=650,scrollbars=yes');
        printWindow.document.write(html);
        printWindow.document.close();
        // Laisser le DOM se charger avant d'imprimer
        printWindow.onload = () => printWindow.focus();
    },

    // ─── Download ────────────────────────────────────────────────────────────
    download(venteData) {
        const html = this.generate(venteData);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `recu-${venteData.id ? venteData.id.substring(0, 8) : Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};