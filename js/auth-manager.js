// ============================================
// AUTH MANAGER — LOGS & MOT DE PASSE
// JL BEAUTY SYSTEM
// ============================================

const AuthManager = {

    // =========================================================================
    // ✅ showLogsModal()
    // Accessible uniquement au gérant/admin
    // Guard JS + RLS Supabase (double protection)
    // =========================================================================
    async showLogsModal() {

        // ── Guard rôle ───────────────────────────────────────────────────────
        if (!AuthSupabase.isGerant()) {
            App.showNotification('🔒 Accès réservé au gérant', 'error');
            return;
        }

        App.showLoading?.();
        let logs = [];

        try {
            const { data, error } = await AuthSupabase.supabase
                .from('connexion_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw new Error(error.message);
            logs = data || [];
        } catch (e) {
            App.hideLoading?.();
            App.showNotification('Erreur chargement des logs : ' + e.message, 'error');
            return;
        }

        App.hideLoading?.();

        // ── Helpers visuels ──────────────────────────────────────────────────
        const statutBadge = (s) => {
            const map = {
                succes:      'bg-green-100 text-green-800',
                echec:       'bg-red-100 text-red-800',
                deconnexion: 'bg-gray-100 text-gray-600',
            };
            const icon = {
                succes:      '✅',
                echec:       '❌',
                deconnexion: '🚪',
            };
            return `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded
                             text-xs font-medium
                             ${map[s] || 'bg-yellow-100 text-yellow-800'}">
                    ${icon[s] || '?'} ${s}
                </span>`;
        };

        const parseUA = (ua = '') => {
            if (!ua) return '—';
            if (ua.includes('Chrome'))  return '🌐 Chrome';
            if (ua.includes('Firefox')) return '🦊 Firefox';
            if (ua.includes('Safari'))  return '🧭 Safari';
            if (ua.includes('Edge'))    return '🔵 Edge';
            return ua.substring(0, 30) + '…';
        };

        // ── Statistiques rapides ─────────────────────────────────────────────
        const nbSucces      = logs.filter(l => l.statut === 'succes').length;
        const nbEchecs      = logs.filter(l => l.statut === 'echec').length;
        const nbDeconnexion = logs.filter(l => l.statut === 'deconnexion').length;

        // ── Lignes du tableau ────────────────────────────────────────────────
        const rows = logs.length === 0
            ? `<tr>
                   <td colspan="5" class="text-center py-8 text-gray-400">
                       <i class="fas fa-inbox text-3xl block mb-2"></i>
                       Aucun log disponible
                   </td>
               </tr>`
            : logs.map(l => `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                        ${new Date(l.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td class="px-4 py-2 text-sm font-medium">
                        ${l.email || '—'}
                    </td>
                    <td class="px-4 py-2">
                        ${statutBadge(l.statut)}
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-500 max-w-xs truncate"
                        title="${l.details || ''}">
                        ${l.details || '—'}
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-400">
                        ${parseUA(l.user_agent)}
                    </td>
                </tr>`).join('');

        // ── Contenu de la modale ─────────────────────────────────────────────
        const content = `
            <!-- Stats rapides -->
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-green-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-green-700">${nbSucces}</p>
                    <p class="text-xs text-gray-500 mt-1">✅ Connexions réussies</p>
                </div>
                <div class="bg-red-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-red-700">${nbEchecs}</p>
                    <p class="text-xs text-gray-500 mt-1">❌ Tentatives échouées</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-gray-600">${nbDeconnexion}</p>
                    <p class="text-xs text-gray-500 mt-1">🚪 Déconnexions</p>
                </div>
            </div>

            <!-- Tableau des logs -->
            <div class="overflow-x-auto max-h-[50vh] overflow-y-auto
                        rounded-lg border border-gray-200">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 sticky top-0 border-b">
                        <tr>
                            <th class="px-4 py-2 text-xs font-medium
                                       text-gray-500 uppercase">Date</th>
                            <th class="px-4 py-2 text-xs font-medium
                                       text-gray-500 uppercase">Email</th>
                            <th class="px-4 py-2 text-xs font-medium
                                       text-gray-500 uppercase">Statut</th>
                            <th class="px-4 py-2 text-xs font-medium
                                       text-gray-500 uppercase">Détails</th>
                            <th class="px-4 py-2 text-xs font-medium
                                       text-gray-500 uppercase">Navigateur</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;

        const modal = Utils.createModal(
            '<i class="fas fa-history mr-2 text-purple-500"></i>' +
            'Journal de connexion',
            content,
            null
        );
        document.body.appendChild(modal);
    },

    // =========================================================================
    // ✅ showChangePasswordModal()
    // =========================================================================
    showChangePasswordModal() {
        const content = `
            <form id="change-pwd-form" class="space-y-4" onsubmit="return false">

                <!-- Info règles -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg
                            p-3 text-sm text-blue-800">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Minimum <strong>8 caractères</strong>,
                    <strong>1 majuscule</strong> et
                    <strong>1 chiffre</strong>.
                </div>

                <!-- Mot de passe actuel -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel *
                    </label>
                    <div class="relative">
                        <input type="password" id="pwd-current"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm pr-10"
                               placeholder="••••••••"
                               autocomplete="current-password">
                        <button type="button"
                                onclick="AuthManager.togglePwd('pwd-current', this)"
                                class="absolute right-3 top-2.5 text-gray-400
                                       hover:text-gray-600">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                </div>

                <!-- Nouveau mot de passe -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe *
                    </label>
                    <div class="relative">
                        <input type="password" id="pwd-new"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm pr-10"
                               placeholder="••••••••"
                               autocomplete="new-password"
                               oninput="AuthManager.checkStrength(this.value)">
                        <button type="button"
                                onclick="AuthManager.togglePwd('pwd-new', this)"
                                class="absolute right-3 top-2.5 text-gray-400
                                       hover:text-gray-600">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                    <!-- Jauge de force -->
                    <div class="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div id="pwd-strength-fill"
                             class="h-full rounded-full transition-all
                                    duration-300 w-0 bg-red-500"></div>
                    </div>
                    <p id="pwd-strength-label" class="text-xs text-gray-400 mt-1"></p>
                </div>

                <!-- Confirmer mot de passe -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe *
                    </label>
                    <div class="relative">
                        <input type="password" id="pwd-confirm"
                               class="w-full px-3 py-2 border border-gray-300
                                      rounded-lg text-sm pr-10"
                               placeholder="••••••••"
                               autocomplete="new-password">
                        <button type="button"
                                onclick="AuthManager.togglePwd('pwd-confirm', this)"
                                class="absolute right-3 top-2.5 text-gray-400
                                       hover:text-gray-600">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                </div>

                <!-- Message d'erreur inline -->
                <div id="pwd-error"
                     class="hidden bg-red-50 border border-red-200 rounded-lg
                            p-3 text-sm text-red-700"></div>

            </form>`;

        const modal = Utils.createModal(
            '<i class="fas fa-key mr-2 text-purple-500"></i>' +
            'Changer le mot de passe',
            content,
            () => AuthManager.submitChangePassword(modal)
        );
        document.body.appendChild(modal);
    },

    // =========================================================================
    // ✅ submitChangePassword() — CORRIGÉ
    // =========================================================================
    async submitChangePassword(modal) {
        const errEl = document.getElementById('pwd-error');
        errEl?.classList.add('hidden');

        const currentPassword = document.getElementById('pwd-current')?.value;
        const newPassword     = document.getElementById('pwd-new')?.value;
        const confirmPassword = document.getElementById('pwd-confirm')?.value;

        try {
            // ── Validations ──────────────────────────────────────────────────
            if (!currentPassword || !newPassword || !confirmPassword)
                throw new Error('Tous les champs sont obligatoires.');
            if (newPassword !== confirmPassword)
                throw new Error('Les deux nouveaux mots de passe ne correspondent pas.');
            if (newPassword.length < 8)
                throw new Error('Minimum 8 caractères requis.');
            if (!/[A-Z]/.test(newPassword))
                throw new Error('Au moins une majuscule est requise.');
            if (!/[0-9]/.test(newPassword))
                throw new Error('Au moins un chiffre est requis.');
            if (newPassword === currentPassword)
                throw new Error("Le nouveau mot de passe doit être différent de l'ancien.");

            App.showLoading?.();

            // ✅ Bloquer le listener auth pendant toute l'opération
            AuthSupabase._changingPassword = true;
            console.log('[Auth] _changingPassword = true');

            // ── Vérifier l'ancien mot de passe (re-login silencieux) ─────────
            const { data: { user } } = await AuthSupabase.supabase.auth.getUser();
            if (!user) throw new Error('Session expirée, reconnectez-vous.');

            const { error: verifyError } =
                await AuthSupabase.supabase.auth.signInWithPassword({
                    email:    user.email,
                    password: currentPassword,
                });
            if (verifyError)
                throw new Error('Mot de passe actuel incorrect.');

            // ── Appliquer le nouveau mot de passe ────────────────────────────
            const { error: updateError } =
                await AuthSupabase.supabase.auth.updateUser({
                    password: newPassword,
                });
            if (updateError) throw new Error(updateError.message);

            // ── Mettre à jour le cache offline avec le nouveau mot de passe ──
            await AuthSupabase._cacheSession(user.email, newPassword, AuthSupabase.currentUser);

            // ── Log de l'événement ───────────────────────────────────────────
            await AuthSupabase._logConnexion({
                userId:  user.id,
                email:   user.email,
                statut:  'succes',
                details: 'Changement de mot de passe',
            });

            App.hideLoading?.();
            if (modal?.parentNode) modal.parentNode.removeChild(modal);
            App.showNotification('✅ Mot de passe mis à jour avec succès !', 'success');

        } catch (err) {
            App.hideLoading?.();
            if (errEl) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
            }
        } finally {
            // ✅ Toujours libérer le flag, même en cas d'erreur
            AuthSupabase._changingPassword = false;
            console.log('[Auth] _changingPassword = false');
        }
    },

    // =========================================================================
    // ✅ togglePwd()
    // =========================================================================
    togglePwd(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon  = btn?.querySelector('i');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'fas fa-eye-slash text-sm';
        } else {
            input.type = 'password';
            if (icon) icon.className = 'fas fa-eye text-sm';
        }
    },

    // =========================================================================
    // ✅ checkStrength()
    // =========================================================================
    checkStrength(pwd) {
        let score = 0;
        if (pwd.length >= 8)          score++;
        if (pwd.length >= 12)         score++;
        if (/[A-Z]/.test(pwd))        score++;
        if (/[0-9]/.test(pwd))        score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        const fill  = document.getElementById('pwd-strength-fill');
        const label = document.getElementById('pwd-strength-label');
        if (!fill || !label) return;

        const levels = [
            { pct: '20%',  color: 'bg-red-500',    text: '🔴 Très faible' },
            { pct: '40%',  color: 'bg-orange-500',  text: '🟠 Faible'      },
            { pct: '60%',  color: 'bg-yellow-400',  text: '🟡 Moyen'       },
            { pct: '80%',  color: 'bg-blue-500',    text: '🔵 Fort'        },
            { pct: '100%', color: 'bg-green-500',   text: '🟢 Très fort'   },
        ];
        const lvl         = levels[Math.min(score, 4)];
        fill.style.width  = lvl.pct;
        fill.className    = `h-full rounded-full transition-all duration-300 ${lvl.color}`;
        label.textContent = lvl.text;
    },
};

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
    console.log('✅ AuthManager loaded and ready');
}