// Main Application Controller
const App = {
    currentPage: 'dashboard',
    
    init() {
        this.setupNavigation();
        this.loadPage('dashboard');
    },
    
    setupNavigation() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.loadPage(page);
                
                // Update active state
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },
    
    loadPage(page) {
        this.currentPage = page;
        const contentArea = document.getElementById('content-area');
        
        switch(page) {
            case 'dashboard':
                this.updateHeader('Tableau de bord', 'Vue d\'ensemble de votre salon');
                Dashboard.render(contentArea);
                break;
            case 'clients':
                this.updateHeader('Gestion des Clients', 'Gérer vos clients et leur fidélité');
                Clients.render(contentArea);
                break;
            case 'coiffeuses':
                this.updateHeader('Gestion des Coiffeuses', 'Gérer votre équipe et leurs performances');
                Coiffeuses.render(contentArea);
                break;
            case 'services':
                this.updateHeader('Catalogue de Services', 'Gérer vos services et tarifs');
                Services.render(contentArea);
                break;
            case 'rendez-vous':
                this.updateHeader('Gestion des Rendez-vous', 'Planifier et gérer les rendez-vous');
                RendezVous.render(contentArea);
                break;
            case 'produits':
                this.updateHeader('Gestion des Produits', 'Gérer votre stock et vos ventes');
                if (typeof ProduitsV3 !== 'undefined') {
                    ProduitsV3.render(contentArea);
                } else {
                    Produits.render(contentArea);
                }
                break;
            case 'materiels':
                this.updateHeader('Gestion des Matériels', 'Gérer vos équipements et maintenance');
                Materiels.render(contentArea);
                break;
            case 'consommables':
                this.updateHeader('Gestion des Consommables', 'Gérer le stock des produits consommés');
                Consommables.render(contentArea);
                break;
            case 'ventes':
                this.updateHeader('Gestion des Ventes', 'Enregistrer et suivre les ventes');
                if (typeof VentesV4 !== 'undefined') {
                    VentesV4.render(contentArea);
                } else {
                    Ventes.render(contentArea);
                }
                break;
            case 'commissions':
                this.updateHeader('Calcul des Commissions', 'Gérer les commissions des coiffeuses');
                if (typeof CommissionsV3 !== 'undefined') {
                    CommissionsV3.render(contentArea);
                } else {
                    Commissions.render(contentArea);
                }
                break;
        }
    },
    
    updateHeader(title, subtitle) {
        document.getElementById('page-title').textContent = title;
        document.getElementById('page-subtitle').textContent = subtitle;
    },
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    },
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    },
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
