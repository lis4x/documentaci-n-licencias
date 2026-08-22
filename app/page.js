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
        if (Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Procesa encabezados y filas omitiendo el logo superior
  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-6 font-sans">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white tracking-wide">Panel de Consulta USMS</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-[#e53e3e] hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded transition duration-150 cursor-pointer text-sm shadow"
        >
          Salir
        </button>
      </div>

      {/* Tabla con diseño oscuro original */}
      <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-x-auto shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando registros...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1c2128] border-b border-gray-800 text-gray-300">
                {headers.map((header, i) => (
                  <th key={i} className="p-3 font-semibold border-r border-gray-800 last:border-r-0 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-800/60 hover:bg-[#1f242c] transition-colors">
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
