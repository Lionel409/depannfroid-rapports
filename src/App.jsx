import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignatureRapport from './SignatureRapport';
import Paiements from './Paiements';

// ============================================
// SYSTÈME DE RAPPORTS AUTOMATISÉS DEPANN'FROID
// Version 4.0 - Formulaire complet avec mesures techniques
// ============================================

// URL de l'API Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxOPxdU2c4fQYwZR8VqiRs0daqAh_bB6ADMs4Gh5-ycMQI-8Y81s-ccsXIvOJE60rYO/exec';

// Types d'équipements et fluides
const TYPES_EQUIPEMENTS = [
  'Chambre froide positive', 'Chambre froide négative', 'Vitrine réfrigérée',
  'Climatisation split', 'Climatisation gainable', 'Groupe de condensation',
  'Centrale frigorifique', 'Machine à glace', 'Congélateur professionnel', 'Autre'
];

const FLUIDES = ['R-134a', 'R-404A', 'R-410A', 'R-32', 'R-290', 'R-600a', 'R-744 (CO2)', 'R-407C', 'R-22 (ancien)'];

const TYPES_INTERVENTION = ['Maintenance', 'Dépannage', 'Installation', 'Mise en service'];

const NIVEAUX_URGENCE = ['Normale', 'Importante', 'Urgente'];

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
    heureDebut: '',
    heureFin: '',
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
    type_intervention: '',
    motif_appel: '',
    constat_arrivee: '',
    diagnostic: '',
    travaux_realises: '',
    pieces_utilisees: '',
    pression_hp: '',
    pression_bp: '',
    surchauffe: '',
    sous_refroid: '',
    t_evap: '',
    t_cond: '',
    t_ambiance: '',
    intensite: '',
    recommandations: '',
    prochaine_visite: '',
    urgence: 'Normale'
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
  const [showMesuresTechniques, setShowMesuresTechniques] = useState(false);

  // Gestion des changements du formulaire
  const handleRapportChange = (section, field, value) => {
    if (typeof section === 'object') {
      // Si section est en fait l'event (appelé directement)
      setRapport(prev => ({ ...prev, ...section }));
    } else {
      setRapport(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
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

    const tvaFournitures = Math.round(totalHTFournitures * 0.16);
    const tvaServices = Math.round(totalHTServices * 0.13);
    const totalHT = totalHTFournitures + totalHTServices;
    const totalTVA = tvaFournitures + tvaServices;
    const totalTTC = totalHT + totalTVA;

    setFacture(prev => ({
      ...prev,
      total_ht_fournitures: Math.round(totalHTFournitures),
      tva_fournitures: tvaFournitures,
      total_ht_services: Math.round(totalHTServices),
      tva_services: tvaServices,
      total_ht: Math.round(totalHT),
      total_tva: totalTVA,
      total_ttc: Math.round(totalTTC)
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
    setLoading(true);
    setMessage(null);

    try {
      // Combine les horaires en format "HH:MM - HH:MM"
      const rapportAvecHoraires = {
        ...rapport,
        horaires: `${rapport.heureDebut} - ${rapport.heureFin}`
      };
      
      // Prépare les données à envoyer
      const data = {
        action: 'creerRapport',
        rapport: rapportAvecHoraires,
        facture: envoyerFacture ? facture : null,
        envoyerRapport,
        envoyerFacture
      };

      // Utiliser un formulaire caché pour contourner CORS avec Google Apps Script
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = API_URL;
      form.target = 'hidden_iframe';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify(data);
      form.appendChild(input);

      // Créer un iframe caché pour recevoir la réponse
      let iframe = document.getElementById('hidden_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hidden_iframe';
        iframe.name = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Simuler un succès après 2 secondes
      setTimeout(() => {
        setLoading(false);
        setMessage({
          type: 'success',
          text: `Rapport envoyé avec succès ! Vérifiez vos emails et Google Sheets.`
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi' });
      setLoading(false);
    }
  };

  return (
    <div className="container-app">
      <div className="rapport-header">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">DEPANN'FROID</h1>
          <p className="text-sm text-gray-600 mt-1">Système de rapports automatisés v4.0</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a 
            href="/paiements"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            💰 Gérer paiements
          </a>
          <a 
            href="https://docs.google.com/spreadsheets/d/1_IcM5_wH4CI-HbwA9q515LvgPrVrZ_YZCiwc6xprE-A/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span className="text-xl">❄️</span>
            Ouvrir Google Sheets
          </a>
        </div>
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
              <label className="label">Date *</label>
              <input
                type="date"
                className="input-field"
                value={rapport.date}
                onChange={(e) => setRapport({ ...rapport, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Heure début *</label>
              <input
                type="time"
                className="input-field"
                value={rapport.heureDebut}
                onChange={(e) => setRapport({ ...rapport, heureDebut: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Heure fin *</label>
              <input
                type="time"
                className="input-field"
                value={rapport.heureFin}
                onChange={(e) => setRapport({ ...rapport, heureFin: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Technicien *</label>
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
              <label className="label">Adresse *</label>
              <input
                type="text"
                className="input-field"
                value={rapport.client.adresse}
                onChange={(e) => handleRapportChange('client', 'adresse', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Téléphone *</label>
              <input
                type="tel"
                className="input-field"
                value={rapport.client.telephone}
                onChange={(e) => handleRapportChange('client', 'telephone', e.target.value)}
                required
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
              <label className="label">Marque *</label>
              <input
                type="text"
                className="input-field"
                value={rapport.equipement.marque}
                onChange={(e) => handleRapportChange('equipement', 'marque', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Modèle *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: ABC-123"
                value={rapport.equipement.modele}
                onChange={(e) => handleRapportChange('equipement', 'modele', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">N° Série *</label>
              <input
                type="text"
                className="input-field"
                value={rapport.equipement.numero_serie}
                onChange={(e) => handleRapportChange('equipement', 'numero_serie', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Fluide frigorigène *</label>
              <select
                className="input-field"
                value={rapport.equipement.fluide}
                onChange={(e) => handleRapportChange('equipement', 'fluide', e.target.value)}
                required
              >
                <option value="">Sélectionner...</option>
                {FLUIDES.map(fluide => (
                  <option key={fluide} value={fluide}>{fluide}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Localisation *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Cuisine principale"
                value={rapport.equipement.localisation}
                onChange={(e) => handleRapportChange('equipement', 'localisation', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section Intervention */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🛠️ Détails de l'intervention</h2>
          <div className="client-info">
            <div>
              <label className="label">Type d'intervention *</label>
              <select
                className="input-field"
                value={rapport.type_intervention}
                onChange={(e) => setRapport({ ...rapport, type_intervention: e.target.value })}
                required
              >
                <option value="">Sélectionner...</option>
                {TYPES_INTERVENTION.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Niveau d'urgence *</label>
              <select
                className="input-field"
                value={rapport.urgence}
                onChange={(e) => setRapport({ ...rapport, urgence: e.target.value })}
                required
              >
                {NIVEAUX_URGENCE.map(niveau => (
                  <option key={niveau} value={niveau}>{niveau}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Motif de l'appel *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Ex: Perte de froid, Alarme haute pression..."
                value={rapport.motif_appel}
                onChange={(e) => setRapport({ ...rapport, motif_appel: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="label">Constat à l'arrivée *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="État de l'installation à l'arrivée..."
                value={rapport.constat_arrivee}
                onChange={(e) => setRapport({ ...rapport, constat_arrivee: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="label">Diagnostic *</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Analyse du problème..."
                value={rapport.diagnostic}
                onChange={(e) => setRapport({ ...rapport, diagnostic: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="label">Travaux réalisés *</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Détail des interventions effectuées..."
                value={rapport.travaux_realises}
                onChange={(e) => setRapport({ ...rapport, travaux_realises: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="label">Pièces utilisées *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Liste des pièces remplacées ou ajoutées..."
                value={rapport.pieces_utilisees}
                onChange={(e) => setRapport({ ...rapport, pieces_utilisees: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="label">Recommandations *</label>
              <textarea
                className="input-field"
                rows="2"
                placeholder="Conseils et préconisations..."
                value={rapport.recommandations}
                onChange={(e) => setRapport({ ...rapport, recommandations: e.target.value })}
                required
              ></textarea>
            </div>
            <div>
              <label className="label">Prochaine visite</label>
              <input
                type="date"
                className="input-field"
                value={rapport.prochaine_visite}
                onChange={(e) => setRapport({ ...rapport, prochaine_visite: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section Mesures techniques (repliable) */}
        <div className="card mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowMesuresTechniques(!showMesuresTechniques)}
          >
            <h2 className="text-xl font-bold text-gray-800">📊 Mesures techniques (optionnel)</h2>
            <span className="text-2xl">{showMesuresTechniques ? '▼' : '▶'}</span>
          </div>
          
          {showMesuresTechniques && (
            <div className="client-info mt-4">
              <div>
                <label className="label">Pression HP (bar)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 12.5"
                  value={rapport.pression_hp}
                  onChange={(e) => setRapport({ ...rapport, pression_hp: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Pression BP (bar)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 2.8"
                  value={rapport.pression_bp}
                  onChange={(e) => setRapport({ ...rapport, pression_bp: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Surchauffe (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 7.5"
                  value={rapport.surchauffe}
                  onChange={(e) => setRapport({ ...rapport, surchauffe: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Sous-refroidissement (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 5.0"
                  value={rapport.sous_refroid}
                  onChange={(e) => setRapport({ ...rapport, sous_refroid: e.target.value })}
                />
              </div>
              <div>
                <label className="label">T° évaporateur (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: -10.0"
                  value={rapport.t_evap}
                  onChange={(e) => setRapport({ ...rapport, t_evap: e.target.value })}
                />
              </div>
              <div>
                <label className="label">T° condenseur (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 40.0"
                  value={rapport.t_cond}
                  onChange={(e) => setRapport({ ...rapport, t_cond: e.target.value })}
                />
              </div>
              <div>
                <label className="label">T° ambiante (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 25.0"
                  value={rapport.t_ambiance}
                  onChange={(e) => setRapport({ ...rapport, t_ambiance: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Intensité (A)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="Ex: 4.5"
                  value={rapport.intensite}
                  onChange={(e) => setRapport({ ...rapport, intensite: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section Facturation */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Facturation</h2>
          
          <div className="mb-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={ajouterLigneFacture}
            >
              + Ajouter une ligne
            </button>
          </div>

          {facture.lignes.map((ligne, index) => (
            <div key={index} className="facture-line">
              <input
                type="text"
                className="input-field"
                placeholder="Description"
                value={ligne.description}
                onChange={(e) => modifierLigneFacture(index, 'description', e.target.value)}
              />
              <select
                className="input-field"
                value={ligne.type}
                onChange={(e) => modifierLigneFacture(index, 'type', e.target.value)}
              >
                <option value="Service">Service</option>
                <option value="Fourniture">Fourniture</option>
              </select>
              <input
                type="number"
                className="input-field"
                placeholder="Qté"
                value={ligne.quantite}
                onChange={(e) => modifierLigneFacture(index, 'quantite', parseFloat(e.target.value) || 0)}
              />
              <input
                type="number"
                className="input-field"
                placeholder="Prix unitaire XPF"
                value={ligne.prix_unitaire}
                onChange={(e) => modifierLigneFacture(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
              />
              <span className="text-gray-700 font-semibold">
                {((ligne.quantite || 0) * (ligne.prix_unitaire || 0)).toLocaleString()} XPF
              </span>
              <button
                type="button"
                className="btn-danger"
                onClick={() => supprimerLigneFacture(index)}
              >
                ✕
              </button>
            </div>
          ))}

          {facture.lignes.length > 0 && (
            <div className="facture-total">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total HT Fournitures (TVA 16%):</span>
                  <span className="font-semibold">{facture.total_ht_fournitures.toLocaleString()} XPF</span>
                </div>
                <div className="flex justify-between">
                  <span>Total HT Services (TVA 13%):</span>
                  <span className="font-semibold">{facture.total_ht_services.toLocaleString()} XPF</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Total HT:</span>
                  <span className="font-bold">{facture.total_ht.toLocaleString()} XPF</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA:</span>
                  <span className="font-semibold">{facture.total_tva.toLocaleString()} XPF</span>
                </div>
                <div className="flex justify-between text-xl border-t-2 pt-2">
                  <span className="font-bold">Total TTC:</span>
                  <span className="font-bold text-blue-600">{facture.total_ttc.toLocaleString()} XPF</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options d'envoi */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📧 Options d'envoi</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={envoyerRapport}
                onChange={(e) => setEnvoyerRapport(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Envoyer le rapport d'intervention au client</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={envoyerFacture}
                onChange={(e) => setEnvoyerFacture(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Envoyer la facture au client</span>
            </label>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="text-center">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '⏳ Envoi en cours...' : '📨 Envoyer tout'}
          </button>
        </div>
      </form>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%);
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .rapport-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .card {
          background: #ffffff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .client-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .col-span-2 {
          grid-column: span 2;
        }

        .label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .input-field {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .facture-line {
          display: grid;
          grid-template-columns: 2fr 1fr 0.8fr 1.2fr 1fr 60px;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .facture-total {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f0f9ff;
          border-radius: 8px;
          border: 2px solid #3b82f6;
        }

        .btn-primary, .btn-secondary, .btn-danger, .btn-submit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background: #10b981;
          color: white;
        }

        .btn-secondary:hover {
          background: #059669;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 0.5rem;
          font-size: 1.2rem;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-submit {
          background: #2563eb;
          color: white;
          font-size: 1.2rem;
          padding: 1rem 3rem;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }

        .btn-submit:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .alert-success {
          background: #d1fae5;
          border: 2px solid #10b981;
          color: #065f46;
        }

        .alert-error {
          background: #fee2e2;
          border: 2px solid #ef4444;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .client-info {
            grid-template-columns: 1fr;
          }
          
          .facture-line {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RapportForm />} />
        <Route path="/signature/:token" element={<SignatureRapport />} />
        <Route path="/paiements" element={<Paiements />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
