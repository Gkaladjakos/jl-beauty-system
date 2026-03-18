// Configuration des devises
const CurrencyConfig = {
    // Devise principale du système
    baseCurrency: 'USD',
    
    // Devise secondaire (optionnelle)
    secondaryCurrency: 'CDF',
    
    // Taux de change (1 USD = X CDF)
    // Modifiable dans les paramètres
    exchangeRate: 2800, // 1 USD = 2800 CDF (taux exemple, ajustable)
    
    // Symboles des devises
    symbols: {
        USD: '$',
        CDF: 'FC'
    },
    
    // Position du symbole
    symbolPosition: {
        USD: 'before', // $100
        CDF: 'after'   // 280000 FC
    },
    
    // Séparateurs
    separators: {
        USD: {
            decimal: '.',
            thousands: ','
        },
        CDF: {
            decimal: ',',
            thousands: ' '
        }
    },
    
    // Nombre de décimales
    decimals: {
        USD: 2,
        CDF: 0
    },
    
    // Préférence utilisateur (stockée dans localStorage)
    getUserPreference() {
        return localStorage.getItem('preferredCurrency') || this.baseCurrency;
    },
    
    setUserPreference(currency) {
        if (currency === 'USD' || currency === 'CDF') {
            localStorage.setItem('preferredCurrency', currency);
            return true;
        }
        return false;
    },
    
    // Mise à jour du taux de change
    updateExchangeRate(newRate) {
        if (newRate > 0) {
            this.exchangeRate = newRate;
            localStorage.setItem('exchangeRate', newRate.toString());
            return true;
        }
        return false;
    },
    
    // Récupération du taux stocké
    loadExchangeRate() {
        const stored = localStorage.getItem('exchangeRate');
        if (stored) {
            this.exchangeRate = parseFloat(stored);
        }
    },
    
    // Conversion USD → CDF
    convertToCDF(amountUSD) {
        return amountUSD * this.exchangeRate;
    },
    
    // Conversion CDF → USD
    convertToUSD(amountCDF) {
        return amountCDF / this.exchangeRate;
    },
    
    // Formatage d'un montant dans la devise choisie
    format(amount, currency = null) {
        const curr = currency || this.getUserPreference();
        const config = {
            symbol: this.symbols[curr],
            position: this.symbolPosition[curr],
            decimal: this.separators[curr].decimal,
            thousands: this.separators[curr].thousands,
            decimals: this.decimals[curr]
        };
        
        // Arrondir selon les décimales
        const rounded = parseFloat(amount).toFixed(config.decimals);
        
        // Séparer partie entière et décimale
        const [intPart, decPart] = rounded.split('.');
        
        // Ajouter les séparateurs de milliers
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousands);
        
        // Construire le nombre formaté
        let formatted = formattedInt;
        if (config.decimals > 0 && decPart) {
            formatted += config.decimal + decPart;
        }
        
        // Ajouter le symbole
        if (config.position === 'before') {
            return config.symbol + formatted;
        } else {
            return formatted + ' ' + config.symbol;
        }
    },
    
    // Formatage avec les DEUX devises
    formatBoth(amountUSD) {
        const usdFormatted = this.format(amountUSD, 'USD');
        const cdfAmount = this.convertToCDF(amountUSD);
        const cdfFormatted = this.format(cdfAmount, 'CDF');
        
        const preferred = this.getUserPreference();
        
        if (preferred === 'USD') {
            return `${usdFormatted} <span class="text-gray-500 text-sm">(≈ ${cdfFormatted})</span>`;
        } else {
            return `${cdfFormatted} <span class="text-gray-500 text-sm">(≈ ${usdFormatted})</span>`;
        }
    },
    
    // Initialisation
    init() {
        this.loadExchangeRate();
    }
};

// Initialiser au chargement
CurrencyConfig.init();
