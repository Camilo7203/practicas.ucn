import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Download } from 'lucide-react';

interface CSVData {
  headers: string[];
  rows: Array<Record<string, string>>;
}

interface CSVUploadProps {
  onUpload: (data: CSVData) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const parseCSV = (csvText: string): CSVData => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos un encabezado y una fila de datos');
    }

    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    // Parse rows
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return { headers, rows };
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.headers.length === 0) {
        throw new Error('No se encontraron encabezados en el archivo');
      }
      
      if (data.rows.length === 0) {
        throw new Error('No se encontraron datos en el archivo');
      }

      setCsvData(data);
      onUpload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'telefono,nombre,apellido,empresa,variable1,variable2\n+5491234567890,Juan,Pérez,Empresa SA,valor1,valor2\n+5491234567891,María,González,Empresa SB,valor3,valor4';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_campana.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setCsvData(null);
    setError('');
  };

  if (csvData) {
    return (
      <div className="space-y-4">
        {/* Success State */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-green-400 font-medium">Archivo cargado exitosamente</h4>
                <p className="text-green-300/80 text-sm">
                  {csvData.rows.length} filas encontradas con {csvData.headers.length} columnas
                </p>
              </div>
            </div>
            <button
              onClick={clearData}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Data Preview */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Vista previa de datos</h4>
          
          {/* Headers */}
          <div className="mb-3">
            <p className="text-white/70 text-sm mb-2">Columnas encontradas:</p>
            <div className="flex flex-wrap gap-2">
              {csvData.headers.map((header, index) => (
                <span
                  key={index}
                  className="bg-accent/20 text-accent px-2 py-1 rounded text-sm"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>

          {/* Sample rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  {csvData.headers.map((header, index) => (
                    <th key={index} className="text-left text-white/70 py-2 px-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 3).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-white/10">
                    {csvData.headers.map((header, colIndex) => (
                      <td key={colIndex} className="text-white py-2 px-3">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.rows.length > 3 && (
              <p className="text-white/60 text-sm mt-2 text-center">
                ... y {csvData.rows.length - 3} filas más
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-white/20 hover:border-accent/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white/70">Procesando archivo...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-white/70" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">
                Arrastra tu archivo CSV aquí
              </h3>
              <p className="text-white/60 text-sm mb-4">
                O haz clic para seleccionar un archivo
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 inline-block"
              >
                Seleccionar archivo
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Template Download */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-blue-400 font-medium mb-1">¿No tienes un archivo CSV?</h4>
            <p className="text-blue-300/80 text-sm">
              Descarga nuestra plantilla para crear tu archivo
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar plantilla</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">📋 Formato requerido</h4>
        <ul className="text-white/70 text-sm space-y-1">
          <li>• El archivo debe estar en formato CSV (separado por comas)</li>
          <li>• La primera fila debe contener los nombres de las columnas</li>
          <li>• Debe incluir una columna con números de teléfono (con código de país)</li>
          <li>• Incluye columnas para cada variable que uses en tu plantilla</li>
        </ul>
      </div>
    </div>
  );
};

export default CSVUpload;