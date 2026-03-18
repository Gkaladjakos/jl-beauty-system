// Thermal Printer Receipt Component
const ThermalReceipt = {
    // Generate receipt HTML for thermal printer
    generate(venteData) {
        const date = new Date(venteData.date_vente);
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
        
        let itemsHTML = '';
        let total = 0;
        
        // Handle multi-items or single item
        if (venteData.items && Array.isArray(venteData.items)) {
            venteData.items.forEach(item => {
                const subtotal = item.prix_unitaire * (item.quantite || 1);
                total += subtotal;
                itemsHTML += `
                    <tr>
                        <td class="py-1">${item.item_nom || item.service_nom || item.nom}</td>
                        <td class="text-center">${item.quantite || 1}</td>
                        <td class="text-right">${Utils.formatCurrency(item.prix_unitaire)}</td>
                        <td class="text-right font-bold">${Utils.formatCurrency(subtotal)}</td>
                    </tr>
                `;
            });
        } else {
            const subtotal = venteData.prix_unitaire * (venteData.quantite || 1);
            total = venteData.montant_total;
            itemsHTML = `
                <tr>
                    <td class="py-1">${venteData.item_nom}</td>
                    <td class="text-center">${venteData.quantite || 1}</td>
                    <td class="text-right">${Utils.formatCurrency(venteData.prix_unitaire)}</td>
                    <td class="text-right font-bold">${Utils.formatCurrency(subtotal)}</td>
                </tr>
            `;
        }
        
        // Calculate change if montant_percu exists
        let changeHTML = '';
        if (venteData.montant_percu) {
            const change = venteData.montant_percu - venteData.montant_total;
            changeHTML = `
                <div class="border-t-2 border-dashed border-gray-400 mt-4 pt-3">
                    <div class="flex justify-between text-base mb-1">
                        <span>Montant perçu:</span>
                        <span class="font-bold">${Utils.formatCurrency(venteData.montant_percu)}</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold">
                        <span>Monnaie à rendre:</span>
                        <span>${Utils.formatCurrency(change)}</span>
                    </div>
                </div>
            `;
        }
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reçu - JL Beauty</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 10mm;
            width: 80mm;
            color: #000;
        }
        
        .receipt {
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .tagline {
            font-size: 10px;
            font-style: italic;
            margin-bottom: 5px;
        }
        
        .contact {
            font-size: 10px;
            margin-top: 5px;
        }
        
        .info {
            margin: 10px 0;
            font-size: 11px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        
        .items {
            margin: 10px 0;
            border-top: 2px dashed #000;
            border-bottom: 2px dashed #000;
            padding: 10px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            text-align: left;
            font-size: 11px;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
        }
        
        td {
            font-size: 11px;
            padding: 3px 0;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .total {
            margin-top: 10px;
            border-top: 2px solid #000;
            padding-top: 10px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .payment-info {
            margin-top: 10px;
            font-size: 11px;
        }
        
        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 10px;
        }
        
        .thank-you {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
            button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- Header -->
        <div class="header">
            <div class="logo">JL BEAUTY</div>
            <div class="tagline">Un univers à vivre</div>
            <div class="contact">
                Kinshasa, RDC<br>
                Tél: +243 XXX XXX XXX
            </div>
        </div>
        
        <!-- Info -->
        <div class="info">
            <div class="info-row">
                <span>Date:</span>
                <span>${formattedDate}</span>
            </div>
            <div class="info-row">
                <span>Reçu N°:</span>
                <span>${venteData.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="info-row">
                <span>Client:</span>
                <span>${venteData.client_nom || venteData.client_telephone}</span>
            </div>
            ${venteData.type === 'Service' && venteData.coiffeuse_nom ? `
            <div class="info-row">
                <span>Coiffeuse:</span>
                <span>${venteData.coiffeuse_nom}</span>
            </div>
            ` : ''}
        </div>
        
        <!-- Items -->
        <div class="items">
            <table>
                <thead>
                    <tr>
                        <th>Article</th>
                        <th class="text-center">Qté</th>
                        <th class="text-right">P.U.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <!-- Total -->
        <div class="total">
            <div class="total-row">
                <span>TOTAL:</span>
                <span>${Utils.formatCurrency(venteData.montant_total)}</span>
            </div>
        </div>
        
        <!-- Payment & Change -->
        ${changeHTML}
        
        <div class="payment-info">
            <div class="info-row">
                <span>Mode de paiement:</span>
                <span>${venteData.mode_paiement}</span>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="thank-you">Merci de votre visite !</div>
            <div>À bientôt chez JL Beauty</div>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; padding: 20px;">
        <button onclick="window.print()" 
                style="background: #E8B44C; color: #000; padding: 12px 24px; 
                       border: none; border-radius: 5px; cursor: pointer; 
                       font-size: 14px; font-weight: bold;">
            <i class="fas fa-print"></i> Imprimer
        </button>
        <button onclick="window.close()" 
                style="background: #666; color: #fff; padding: 12px 24px; 
                       border: none; border-radius: 5px; cursor: pointer; 
                       font-size: 14px; margin-left: 10px;">
            Fermer
        </button>
    </div>
</body>
</html>
        `;
        
        return html;
    },
    
    // Print receipt
    print(venteData) {
        const html = this.generate(venteData);
        const printWindow = window.open('', '_blank', 'width=320,height=600');
        printWindow.document.write(html);
        printWindow.document.close();
    },
    
    // Download receipt as HTML
    download(venteData) {
        const html = this.generate(venteData);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recu-${venteData.id.substring(0, 8)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
