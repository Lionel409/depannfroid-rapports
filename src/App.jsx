import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  deplacement: 5000,
  diagnosticUrgence: 12000
};

function RapportForm() {
  // États du formulaire
  const [rapport, setRapport] = useState({
    date: new Date().toISOString().split('T')[0],
    horaires: '',
    technicien: 'Lionel',
    client: {
      nom: '',
      contact: '',
      adresse: '',
      telephone: '',
      email: ''
    },
    equipement: {
      type: '',
      marque: '',
      modele: '',
      numero_serie: '',
      fluide: '',
      localisation: ''
    },
    diagnostic: '',
    travaux_realises: '',
    recommandations: '',
    prochaine_visite: '',
    etat_installation: 'Normal'
  });

  const [facture, setFacture] = useState({
    lignes: [],
    total_ht_fournitures: 0,
    tva_fournitures: 0,
    total_ht_services: 0,
    tva_services: 0,
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0
  });

  const [envoyerRapport, setEnvoyerRapport] = useState(true);
  const [envoyerFacture, setEnvoyerFacture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Gestion des changements du formulaire
  const handleRapportChange = (section, field, value) => {
    setRapport(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Calcul des totaux de facture
  const calculerTotaux = () => {
    let totalHTFournitures = 0;
    let totalHTServices = 0;

    facture.lignes.forEach(ligne => {
      const montant = (ligne.quantite || 0) * (ligne.prix_unitaire || 0);
      if (ligne.type === 'Fourniture') {
        totalHTFournitures += montant;
      } else if (ligne.type === 'Service') {
        totalHTServices += montant;
      }
    });

    const tvaFournitures = totalHTFournitures * 0.16;
    const tvaServices = totalHTServices * 0.13;
    const totalHT = totalHTFournitures + totalHTServices;
    const totalTVA = tvaFournitures + tvaServices;
    const totalTTC = totalHT + totalTVA;

    setFacture(prev => ({
      ...prev,
      total_ht_fournitures: totalHTFournitures,
      tva_fournitures: tvaFournitures,
      total_ht_services: totalHTServices,
      tva_services: tvaServices,
      total_ht: totalHT,
      total_tva: totalTVA,
      total_ttc: totalTTC
    }));
  };

  useEffect(() => {
    calculerTotaux();
  }, [facture.lignes]);

  // Ajouter une ligne de facture
  const ajouterLigneFacture = () => {
    setFacture(prev => ({
      ...prev,
      lignes: [...prev.lignes, {
        description: '',
        type: 'Service',
        quantite: 1,
        prix_unitaire: 0
      }]
    }));
  };

  // Supprimer une ligne de facture
  const supprimerLigneFacture = (index) => {
    setFacture(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  // Modifier une ligne de facture
  const modifierLigneFacture = (index, field, value) => {
    setFacture(prev => ({
      ...prev,
      lignes: prev.lignes.map((ligne, i) => 
        i === index ? { ...ligne, [field]: value } : ligne
      )
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rapport.client.email && (envoyerRapport || envoyerFacture)) {
      setMessage({ type: 'error', text: 'Email du client requis pour l\'envoi' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const data = {
        action: 'creerRapport',
        rapport: rapport,
        facture: envoyerFacture ? facture : null,
        envoyerRapport: envoyerRapport,
        envoyerFacture: envoyerFacture
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Rapport ${result.numeroRapport} créé avec succès${result.numeroFacture ? ` (Facture ${result.numeroFacture})` : ''}`
        });
        
        // Réinitialiser le formulaire
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Erreur lors de la création' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app">
      <div className="rapport-header">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">DEPANN'FROID</h1>
          <p className="text-sm text-gray-600 mt-1">Système de rapports automatisés v3.0</p>
        </div>
        <button className="btn-primary" disabled>
          <span className="text-xl">❄️</span>
          Connecté à Google Sheets
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} mb-6`}>
          <span className="text-2xl">{message.type === 'success' ? '✅' : '❌'}</span>
          <div>
            <h4 className="font-semibold">{message.type === 'success' ? 'Succès' : 'Erreur'}</h4>
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section Informations générales */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Informations générales</h2>
          <div className="client-info">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input-field"
                value={rapport.date}
                onChange={(e) => setRapport({ ...rapport, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Horaires</label>
              <input
                type="text"
                className="input-field"
                placeholder="08:00 - 10:00"
                value={rapport.horaires}
                onChange={(e) => setRapport({ ...rapport, horaires: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Technicien</label>
              <input
                type="text"
                className="input-field"
                value={rapport.technicien}
                onChange={(e) => setRapport({ ...rapport, technicien: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Section Client */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👤 Client</h2>
          <div className="client-info">
            <div className="col-span-2">
              <label className="label">Entreprise / Nom *</label>
              <input
                type="text"
                className="input-field"
                value={rapport.client.nom}
                onChange={(e) => handleRapportChange('client', 'nom', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Contact sur site</label>
              <input
                type="text"
                className="input-field"
                value={rapport.client.contact}
                onChange={(e) => handleRapportChange('client', 'contact', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Adresse</label>
              <input
                type="text"
                className="input-field"
                value={rapport.client.adresse}
                onChange={(e) => handleRapportChange('client', 'adresse', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                className="input-field"
                value={rapport.client.telephone}
                onChange={(e) => handleRapportChange('client', 'telephone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input-field"
                value={rapport.client.email}
                onChange={(e) => handleRapportChange('client', 'email', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section Équipement */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Équipement</h2>
          <div className="client-info">
            <div>
              <label className="label">Type *</label>
              <select
                className="input-field"
                value={rapport.equipement.type}
                onChange={(e) => handleRapportChange('equipement', 'type', e.target.value)}
                required
              >
                <option value="">Sélectionner...</option>
                {TYPES_EQUIPEMENTS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Marque / Modèle</label>
              <input
                type="text"
                className="input-field"
                value={rapport.equipement.marque}
                onChange={(e) => handleRapportChange('equipement', 'marque', e.target.value)}
              />
            </div>
            <div>
              <label className="label">N° Série</label>
              <input
                type="text"
                className="input-field"
                value={rapport.equipement.numero_serie}
                onChange={(e) => handleRapportChange('equipement', 'numero_serie', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fluide frigorigène</label>
              <select
                className="input-field"
                value={rapport.equipement.fluide}
                onChange={(e) => handleRapportChange('equipement', 'fluide', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {FLUIDES.map(fluide => (
                  <option key={fluide} value={fluide}>{fluide}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Localisation</label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: Cuisine principale"
                value={rapport.equipement.localisation}
                onChange={(e) => handleRapportChange('equipement', 'localisation', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section Intervention */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Détails de l'intervention</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Diagnostic technique *</label>
              <textarea
                className="textarea-field"
                rows="4"
                value={rapport.diagnostic}
                onChange={(e) => setRapport({ ...rapport, diagnostic: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Travaux réalisés</label>
              <textarea
                className="textarea-field"
                rows="4"
                value={rapport.travaux_realises}
                onChange={(e) => setRapport({ ...rapport, travaux_realises: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Recommandations</label>
              <textarea
                className="textarea-field"
                rows="3"
                value={rapport.recommandations}
                onChange={(e) => setRapport({ ...rapport, recommandations: e.target.value })}
              />
            </div>
            <div className="client-info">
              <div>
                <label className="label">Prochaine visite recommandée</label>
                <input
                  type="date"
                  className="input-field"
                  value={rapport.prochaine_visite}
                  onChange={(e) => setRapport({ ...rapport, prochaine_visite: e.target.value })}
                />
              </div>
              <div>
                <label className="label">État de l'installation</label>
                <select
                  className="input-field"
                  value={rapport.etat_installation}
                  onChange={(e) => setRapport({ ...rapport, etat_installation: e.target.value })}
                >
                  <option value="Bon">✅ Bon</option>
                  <option value="Normal">⚪ Normal</option>
                  <option value="À surveiller">⚠️ À surveiller</option>
                  <option value="Critique">🔴 Critique</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section Facture */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">💰 Facturation</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={ajouterLigneFacture}
            >
              + Ajouter une ligne
            </button>
          </div>

          {facture.lignes.map((ligne, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 mb-4">
              <div className="client-info">
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ligne.description}
                    onChange={(e) => modifierLigneFacture(index, 'description', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input-field"
                    value={ligne.type}
                    onChange={(e) => modifierLigneFacture(index, 'type', e.target.value)}
                  >
                    <option value="Service">Service (TVA 13%)</option>
                    <option value="Fourniture">Fourniture (TVA 16%)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantité</label>
                  <input
                    type="number"
                    className="input-field"
                    value={ligne.quantite}
                    onChange={(e) => modifierLigneFacture(index, 'quantite', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Prix unitaire (XPF)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={ligne.prix_unitaire}
                    onChange={(e) => modifierLigneFacture(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn-danger w-full"
                    onClick={() => supprimerLigneFacture(index)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {facture.lignes.length > 0 && (
            <div className="financial-summary">
              <div className="flex justify-between text-sm">
                <span>Total HT Fournitures :</span>
                <span>{facture.total_ht_fournitures.toFixed(0)} XPF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA 16% :</span>
                <span>{facture.tva_fournitures.toFixed(0)} XPF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total HT Services :</span>
                <span>{facture.total_ht_services.toFixed(0)} XPF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA 13% :</span>
                <span>{facture.tva_services.toFixed(0)} XPF</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2 mt-2">
                <span>TOTAL TTC :</span>
                <span>{facture.total_ttc.toFixed(0)} XPF</span>
              </div>
            </div>
          )}
        </div>

        {/* Section Envoi */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📧 Options d'envoi</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={envoyerRapport}
                onChange={(e) => setEnvoyerRapport(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-medium">Envoyer le rapport d'intervention par email</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={envoyerFacture}
                onChange={(e) => setEnvoyerFacture(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-medium">Envoyer la facture par email</span>
            </label>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="card text-center">
          <button
            type="submit"
            className="btn-primary px-12 py-4 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner inline-block mr-2"></span>
                Envoi en cours...
              </>
            ) : (
              <>
                🚀 Envoyer tout
              </>
            )}
          </button>
        </div>
      </form>

      <div className="h-20"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RapportForm />} />
        <Route path="/signature/:token" element={<SignatureRapport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
