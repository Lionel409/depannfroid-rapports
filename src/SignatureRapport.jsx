import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SignatureRapport() {
  const { token } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // URL de l'API Apps Script déployée
  const API_URL = 'https://script.google.com/macros/s/AKfycbxOPxdU2c4fQYwZR8VqiRs0daqAh_bB6ADMs4Gh5-ycMQI-8Y81s-ccsXIvOJE60rYO/exec';

  useEffect(() => {
    chargerRapport();
  }, [token]);

  // Charge les données du rapport
  const chargerRapport = async () => {
    try {
      setLoading(true);
      
      // Pour l'instant, on affiche des données de test
      // car l'API Apps Script n'est pas encore testée
      setRapport({
        numeroRapport: 'RI-2025-' + token.substring(0, 4),
        date: new Date().toLocaleDateString('fr-FR'),
        clientNom: 'Client Test',
        technicien: 'Lionel',
        equipementType: 'Chambre froide',
        equipementMarque: 'Test Equipment',
        diagnostic: 'Diagnostic en cours',
        etatInstallation: 'Normal'
      });
      
      setLoading(false);
      
      /* Version API réelle - à activer après tests
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
        
        if (data.rapport.signatureClient) {
          setError('Ce rapport a déjà été signé.');
        }
      } else {
        setError(data.message || 'Rapport non trouvé');
      }
      */
    } catch (err) {
      console.error('Erreur chargement rapport:', err);
      setError('Erreur lors du chargement du rapport');
      setLoading(false);
    }
  };

  // Initialise le canvas
  useEffect(() => {
    if (canvasRef.current && rapport && !rapport.signatureClient) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, [rapport]);

  // Gestion du dessin
  const startDrawing = (e) => {
    if (rapport?.signatureClient) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing || rapport?.signatureClient) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL());
  };

  // Efface la signature
  const effacerSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Soumet la signature
  const soumettreSignature = async () => {
    if (!signatureData) {
      alert('Veuillez signer avant de soumettre');
      return;
    }

    try {
      setSubmitting(true);

      // Pour l'instant, on simule un succès
      // L'API sera activée après les tests complets
      setTimeout(() => {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }, 1000);

      /* Version API réelle - à activer après tests
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'signerRapport',
          token: token,
          signature: signatureData
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
      */
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError('Erreur lors de l\'envoi de la signature');
    } finally {
      setSubmitting(false);
    }
  };

  // États de chargement et erreur
  if (loading) {
    return (
      <div className="container-app">
        <div className="card text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p>Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-app">
        <div className="card">
          <div className="alert alert-error">
            <span className="text-2xl">❌</span>
            <div>
              <h4 className="font-semibold">Erreur</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary mt-4"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-app">
        <div className="card text-center">
          <div className="alert alert-success">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-semibold">Signature enregistrée</h4>
              <p className="text-sm">Merci d'avoir signé le rapport. Vous allez être redirigé...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage principal
  return (
    <div className="container-app">
      <div className="card max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="rapport-header mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              DEPANN'FROID
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Installation & Maintenance Frigorifique - Climatisation
            </p>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-center mb-6">
          Signature du Rapport d'Intervention
        </h2>

        {/* Informations rapport */}
        {rapport && (
          <div className="client-info mb-6">
            <div>
              <p className="client-info-label">N° Rapport</p>
              <p className="client-info-value">{rapport.numeroRapport}</p>
            </div>
            <div>
              <p className="client-info-label">Date</p>
              <p className="client-info-value">{rapport.date}</p>
            </div>
            <div>
              <p className="client-info-label">Client</p>
              <p className="client-info-value">{rapport.clientNom}</p>
            </div>
            <div>
              <p className="client-info-label">Technicien</p>
              <p className="client-info-value">{rapport.technicien}</p>
            </div>
          </div>
        )}

        {/* Résumé intervention */}
        {rapport && (
          <div className="rapport-section mb-6">
            <h3 className="rapport-section-title">Résumé de l'intervention</h3>
            <div className="space-y-2">
              <p><strong>Équipement :</strong> {rapport.equipementType} - {rapport.equipementMarque}</p>
              <p><strong>Diagnostic :</strong> {rapport.diagnostic}</p>
              <p><strong>État :</strong> {rapport.etatInstallation}</p>
            </div>
          </div>
        )}

        {/* Zone de signature */}
        <div className="rapport-section">
          <h3 className="rapport-section-title">Votre signature</h3>
          
          <p className="text-sm text-gray-600 mb-4">
            En signant ci-dessous, vous attestez avoir pris connaissance du rapport d'intervention et acceptez les travaux réalisés.
          </p>

          {/* Canvas */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={effacerSignature}
              className="btn-outline"
              disabled={!signatureData || submitting}
            >
              ↻ Effacer
            </button>
            <button
              onClick={soumettreSignature}
              className="btn-primary flex-1"
              disabled={!signatureData || submitting}
            >
              {submitting ? (
                <>
                  <span className="loading-spinner inline-block mr-2"></span>
                  Envoi en cours...
                </>
              ) : (
                '✓ Signer le rapport'
              )}
            </button>
          </div>
        </div>

        {/* Informations légales */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-semibold mb-2">Mentions légales :</p>
          <p>
            DEPANN'FROID - BP 1566 Papetoai - 98729 Moorea, Polynésie française<br />
            Tél: +689 87 70 64 75 | Email: depannfroidmoorea@gmail.com<br />
            N° TAHITI: 796235 | N° RC: 061640 A | RCS Papeete: 061640 A
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignatureRapport;
