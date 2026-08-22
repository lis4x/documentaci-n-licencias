'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/getData', { cache: 'no-store' });
        const result = await res.json();

        if (Array.isArray(result) && result.length > 0) {
          // Filtra filas completamente vacías
          const cleanRows = result.filter(row => row.some(cell => cell && cell.toString().trim() !== ''));
          setData(cleanRows);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Separa encabezados (Fila 2 del Sheet) y los registros
  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-6">
      {/* Barra superior */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Panel de Consulta USMS</h1>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm transition"
        >
          Salir
        </button>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-[#111827] border border-gray-800 rounded-lg overflow-x-auto shadow-lg">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando registros...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-[#1f2937]">
                {headers.map((header, index) => (
                  <th key={index} className="p-3 font-semibold text-gray-200 border-r border-gray-800 last:border-r-0 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} className="p-3 border-r border-gray-800/40 last:border-r-0 text-gray-300 whitespace-nowrap">
                      {row[colIndex] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
