import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CrudApp from './CrudApp';
import './index.css';

function HomePage() {
    const [backendStatus, setBackendStatus] = React.useState<'checking' | 'connected' | 'disconnected'>('checking');

    React.useEffect(() => {
        // Verificar conexión con backend
        fetch('http://localhost:5000/api/health')
            .then(() => setBackendStatus('connected'))
            .catch(() => setBackendStatus('disconnected'));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                        <span className="text-3xl text-white">💰</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Trading Journal Professional
                    </h1>
                    <p className="text-xl text-gray-600">
                        Sistema CRUD completo para operaciones de trading
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Frontend Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center mb-4">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-2xl text-green-600">✅</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Frontend</h2>
                        </div>
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                <span className="font-semibold">URL:</span>{' '}
                                <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">http://localhost:5173</code>
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold">Tecnologías:</span> Vite + React + TypeScript + Tailwind CSS
                            </p>
                            <div className="mt-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    ✅ ACTIVO
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Backend Card */}
                    <div className={`bg-gradient-to-br ${backendStatus === 'connected' ? 'from-blue-50 to-cyan-50 border-blue-200' :
                            backendStatus === 'checking' ? 'from-yellow-50 to-amber-50 border-yellow-200' :
                                'from-red-50 to-pink-50 border-red-200'
                        } border-2 rounded-2xl p-6 shadow-lg`}>
                        <div className="flex items-center mb-4">
                            <div className={`h-12 w-12 ${backendStatus === 'connected' ? 'bg-blue-100' :
                                    backendStatus === 'checking' ? 'bg-yellow-100' :
                                        'bg-red-100'
                                } rounded-full flex items-center justify-center mr-4`}>
                                <span className={`text-2xl ${backendStatus === 'connected' ? 'text-blue-600' :
                                        backendStatus === 'checking' ? 'text-yellow-600' :
                                            'text-red-600'
                                    }`}>
                                    {backendStatus === 'connected' ? '💰' :
                                        backendStatus === 'checking' ? '⏳' : '❌'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Backend</h2>
                        </div>
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                <span className="font-semibold">URL:</span>{' '}
                                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">http://localhost:5000</code>
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold">Tecnologías:</span> Node.js + Express + TypeScript
                            </p>
                            <div className="mt-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${backendStatus === 'connected' ? 'bg-blue-100 text-blue-800' :
                                        backendStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {backendStatus === 'connected' ? 'CONECTADO' :
                                        backendStatus === 'checking' ? 'VERIFICANDO...' : 'DESCONECTADO'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8 mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">✨ Características del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            'CRUD completo de operaciones',
                            'Cálculos automáticos de P&L',
                            'Estadísticas en tiempo real',
                            'Dashboard con métricas',
                            'Filtros y búsqueda avanzada',
                            'Exportación de datos'
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                                <span className="text-green-500 mr-3">✓</span>
                                <span className="text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                        <button
                            onClick={() => window.open('http://localhost:5000/api/trades', '_blank')}
                            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-lg shadow-xl hover:shadow-2xl"
                        >
                            📊 Ver Operaciones (JSON)
                        </button>
                        <button
                            onClick={() => window.open('http://localhost:5000/api/stats', '_blank')}
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-xl hover:shadow-2xl"
                        >
                            📈 Ver Estadísticas (JSON)
                        </button>
                    </div>

                    {/* Botón principal para el CRUD */}
                    <div className="mt-4">
                        <Link
                            to="/crud"
                            className="inline-block px-10 py-5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                        >
                            🚀 ACCEDER AL CRUD COMPLETO
                        </Link>
                    </div>

                    <p className="text-gray-500 mt-8 text-sm">
                        Sistema de trading profesional - Backend corriendo en puerto 5000
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">React 18.x</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TypeScript 5.x</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Tailwind CSS</span>
                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">Node.js + Express</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/crud" element={<CrudApp />} />
            </Routes>
        </Router>
    );
}

export default App;