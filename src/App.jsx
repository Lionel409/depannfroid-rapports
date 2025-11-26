import React, { useState, useRef, useEffect } from 'react';
import SignatureRapport from './SignatureRapport';

// ============================================
// SYSTÈME DE RAPPORTS AUTOMATISÉS DEPANN'FROID
// Version 3.0 - Avec intégration Google Sheets
// ============================================

// URL de l'API Google Apps Script
const API_URL = '/api/proxy';

// Types d'équipements et fluides
const TYPES_EQUIPEMENTS = [
  'Chambre froide positive', 'Chambre froide négative', 'Vitrine réfrigérée',
  'Climatisation split', 'Climatisation gainable', 'Groupe de condensation',
  'Centrale frigorifique', 'Machine à glace', 'Congélateur professionnel', 'Autre'
];

const FLUIDES = ['R-134a', 'R-404A', 'R-410A', 'R-32', 'R-290', 'R-600a', 'R-744 (CO2)', 'R-407C', 'R-22 (ancien)'];

// Tarifs par défaut (XPF)
const TARIFS_DEFAUT = {
  mainOeuvre: 8000,
  deplacement: 3500,
  deplacementTahiti: 8500
};

// Génération automatique du diagnostic
const genererDiagnosticAuto = (notes) => {
  if (!notes) return '';
  let diagnostic = '';
  const notesLower = notes.toLowerCase();
  
  if (notesLower.includes('fuite') || notesLower.includes('manque gaz')) {
    diagnostic += 'Défaut d\'étanchéité du circuit frigorifique détecté. ';
  }
  if (notesLower.includes('givr') || notesLower.includes('glace')) {
    diagnostic += 'Givrage anormal de l\'évaporateur constaté - possible obstruction du dégivrage ou manque de fluide. ';
  }
  if (notesLower.includes('bruit') || notesLower.includes('vibr')) {
    diagnostic += 'Anomalie mécanique détectée au niveau du compresseur ou des ventilateurs. ';
  }
  if (notesLower.includes('chaud') || notesLower.includes('temp')) {
    diagnostic += 'Température de fonctionnement hors plage nominale. ';
  }
  if (notesLower.includes('électr') || notesLower.includes('disjonct')) {
    diagnostic += 'Défaut électrique identifié - vérification des protections nécessaire. ';
  }
  
  return diagnostic || 'Diagnostic à compléter suite à l\'analyse des paramètres relevés.';
};

// Utilitaires
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num || 0);
};

const getTypeLabel = (type) => {
  const labels = {
    'maintenance': 'MAINTENANCE PRÉVENTIVE',
    'depannage': 'DÉPANNAGE',
    'installation': 'INSTALLATION',
    'mise_en_service': 'MISE EN SERVICE'
  };
  return labels[type] || type?.toUpperCase() || '';
};

export default function RapportAutomatise() {
  const [activeTab, setActiveTab] = useState('saisie');
  const [logoUrl, setLogoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [clients, setClients] = useState([]);
  const rapportRef = useRef(null);
  
  const [config, setConfig] = useState({
    nomEntreprise: "DEPANN'FROID",
    sousNom: "Installation & Maintenance Frigorifique",
    adresse: "Moorea, Polynésie française",
    telephone: "+689 87 XX XX XX",
    email: "contact@depannfroid.pf",
    numeroTahiti: "N° TAHITI: XXXXXX",
    numeroRC: "N° RC: 061640 A",
    rcs: "RCS Papeete: 061640 A"
  });

  const [rapport, setRapport] = useState({
    numeroRapport: `RI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    dateIntervention: new Date().toISOString().split('T')[0],
    heureDebut: '08:00',
    heureFin: '10:00',
    technicien: 'Lionel',
    client: '',
    adresseClient: '',
    telClient: '',
    emailClient: '',
    contactSite: '',
    typeEquipement: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    fluide: 'R-410A',
    puissance: '',
    localisation: '',
    typeIntervention: 'maintenance',
    motifAppel: '',
    constatArrivee: '',
    diagnostic: '',
    travauxRealises: '',
    mesures: {
      pressionHP: '', pressionBP: '', surchauffe: '', sousRefroid: '',
      tempEvap: '', tempCond: '', tempAmbiance: '', intensite: ''
    },
    piecesUtilisees: '',
    recommandations: '',
    prochaineVisite: '',
    urgence: 'normale'
  });

  const [lignesFacture, setLignesFacture] = useState([]);
  const [creerFacture, setCreerFacture] = useState(true);
  const [envoyerEmail, setEnvoyerEmail] = useState(true);

  useEffect(() => {
    chargerClients();
  }, []);

  const chargerClients = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_clients' })
      });
      const result = await response.json();
      if (result.success) {
        setClients(result.data || []);
      }
    } catch (error) {
      console.log('Clients non chargés (mode hors ligne)');
    }
  };

  const updateRapport = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setRapport(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setRapport(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateConfig = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const selectionnerClient = (clientNom) => {
    const client = clients.find(c => c.nom === clientNom);
    if (client) {
      setRapport(prev => ({
        ...prev,
        client: client.nom,
        adresseClient: client.adresse || '',
        telClient: client.telephone || '',
        emailClient: client.email || '',
        contactSite: client.contact || ''
      }));
    }
  };

  const handleGenererDiagnostic = () => {
    const diagnostic = genererDiagnosticAuto(rapport.constatArrivee);
    updateRapport('diagnostic', diagnostic);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const ajouterLigneFacture = (type = 'service') => {
    setLignesFacture(prev => [...prev, {
      id: Date.now(),
      description: '',
      quantite: 1,
      prixUnitaire: type === 'service' ? TARIFS_DEFAUT.mainOeuvre : 0,
      type: type
    }]);
  };

  const updateLigneFacture = (id, field, value) => {
    setLignesFacture(prev => prev.map(ligne => 
      ligne.id === id ? { ...ligne, [field]: value } : ligne
    ));
  };

  const supprimerLigneFacture = (id) => {
    setLignesFacture(prev => prev.filter(ligne => ligne.id !== id));
  };

  const calculerTotaux = () => {
    let htFournitures = 0;
    let htServices = 0;
    
    lignesFacture.forEach(ligne => {
      const montant = ligne.quantite * ligne.prixUnitaire;
      if (ligne.type === 'fourniture') {
        htFournitures += montant;
      } else {
        htServices += montant;
      }
    });
    
    const tvaFournitures = htFournitures * 0.16;
    const tvaServices = htServices * 0.13;
    const totalHT = htFournitures + htServices;
    const totalTVA = tvaFournitures + tvaServices;
    const totalTTC = totalHT + totalTVA;
    
    return { htFournitures, htServices, tvaFournitures, tvaServices, totalHT, totalTVA, totalTTC };
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const lancerWorkflowComplet = async () => {
    if (!rapport.client) {
      showNotification('Veuillez renseigner le nom du client', 'error');
      return;
    }
    
    if (envoyerEmail && !rapport.emailClient) {
      showNotification('Email client requis pour l\'envoi automatique', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'workflow_complet',
          rapport: rapport,
          lignesFacture: creerFacture ? lignesFacture : [],
          envoyerEmail: envoyerEmail
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        let message = `✅ Rapport ${data.rapport.id} sauvegardé !`;
        
        if (data.facture) {
          message += `\n📄 Facture ${data.facture.id} créée (${formatNumber(data.facture.totalTTC)} XPF)`;
        }
        
        if (data.emailEnvoye) {
          message += `\n📧 Email envoyé à ${rapport.emailClient}`;
        }
        
        showNotification(message, 'success');
        resetFormulaire();
        
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
      
    } catch (error) {
      console.error('Erreur workflow:', error);
      const errorMsg = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
      showNotification(`❌ Erreur: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sauvegarderLocal = () => {
    const rapports = JSON.parse(localStorage.getItem('rapports_hors_ligne') || '[]');
    rapports.push({
      ...rapport,
      lignesFacture,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('rapports_hors_ligne', JSON.stringify(rapports));
    showNotification('💾 Rapport sauvegardé localement (mode hors ligne)', 'info');
  };

  const genererPDFLocal = () => {
    window.print();
  };

  const resetFormulaire = () => {
    setRapport({
      numeroRapport: `RI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      dateIntervention: new Date().toISOString().split('T')[0],
      heureDebut: '08:00',
      heureFin: '10:00',
      technicien: rapport.technicien,
      client: '', adresseClient: '', telClient: '', emailClient: '', contactSite: '',
      typeEquipement: '', marque: '', modele: '', numeroSerie: '', fluide: 'R-410A',
      puissance: '', localisation: '', typeIntervention: 'maintenance',
      motifAppel: '', constatArrivee: '', diagnostic: '', travauxRealises: '',
      mesures: { pressionHP: '', pressionBP: '', surchauffe: '', sousRefroid: '', tempEvap: '', tempCond: '', tempAmbiance: '', intensite: '' },
      piecesUtilisees: '', recommandations: '', prochaineVisite: '', urgence: 'normale'
    });
    setLignesFacture([]);
  };

  const totaux = calculerTotaux();

  return (
    <div className="min-h-screen bg-gray-100">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <pre className="whitespace-pre-wrap text-sm">{notification.message}</pre>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold">Traitement en cours...</p>
            <p className="text-sm text-gray-500">Sauvegarde, génération PDF, envoi email...</p>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold">DF</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{config.nomEntreprise}</h1>
                <p className="text-blue-200 text-sm">Système de rapports automatisés v3.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-500 rounded-full text-sm">
                ⚡ Connecté Google Sheets
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'saisie', label: '📝 Saisie' },
              { id: 'facturation', label: '💰 Facturation' },
              { id: 'apercu', label: '👁️ Aperçu' },
              { id: 'config', label: '⚙️ Config' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 font-medium transition ${
                  activeTab === tab.id
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {activeTab === 'saisie' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">📋 Informations générales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Rapport</label>
                  <input type="text" value={rapport.numeroRapport} onChange={(e) => updateRapport('numeroRapport', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" value={rapport.dateIntervention} onChange={(e) => updateRapport('dateIntervention', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure début</label>
                  <input type="time" value={rapport.heureDebut} onChange={(e) => updateRapport('heureDebut', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure fin</label>
                  <input type="time" value={rapport.heureFin} onChange={(e) => updateRapport('heureFin', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">🏢 Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client *</label>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      value={rapport.client} 
                      onChange={(e) => updateRapport('client', e.target.value)} 
                      placeholder="Nom du client" 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      list="clients-list"
                    />
                    <datalist id="clients-list">
                      {clients.map(c => <option key={c.nom} value={c.nom} />)}
                    </datalist>
                    {clients.length > 0 && (
                      <select onChange={(e) => selectionnerClient(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                        <option value="">Clients récents...</option>
                        {clients.slice(0, 10).map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact sur site</label>
                  <input type="text" value={rapport.contactSite} onChange={(e) => updateRapport('contactSite', e.target.value)} placeholder="Responsable" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <input type="text" value={rapport.adresseClient} onChange={(e) => updateRapport('adresseClient', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input type="tel" value={rapport.telClient} onChange={(e) => updateRapport('telClient', e.target.value)} placeholder="+689 XX XX XX XX" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email client 
                    <span className="text-blue-600 text-xs ml-2">(requis pour envoi automatique)</span>
                  </label>
                  <input type="email" value={rapport.emailClient} onChange={(e) => updateRapport('emailClient', e.target.value)} placeholder="client@email.com" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">⚙️ Équipement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select value={rapport.typeEquipement} onChange={(e) => updateRapport('typeEquipement', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionner...</option>
                    {TYPES_EQUIPEMENTS.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marque</label>
                  <input type="text" value={rapport.marque} onChange={(e) => updateRapport('marque', e.target.value)} placeholder="Carrier, Daikin..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modèle</label>
                  <input type="text" value={rapport.modele} onChange={(e) => updateRapport('modele', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Série</label>
                  <input type="text" value={rapport.numeroSerie} onChange={(e) => updateRapport('numeroSerie', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fluide</label>
                  <select value={rapport.fluide} onChange={(e) => updateRapport('fluide', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                    {FLUIDES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localisation</label>
                  <input type="text" value={rapport.localisation} onChange={(e) => updateRapport('localisation', e.target.value)} placeholder="Cuisine, Terrasse..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">🔧 Intervention</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'depannage', label: 'Dépannage' },
                    { value: 'installation', label: 'Installation' },
                    { value: 'mise_en_service', label: 'Mise en service' }
                  ].map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="typeIntervention" value={type.value} checked={rapport.typeIntervention === type.value} onChange={(e) => updateRapport('typeIntervention', e.target.value)} className="text-blue-600" />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Motif d'appel</label>
                  <textarea value={rapport.motifAppel} onChange={(e) => updateRapport('motifAppel', e.target.value)} rows={2} placeholder="La chambre froide ne fait plus de froid..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Constat à l'arrivée</label>
                  <textarea value={rapport.constatArrivee} onChange={(e) => updateRapport('constatArrivee', e.target.value)} rows={3} placeholder="Vos notes de terrain..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={handleGenererDiagnostic} className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                    ✨ Générer diagnostic auto
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnostic</label>
                  <textarea value={rapport.diagnostic} onChange={(e) => updateRapport('diagnostic', e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Travaux réalisés</label>
                  <textarea value={rapport.travauxRealises} onChange={(e) => updateRapport('travauxRealises', e.target.value)} rows={3} placeholder="Détaillez les travaux..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">📊 Mesures</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'pressionHP', label: 'Pression HP (bar)' },
                  { key: 'pressionBP', label: 'Pression BP (bar)' },
                  { key: 'surchauffe', label: 'Surchauffe (K)' },
                  { key: 'sousRefroid', label: 'Sous-refroid. (K)' },
                  { key: 'tempEvap', label: 'T° évap (°C)' },
                  { key: 'tempCond', label: 'T° cond (°C)' },
                  { key: 'tempAmbiance', label: 'T° ambiance (°C)' },
                  { key: 'intensite', label: 'Intensité (A)' }
                ].map(m => (
                  <div key={m.key}>
                    <label className="block text-sm font-medium text-gray-700">{m.label}</label>
                    <input type="text" value={rapport.mesures[m.key]} onChange={(e) => updateRapport(`mesures.${m.key}`, e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">📦 Pièces & Recommandations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pièces utilisées</label>
                  <textarea value={rapport.piecesUtilisees} onChange={(e) => updateRapport('piecesUtilisees', e.target.value)} rows={2} placeholder="1x Filtre, 500g R-410A..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recommandations</label>
                  <textarea value={rapport.recommandations} onChange={(e) => updateRapport('recommandations', e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prochaine visite</label>
                    <input type="date" value={rapport.prochaineVisite} onChange={(e) => updateRapport('prochaineVisite', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Urgence</label>
                    <select value={rapport.urgence} onChange={(e) => updateRapport('urgence', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="normale">✅ Normale</option>
                      <option value="importante">⚠️ À surveiller</option>
                      <option value="critique">🔴 Critique</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'facturation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">⚙️ Options d'envoi</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={creerFacture} onChange={(e) => setCreerFacture(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                  <span>📄 Créer une facture</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={envoyerEmail} onChange={(e) => setEnvoyerEmail(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                  <span>📧 Envoyer par email au client</span>
                </label>
              </div>
              {envoyerEmail && !rapport.emailClient && (
                <p className="mt-2 text-sm text-orange-600">⚠️ Email client non renseigné - retournez à l'onglet Saisie</p>
              )}
            </div>

            {creerFacture && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-700">💰 Lignes de facturation</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => ajouterLigneFacture('service')} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200">
                      + Service (TVA 13%)
                    </button>
                    <button type="button" onClick={() => ajouterLigneFacture('fourniture')} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                      + Fourniture (TVA 16%)
                    </button>
                  </div>
                </div>

                {lignesFacture.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune ligne de facturation. Cliquez sur les boutons ci-dessus pour ajouter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2">Description</th>
                          <th className="text-center p-2 w-20">Type</th>
                          <th className="text-right p-2 w-20">Qté</th>
                          <th className="text-right p-2 w-28">Prix unit.</th>
                          <th className="text-right p-2 w-28">Total HT</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignesFacture.map(ligne => (
                          <tr key={ligne.id} className="border-b">
                            <td className="p-2">
                              <input
                                type="text"
                                value={ligne.description}
                                onChange={(e) => updateLigneFacture(ligne.id, 'description', e.target.value)}
                                placeholder="Description..."
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                ligne.type === 'fourniture' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {ligne.type === 'fourniture' ? '16%' : '13%'}
                              </span>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={ligne.quantite}
                                onChange={(e) => updateLigneFacture(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm text-right"
                                min="0"
                                step="0.5"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={ligne.prixUnitaire}
                                onChange={(e) => updateLigneFacture(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm text-right"
                                min="0"
                              />
                            </td>
                            <td className="p-2 text-right font-semibold">
                              {formatNumber(ligne.quantite * ligne.prixUnitaire)} XPF
                            </td>
                            <td className="p-2">
                              <button type="button" onClick={() => supprimerLigneFacture(ligne.id)} className="text-red-500 hover:text-red-700">
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {lignesFacture.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <div className="w-80 bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">HT Fournitures</span>
                          <span>{formatNumber(totaux.htFournitures)} XPF</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>TVA 16%</span>
                          <span>{formatNumber(totaux.tvaFournitures)} XPF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">HT Services</span>
                          <span>{formatNumber(totaux.htServices)} XPF</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>TVA 13%</span>
                          <span>{formatNumber(totaux.tvaServices)} XPF</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total HT</span>
                          <span>{formatNumber(totaux.totalHT)} XPF</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Total TVA</span>
                          <span>{formatNumber(totaux.totalTVA)} XPF</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg font-bold text-blue-700">
                          <span>TOTAL TTC</span>
                          <span>{formatNumber(totaux.totalTTC)} XPF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">📋 Récapitulatif de l'envoi</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>✅ Rapport d'intervention <strong>{rapport.numeroRapport}</strong></li>
                {creerFacture && lignesFacture.length > 0 && (
                  <li>✅ Facture de <strong>{formatNumber(totaux.totalTTC)} XPF</strong></li>
                )}
                {envoyerEmail && rapport.emailClient && (
                  <li>✅ Envoi email à <strong>{rapport.emailClient}</strong></li>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'apercu' && (
          <div ref={rapportRef} className="bg-white p-8 shadow-lg max-w-4xl mx-auto">
            <div className="flex justify-between items-start border-b-4 border-blue-600 pb-4 mb-6">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">DF</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">{config.nomEntreprise}</h1>
                  <p className="text-gray-600 text-sm">{config.sousNom}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{config.adresse}</p>
                <p>Tél: {config.telephone}</p>
                <p>{config.email}</p>
              </div>
            </div>

            <div className="bg-blue-600 text-white text-center py-3 mb-6 rounded">
              <h2 className="text-xl font-bold">RAPPORT D'INTERVENTION</h2>
              <p className="text-blue-200">{getTypeLabel(rapport.typeIntervention)}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded">
              <div><p className="text-xs text-gray-500">N° Rapport</p><p className="font-semibold">{rapport.numeroRapport}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="font-semibold">{formatDate(rapport.dateIntervention)}</p></div>
              <div><p className="text-xs text-gray-500">Horaires</p><p className="font-semibold">{rapport.heureDebut} - {rapport.heureFin}</p></div>
              <div><p className="text-xs text-gray-500">Technicien</p><p className="font-semibold">{rapport.technicien}</p></div>
            </div>

            <div className="mb-6">
              <h3 className="bg-blue-600 text-white px-4 py-2 font-semibold mb-3">CLIENT</h3>
              <div className="grid grid-cols-2 gap-4 px-2">
                <div><p className="text-xs text-gray-500">Client</p><p className="font-medium">{rapport.client || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Contact</p><p className="font-medium">{rapport.contactSite || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Adresse</p><p className="font-medium">{rapport.adresseClient || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Téléphone</p><p className="font-medium">{rapport.telClient || '-'}</p></div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="bg-blue-600 text-white px-4 py-2 font-semibold mb-3">ÉQUIPEMENT</h3>
              <div className="grid grid-cols-3 gap-4 px-2">
                <div><p className="text-xs text-gray-500">Type</p><p className="font-medium">{rapport.typeEquipement || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Marque / Modèle</p><p className="font-medium">{rapport.marque} {rapport.modele}</p></div>
                <div><p className="text-xs text-gray-500">Fluide</p><p className="font-medium text-blue-600">{rapport.fluide}</p></div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="bg-blue-600 text-white px-4 py-2 font-semibold mb-3">INTERVENTION</h3>
              <div className="space-y-2 px-2">
                {rapport.motifAppel && <div className="bg-gray-50 p-2 rounded"><p className="text-xs text-gray-500 font-bold">Motif</p><p className="text-sm">{rapport.motifAppel}</p></div>}
                {rapport.diagnostic && <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400"><p className="text-xs text-gray-500 font-bold">Diagnostic</p><p className="text-sm">{rapport.diagnostic}</p></div>}
                {rapport.travauxRealises && <div className="bg-green-50 p-2 rounded border-l-4 border-green-400"><p className="text-xs text-gray-500 font-bold">Travaux</p><p className="text-sm">{rapport.travauxRealises}</p></div>}
              </div>
            </div>

            {Object.values(rapport.mesures).some(v => v) && (
              <div className="mb-6">
                <h3 className="bg-blue-600 text-white px-4 py-2 font-semibold mb-3">MESURES</h3>
                <div className="grid grid-cols-4 gap-2 px-2">
                  {Object.entries(rapport.mesures).filter(([,v]) => v).map(([key, value]) => (
                    <div key={key} className="text-center p-3 border rounded bg-gray-50">
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-lg font-bold text-blue-600">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div className="border rounded p-4"><p className="font-semibold text-sm mb-12">Signature Technicien</p><div className="border-b border-dashed"></div><p className="text-xs text-gray-500 mt-2">{rapport.technicien}</p></div>
              <div className="border rounded p-4"><p className="font-semibold text-sm mb-12">Signature Client</p><div className="border-b border-dashed"></div><p className="text-xs text-gray-500 mt-2">{rapport.contactSite || rapport.client}</p></div>
            </div>

            <div className="border-t mt-8 pt-4 text-center text-xs text-gray-500">
              <p className="font-semibold">{config.nomEntreprise} - {config.sousNom}</p>
              <p>{config.adresse} | {config.telephone} | {config.email}</p>
              <p>{config.numeroTahiti} | {config.numeroRC} | {config.rcs}</p>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">🏢 Entreprise</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input type="text" value={config.nomEntreprise} onChange={(e) => updateConfig('nomEntreprise', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activité</label>
                  <input type="text" value={config.sousNom} onChange={(e) => updateConfig('sousNom', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <input type="text" value={config.adresse} onChange={(e) => updateConfig('adresse', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input type="text" value={config.telephone} onChange={(e) => updateConfig('telephone', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={config.email} onChange={(e) => updateConfig('email', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° TAHITI</label>
                  <input type="text" value={config.numeroTahiti} onChange={(e) => updateConfig('numeroTahiti', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° RC</label>
                  <input type="text" value={config.numeroRC} onChange={(e) => updateConfig('numeroRC', e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">🖼️ Logo</h3>
              <div className="flex items-center gap-6">
                {logoUrl ? (
                  <div className="relative">
                    <img src={logoUrl} alt="Logo" className="h-24 object-contain border rounded p-2" />
                    <button type="button" onClick={() => setLogoUrl('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6">×</button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 border-2 border-dashed rounded flex items-center justify-center text-gray-400">Aucun</div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">📤 Charger</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{rapport.numeroRapport}</span>
            {rapport.client && <span className="ml-2">• {rapport.client}</span>}
            {creerFacture && lignesFacture.length > 0 && (
              <span className="ml-2 text-blue-600">• {formatNumber(totaux.totalTTC)} XPF</span>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={sauvegarderLocal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              💾 Local
            </button>
            <button type="button" onClick={genererPDFLocal} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
              📄 PDF
            </button>
            <button
              type="button"
              onClick={lancerWorkflowComplet}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              🚀 Envoyer tout
            </button>
          </div>
        </div>
      </div>

      <div className="h-20"></div>
    </div>
  );
}
