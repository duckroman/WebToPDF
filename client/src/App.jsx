import { useState } from 'react';
import { Download } from 'lucide-react';


function App() {
  const [url, setUrl] = useState('');
  const [followLinks, setFollowLinks] = useState(false);
  const [maxDepth, setMaxDepth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPdfs, setGeneratedPdfs] = useState([]); // To store the list of PDF filenames from the server
  const [requestId, setRequestId] = useState(null); // To store the ID of the current capture process

  const handleCapture = async () => {
    setError('');
    setGeneratedPdfs([]); // Clear previous results
    setLoading(true);
    const newRequestId = `client_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRequestId(newRequestId); // Set client-generated requestId immediately

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/pdf`, { // Usar variable de entorno para la URL del backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, followLinks, maxDepth, requestId: newRequestId }), // Added new parameters including client-generated requestId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Something went wrong during PDF generation.');
      }

      const data = await response.json();
      setGeneratedPdfs(data.pdfFiles); // Store the list of generated PDF filenames
      setRequestId(data.requestId || null); // Store the requestId received from the server
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleStopCapture = async () => {
    if (!requestId) return;

    setLoading(false); // Stop loading animation immediately on client side
    setError(''); // Clear any previous errors

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/stop-capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send stop signal to server.');
        }

        console.log(`Stop signal sent for requestId: ${requestId}`);
        // The server will stop the process and return what it has,
        // The client will display whatever PDFs were generated up to this point.
        setRequestId(null); // Clear requestId as process is stopping
    } catch (err) {
        console.error('Error stopping capture:', err);
        setError(err.message);
    }
  };

  const handleNewExploration = () => {
    setUrl('');
    setFollowLinks(false);
    setMaxDepth(1);
    setLoading(false);
    setError('');
    setGeneratedPdfs([]);
    setRequestId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Convertidor Web a PDF</h1>
        <p className="text-center text-gray-600 mb-6">
          Introduce una URL para capturar páginas completas en PDF, opcionalmente siguiendo enlaces.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="url"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ej., https://www.ejemplo.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleCapture}
            disabled={!url || loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generando PDFs...' : 'Generar PDFs'}
          </button>
        </div>

        {/* Controles para Seguir Enlaces y Profundidad Máxima */}
        <div className="flex items-center gap-4 mb-6 justify-center">
            <label htmlFor="followLinks" className="flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    id="followLinks"
                    checked={followLinks}
                    onChange={(e) => setFollowLinks(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                />
               <span className="ml-2 text-gray-700">Seguir Enlaces</span>
            </label>
            {followLinks && (
                <label htmlFor="maxDepth" className="flex items-center">
                    <span className="mr-2 text-gray-700">Profundidad Máx.:</span>
                    <input
                        type="number"
                        id="maxDepth"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                        min="1"
                        max="5" // Set a reasonable max to prevent excessive crawling
                        className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </label>
            )}

    {/* By: © JRC 2025 en esquina inferior derecha */}
    <p className="absolute bottom-0 right-0 text-sm text-gray-600 pr-4 pb-2">© JRC 2025</p>

        </div>

        {loading && (
          <div className="text-center text-blue-600 mb-4">
            <p>Generando PDFs, por favor espera. Esto puede tomar un tiempo para múltiples páginas.</p>
            {/* Indicador de progreso simple */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            {loading && ( // Show stop button immediately when loading starts
                <button
                    onClick={handleStopCapture}
                    className="mt-4 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300"
                >
                    Detener Captura
                </button>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {(generatedPdfs.length > 0 || !loading && requestId) && ( // Show generated PDFs or if stopped
          <div className="mt-6 border border-gray-300 rounded-md overflow-hidden p-3 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 p-3">PDFs Generados:</h3>
            {generatedPdfs.length > 0 ? (
                <ul className="list-disc pl-5">
                {generatedPdfs.map((filename, index) => (
                    <li key={index} className="text-gray-700">
                        <a href={`${import.meta.env.VITE_BACKEND_URL}/download-pdf/${filename}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {filename}
                        </a>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-gray-700 pl-5">No se generaron PDFs en esta sesión (o el proceso fue detenido antes de completar el primer PDF).</p>
            )}
            <p className="mt-4 text-sm text-gray-600">
                Haz clic en los nombres de archivo para descargar los PDFs generados.
            </p>
            <button
                onClick={handleNewExploration}
                className="mt-4 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-300"
            >
                Nueva Exploración
            </button>
          </div>
        )}
      </div>
    </div>
  );

}

export default App;