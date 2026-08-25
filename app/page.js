'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { DATABASES, getDatabasesForSession } from '../lib/databases';


function SinAcceso({ onAction, actionLabel }) {
  return (
    <div style={{ ...pageCenterStyle, flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Sin acceso</h1>
      <p style={{ color: '#8b949e', margin: 0, textAlign: 'center', maxWidth: '360px' }}>
        No pertenecés a ninguna facción autorizada o no tenés un rol habilitado
        dentro de tu facción. Si creés que es un error, contactá a un administrador.
      </p>
      <button onClick={onAction} style={logoutButtonStyle}>{actionLabel}</button>
    </div>
  );
}

function getStatusColor(value) {
  const v = String(value).trim().toUpperCase();
  if (v === 'VENCIDO') return '#f85149';
  if (v === 'VIGENTE') return '#3fb950';
  return undefined;
}

function Dashboard() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const [selectedDb, setSelectedDb] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableDbs =
    status === 'authenticated' ? getDatabasesForSession(session) : [];

  // Cargar datos de la base seleccionada
  useEffect(() => {
    if (status !== 'authenticated' || !selectedDb) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/getData?db=${selectedDb}`, { cache: 'no-store' });
        const result = await res.json();
        if (!cancelled && Array.isArray(result)) {
          setData(result);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [status, selectedDb]);

  const handleLogout = async () => {
    const res = await signOut({ redirect: false, callbackUrl: '/' });
    window.location.href = res.url || '/';
  };

  // --- Estado: verificando sesión ---
  if (status === 'loading') {
    return (
      <div style={pageCenterStyle}>Verificando sesión...</div>
    );
  }

  // --- Estado: sin sesión, rechazado por falta de facción/rol ---
  if (status === 'unauthenticated' && authError) {
    return (
      <SinAcceso
        onAction={() => signIn('discord', { callbackUrl: '/' })}
        actionLabel="Reintentar"
      />
    );
  }

  // --- Estado: sin sesión ---
  if (status === 'unauthenticated') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          fontFamily: 'sans-serif',
          color: '#e6edf3',
          backgroundImage: 'linear-gradient(rgba(11,14,20,0.75), rgba(11,14,20,0.85)), url(/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <img src="/logo-gobierno.png" alt="Gobierno de San Andreas" style={{ width: '64px', height: '64px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Panel de Bases de Datos</h1>
        <button onClick={() => signIn('discord', { callbackUrl: '/' })} style={discordButtonStyle}>
          Iniciar sesión con Discord
        </button>
      </div>
    );
  }

  // --- Estado: autenticado, sin ninguna base disponible para su facción ---
  if (availableDbs.length === 0) {
    return <SinAcceso onAction={handleLogout} actionLabel="Salir" />;
  }

  // --- Estado: autenticado, mostrando el selector de bases ---
  if (!selectedDb) {
    return (
      <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo-gobierno.png" alt="Gobierno de San Andreas" style={{ width: '40px', height: '40px' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Panel de Bases de Datos</h1>
          </div>
          <button onClick={handleLogout} style={logoutButtonStyle}>Salir</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', maxWidth: '900px' }}>
          {availableDbs.map((db) => (
            <button
              key={db.id}
              onClick={() => setSelectedDb(db.id)}
              style={cardButtonStyle}
            >
              {db.id === 'empresas' && (
                <img src="/logo-agencia.png" alt="Agencia de Empresas, Servicios y Transporte" style={{ width: '48px', height: '48px', marginBottom: '10px' }} />
              )}
              {db.id === 'armas' && (
                <img src="/logo-armas.png" alt="Bureau of Firearms and Personal Defense" style={{ width: '48px', height: '48px', marginBottom: '10px' }} />
              )}
              {db.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Estado: mostrando la tabla de la base seleccionada ---
  const dbLabel = availableDbs.find((db) => db.id === selectedDb)?.label || '';
  const headerRowIndex = DATABASES[selectedDb]?.headerRow ?? 1;
  const headers = data[headerRowIndex] || [];
  const rows = data.slice(headerRowIndex + 1);

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e6edf3', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        html, body { margin: 0 !important; padding: 0 !important; background-color: #0b0e14 !important; }
        .tabla-scroll::-webkit-scrollbar { height: 16px !important; display: block !important; }
        .tabla-scroll::-webkit-scrollbar-track { background: #1c2128 !important; border-radius: 8px; }
        .tabla-scroll::-webkit-scrollbar-thumb { background-color: #8b949e !important; border-radius: 8px; border: 3px solid #1c2128; }
        .tabla-scroll::-webkit-scrollbar-thumb:hover { background-color: #ffffff !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedDb(null)} style={backButtonStyle}>&larr; Bases</button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>{dbLabel}</h1>
        </div>
        <button onClick={handleLogout} style={logoutButtonStyle}>Salir</button>
      </div>

      <div
        className="tabla-scroll"
        style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', overflowX: 'scroll', paddingBottom: '8px' }}
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>Cargando registros...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>No se encontraron registros o la tabla está vacía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
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
                  {headers.map((_, colIndex) => {
                    const value = row[colIndex] || '';
                    const statusColor = getStatusColor(value);
                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: '10px 12px',
                          borderRight: '1px solid #21262d',
                          color: statusColor || '#8b949e',
                          fontWeight: statusColor ? '600' : 'normal',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={pageCenterStyle}>Verificando sesión...</div>}>
      <Dashboard />
    </Suspense>
  );
}

const pageCenterStyle = {
  backgroundColor: '#0b0e14',
  color: '#e6edf3',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'sans-serif',
};

const discordButtonStyle = {
  backgroundColor: '#5865F2',
  color: '#ffffff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

const logoutButtonStyle = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
};

const backButtonStyle = {
  backgroundColor: '#21262d',
  color: '#e6edf3',
  border: '1px solid #30363d',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
};

const cardButtonStyle = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  color: '#e6edf3',
  borderRadius: '8px',
  padding: '28px 16px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
