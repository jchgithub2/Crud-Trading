
import Dashboard from './components/Dashboard';
import React, { useState, useEffect } from 'react';
import './index.css';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import TradeStats from './components/TradeStats';
import { Trade, TradeFormData } from './types/trade';

function CrudApp() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'stats' | 'dashboard'>('trades');

  // Verificar conexión backend y cargar datos
  useEffect(() => {
    const initialize = async () => {
      try {
        const healthResponse = await fetch('http://localhost:5000/api/health');
        if (healthResponse.ok) {
          setBackendStatus('connected');
          await fetchTrades();
          await fetchStats();
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setBackendStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/trades');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTrade = async (tradeData: TradeFormData) => {
    try {
      const response = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (response.ok) {
        await fetchTrades();
        await fetchStats();
        setShowForm(false);
        setEditingTrade(null);
        alert('✅ Operación creada exitosamente!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'No se pudo crear la operación'}`);
      }
    } catch (error) {
      console.error('Error creating trade:', error);
      alert('Error de conexión al crear la operación');
    }
  };

  const handleUpdateTrade = async (tradeData: TradeFormData) => {
    if (!editingTrade) return;

    try {
      const response = await fetch(`http://localhost:5000/api/trades/${editingTrade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (response.ok) {
        await fetchTrades();
        await fetchStats();
        setShowForm(false);
        setEditingTrade(null);
        alert('✅ Operación actualizada exitosamente!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'No se pudo actualizar la operación'}`);
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Error de conexión al actualizar la operación');
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta operación?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/trades/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTrades();
        await fetchStats();
        alert('✅ Operación eliminada exitosamente!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'No se pudo eliminar la operación'}`);
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Error de conexión al eliminar la operación');
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTrade(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Cargando Trading Journal...</p>
        </div>
      </div>
    );
  }

  if (backendStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Backend Desconectado</h1>
          <p className="text-gray-600 mb-6">
            No se puede conectar al servidor backend en <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5000</code>
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
            <p className="font-medium text-yellow-800 mb-2">Para solucionar:</p>
            <ol className="list-decimal pl-5 text-yellow-700 space-y-1">
              <li>Abre una nueva terminal</li>
              <li>Navega a <code className="bg-yellow-100 px-1 rounded">CRUD-TRADING/trading-journal/server</code></li>
              <li>Ejecuta <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
              <li>Recarga esta página (F5)</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="bg-white/20 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Trading Journal Pro</h1>
                <p className="text-blue-100">Sistema profesional de gestión de operaciones</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${backendStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {backendStatus === 'connected' ? '✅ CONECTADO' : '❌ DESCONECTADO'}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Nueva Operación</span>
              </button>

              <a
                href="/"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                ← Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs de Navegación */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('trades')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${activeTab === 'trades'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              📊 Mis Operaciones
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              📈 Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              🎯 Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8">
        {showForm ? (
          <div className="mb-8">
            <TradeForm
              trade={editingTrade}
              onSubmit={editingTrade ? handleUpdateTrade : handleCreateTrade}
              onCancel={handleCancelForm}
            />
          </div>
        ) : null}

        {activeTab === 'trades' && !showForm && (
          <TradeList
            trades={trades}
            onEdit={handleEditTrade}
            onDelete={handleDeleteTrade}
            onCreate={() => setShowForm(true)}
          />
        )}

        {activeTab === 'stats' && !showForm && (
          <TradeStats stats={stats} trades={trades} />
        )}

        {activeTab === 'dashboard' && !showForm && (
          <Dashboard trades={trades} stats={stats} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 mb-4 md:mb-0">
              <p>© 2024 Trading Journal Pro. Sistema CRUD completo.</p>
              <p className="text-sm">Backend: <code className="bg-gray-100 px-1 rounded">http://localhost:5000</code></p>
            </div>
            <div className="flex space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Trades: {trades.length}
              </span>
              {stats && (
                <>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${(Number(stats.summary?.totalPnL) || 0) >= 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    P&L: ${(Number(stats.summary?.totalPnL) || 0).toFixed(2)}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    Win Rate: {(Number(stats.summary?.winRate) || 0).toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CrudApp;