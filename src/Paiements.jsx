import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// URL de l'API Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxOPxdU2c4fQYwZR8VqiRs0daqAh_bB6ADMs4Gh5-ycMQI-8Y81s-ccsXIvOJE60rYO/exec';

function Paiements() {
  console.log('🚀 Composant Paiements chargé');
  
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(null);

  console.log('📊 État initial:', { facturesCount: factures.length, loading, API_URL });

  useEffect(() => {
    console.log('⚡ useEffect - chargement des factures');
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    console.log('📡 chargerFactures - début');
    
    try {
      setLoading(true);
      
      console.log('📤 Envoi requête getFacturesEnAttente à:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'getFacturesEnAttente'
        })
      });

      console.log('📥 Response:', response.status, response.statusText);

      const data = await response.json();
      console.log('📄 Data reçue:', data);

      if (data.success) {
        console.log('✅ Factures chargées:', data.factures?.length || 0);
        setFactures(data.factures || []);
      } else {
        console.log('❌ Erreur API:', data.message);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des factures' });
      }
    } catch (err) {
      console.error('💥 Erreur catch:', err);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
      console.log('🏁 chargerFactures - fin');
    }
  };

  const marquerPayee = async (numeroFacture, index) => {
    console.log('🔵 marquerPayee appelée', { numeroFacture, index });
    
    if (!window.confirm(`Confirmer le paiement de la facture ${numeroFacture} ?`)) {
      console.log('❌ Confirmation annulée');
      return;
    }

    console.log('✅ Confirmation OK, envoi requête...');

    try {
      setProcessing(index);

      console.log('📡 URL API:', API_URL);
      console.log('📦 Data envoyée:', { action: 'marquerFacturePayee', numeroFacture });

      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'marquerFacturePayee',
          numeroFacture: numeroFacture
        })
      });

      console.log('📥 Response reçue:', response.status, response.statusText);

      const data = await response.json();
      console.log('📄 Data parsée:', data);

      if (data.success) {
        setMessage({ type: 'success', text: `Facture ${numeroFacture} marquée comme payée` });
        // Retirer la facture de la liste
        setFactures(factures.filter((_, i) => i !== index));
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la mise à jour' });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="container-app">
      <div className="rapport-header">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">DEPANN'FROID</h1>
          <p className="text-sm text-gray-600 mt-1">Gestion des paiements</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/')}
            type="button"
          >
            ← Retour
          </button>
          <button 
            className="btn-primary" 
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/1xRauATOa-JsVgLX2a5sO312YuhXBpyXp9dZL_1qi1h0/edit', '_blank')}
            type="button"
          >
            📊 Ouvrir Factures
          </button>
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

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Factures en attente de paiement</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ fontSize: '18px', color: '#666' }}>Chargement des factures...</p>
          </div>
        ) : factures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h3 style={{ fontSize: '24px', color: '#10b981', marginBottom: '10px' }}>Aucune facture en attente</h3>
            <p style={{ color: '#666' }}>Toutes les factures sont payées !</p>
          </div>
        ) : (
          <div className="factures-liste">
            {factures.map((facture, index) => (
              <div key={index} className="facture-card">
                <div className="facture-info">
                  <div className="facture-numero">
                    <span className="label-small">N° Facture</span>
                    <span className="numero">{facture.numeroFacture}</span>
                  </div>
                  <div className="facture-detail">
                    <span className="label-small">Client</span>
                    <span>{facture.client}</span>
                  </div>
                  <div className="facture-detail">
                    <span className="label-small">Date</span>
                    <span>{facture.dateFacture}</span>
                  </div>
                  <div className="facture-detail">
                    <span className="label-small">Échéance</span>
                    <span className={facture.enRetard ? 'text-red' : ''}>{facture.dateEcheance}</span>
                  </div>
                  <div className="facture-montant">
                    <span className="label-small">Montant TTC</span>
                    <span className="montant">{facture.totalTTC.toLocaleString()} XPF</span>
                  </div>
                </div>
                <div className="facture-actions">
                  {facture.enRetard && (
                    <span className="badge-retard">⚠️ En retard</span>
                  )}
                  <button
                    className="btn-payer"
                    onClick={() => marquerPayee(facture.numeroFacture, index)}
                    disabled={processing === index}
                  >
                    {processing === index ? '⏳ Traitement...' : '✓ Marquer comme payée'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

        .factures-liste {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .facture-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
        }

        .facture-card:hover {
          box-shadow: 0 6px 12px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .facture-info {
          display: flex;
          gap: 2rem;
          align-items: center;
          flex: 1;
        }

        .facture-numero {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .numero {
          font-size: 1.25rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .facture-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .facture-montant {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-left: auto;
          text-align: right;
        }

        .montant {
          font-size: 1.5rem;
          font-weight: bold;
          color: #10b981;
        }

        .label-small {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }

        .facture-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .badge-retard {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .text-red {
          color: #dc2626;
          font-weight: 600;
        }

        .btn-primary, .btn-secondary, .btn-payer {
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
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-payer {
          background: #10b981;
          color: white;
        }

        .btn-payer:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn-payer:disabled {
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
          .facture-card {
            flex-direction: column;
            align-items: stretch;
          }

          .facture-info {
            flex-direction: column;
            gap: 1rem;
          }

          .facture-montant {
            margin-left: 0;
            text-align: left;
          }

          .facture-actions {
            align-items: stretch;
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Paiements;
