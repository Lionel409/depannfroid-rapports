import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePage() {
  const [rapportId, setRapportId] = useState('');
  const [rapportData, setRapportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const sigCanvas = useRef(null);

  useEffect(() => {
    // Récupérer l'ID du rapport depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setRapportId(id);
    
    if (id) {
      chargerRapport(id);
    }
  }, []);

  const chargerRapport = async (id) => {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_rapport',
          rapportId: id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRapportData(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Veuillez signer avant de valider');
      return;
    }

    setSigning(true);
    
    try {
      const signatureData = sigCanvas.current.toDataURL('image/png');
      
      const response = await fetch('/api/save-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rapportId: rapportId,
          signature: signatureData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSigned(true);
      } else {
        alert('Erreur lors de la sauvegarde: ' + result.error);
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci !</h2>
          <p className="text-gray-600 mb-4">
            Votre signature a été enregistrée avec succès.
          </p>
          <p className="text-sm text-gray-500">
            Un exemplaire du rapport signé vous sera envoyé par email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="/depannfroid-logo.png" 
              alt="Logo DEPANN'FROID" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-600">DEPANN'FROID</h1>
              <p className="text-gray-600">Signature du rapport d'intervention</p>
            </div>
          </div>
          
          {rapportData && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                <strong>Rapport N°:</strong> {rapportData.numeroRapport}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Client:</strong> {rapportData.client}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {new Date(rapportData.dateIntervention).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </div>

        {/* Zone de signature */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Signez pour valider le rapport
          </h2>
          
          <p className="text-gray-600 mb-6">
            Dessinez votre signature dans le cadre ci-dessous avec votre souris ou votre doigt (sur écran tactile).
          </p>

          <div className="border-2 border-gray-300 rounded-lg mb-4 bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-48 cursor-crosshair'
              }}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={clearSignature}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Effacer
            </button>
            
            <button
              onClick={saveSignature}
              disabled={signing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signing ? 'Enregistrement...' : 'Valider la signature'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            En signant, vous confirmez avoir pris connaissance du rapport d'intervention.
          </p>
        </div>
      </div>
    </div>
  );
}
