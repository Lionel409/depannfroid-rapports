import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SignatureRapport() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  // URL de l'API Apps Script déployée
  const API_URL = 'https://script.google.com/macros/s/AKfycbxOPxdU2c4fQYwZR8VqiRs0daqAh_bB6ADMs4Gh5-ycMQI-8Y81s-ccsXIvOJE60rYO/exec';

  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // État pour la signature TEXTE
  const [signatureTexte, setSignatureTexte] = useState('');
  const [nomSignataire, setNomSignataire] = useState('');

  useEffect(() => {
    chargerRapport();
  }, [token]);

  // Charge les données du rapport depuis l'API
  const chargerRapport = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'getSignatureData',
          token: token
        })
      });

      const data = await response.json();

      if (data.success) {
        setRapport(data.rapport);
        
        // Si déjà signé
        if (data.rapport.signatureClient) {
          setError('Ce rapport a déjà été signé.');
        }
      } else {
        setError(data.message || 'Rapport non trouvé');
      }
    } catch (err) {
      console.error('Erreur chargement rapport:', err);
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  // Soumet la signature
  const soumettreSignature = async () => {
    if (!nomSignataire.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    
    if (!signatureTexte.trim()) {
      alert('Veuillez entrer votre signature');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'signerRapport',
          token: token,
          signature: `${nomSignataire} - ${signatureTexte}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.message || 'Erreur lors de la signature');
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError('Erreur lors de l\'envoi de la signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          padding: '40px',
          backgroundColor: '#fee',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#c33', marginBottom: '15px' }}>Erreur</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          padding: '40px',
          backgroundColor: '#efe',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#2a2', marginBottom: '15px' }}>Signature enregistrée !</h2>
          <p style={{ color: '#666' }}>Merci d'avoir signé le rapport d'intervention.</p>
          <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
            Redirection automatique dans 3 secondes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
        padding: '40px'
      }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #007bff', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', color: '#333', margin: '0 0 10px 0' }}>DEPANN'FROID</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Installation & Maintenance Frigorifique - Climatisation</p>
        </div>

        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '30px', textAlign: 'center' }}>
          Signature du Rapport d'Intervention
        </h2>

        {/* Informations du rapport */}
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '30px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>N° Rapport</strong><br/>
            <span style={{ fontSize: '18px', color: '#007bff' }}>{rapport.numeroRapport}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Date</strong><br/>
            {rapport.date}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Client</strong><br/>
            {rapport.clientNom}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Technicien</strong><br/>
            {rapport.technicien}
          </div>
        </div>

        {/* Résumé de l'intervention */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '15px' }}>Résumé de l'intervention</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Équipement :</strong> {rapport.equipementType} - {rapport.equipementMarque}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Diagnostic :</strong> {rapport.diagnostic}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>État :</strong> {rapport.etatInstallation}
          </div>
        </div>

        {/* Zone de signature TEXTE */}
        <div style={{ 
          border: '2px solid #007bff',
          borderRadius: '6px',
          padding: '30px',
          marginBottom: '30px',
          backgroundColor: '#f0f8ff'
        }}>
          <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>Votre signature</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            En signant ci-dessous, vous attestez avoir pris connaissance du rapport d'intervention et acceptez les travaux réalisés.
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Nom complet *
            </label>
            <input
              type="text"
              value={nomSignataire}
              onChange={(e) => setNomSignataire(e.target.value)}
              placeholder="Ex: Jean Dupont"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Signature (tapez votre nom en toutes lettres) *
            </label>
            <input
              type="text"
              value={signatureTexte}
              onChange={(e) => setSignatureTexte(e.target.value)}
              placeholder="Ex: Jean Dupont"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '24px',
                fontFamily: 'cursive',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontStyle: 'italic'
              }}
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Votre signature sera enregistrée dans le rapport
            </p>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={soumettreSignature}
            disabled={submitting || !nomSignataire.trim() || !signatureTexte.trim()}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: (submitting || !nomSignataire.trim() || !signatureTexte.trim()) ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (submitting || !nomSignataire.trim() || !signatureTexte.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {submitting ? '⏳ Enregistrement...' : '✓ Signer le rapport'}
          </button>
        </div>

        {/* Mentions légales */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center'
        }}>
          <p style={{ margin: '5px 0' }}><strong>DEPANN'FROID</strong></p>
          <p style={{ margin: '5px 0' }}>Installation & Maintenance Frigorifique - Climatisation</p>
          <p style={{ margin: '5px 0' }}>BP 1566 Papetoai - 98729 Moorea, Polynésie française</p>
          <p style={{ margin: '5px 0' }}>Tél: +689 87 70 64 75 | Email: depannfroidmoorea@gmail.com</p>
          <p style={{ margin: '5px 0' }}>N° TAHITI: 796235 | N° RC: 061640 A | RCS Papeete: 061640 A</p>
        </div>
      </div>
    </div>
  );
}

export default SignatureRapport;
