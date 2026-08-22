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

  const headers = data[1] || data[0] || [];
  const rows = data.slice(2);

  // Función mejorada de Cierre de Sesión
  const handleLogout = async () => {
    // Cierra sesión en NextAuth y redirige forzosamente
    const data = await signOut({ redirect: false, callbackUrl: '/api/auth/signin' });
    window.location.href = data.url || '/api/auth/signin';
  };

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #0b0e14 !important;
        }

        .tabla-scroll::-webkit-scrollbar {
          height: 16px !important;
          display: block !important;
        }

        .tabla-scroll::-webkit-scrollbar-track {
          background: #1c2128 !important;
          border-radius: 8px;
        }

        .tabla-scroll::-webkit-scrollbar-thumb {
          background-color: #8b949e !important;
          border-radius: 8px;
          border: 3px solid #1c2128;
        }

        .tabla-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #ffffff !important;
        }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Base de datos Licencias de Armas</h1>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          Salir
        </button>
      </div>

      {/* Contenedor de Tabla */}
      <div 
        className="tabla-scroll"
        style={{ 
          backgroundColor: '#161b22', 
          border: '1px solid #30363d', 
          borderRadius: '6px', 
          overflowX: 'scroll',
          paddingBottom: '8px'
        }}
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>Cargando registros...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table style={{ width: '100%', minWidth: '2200px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#21262d', borderBottom: '1px solid #30363d', color: '#c9d1d9' }}>
                {headers.map((header, i) => (
                  <th key={i} style={{ padding: '10px 12px', borderRight: '1px solid #30363d', whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid #21262d' }}>
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} style={{ padding: '10px 12px', borderRight: '1px solid #21262d', color: '#8b949e', whiteSpace: 'nowrap' }}>
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
