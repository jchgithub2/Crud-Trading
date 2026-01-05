import React from 'react';
import { Trade } from '../types/trade';

interface DashboardProps {
    trades: Trade[];
    stats: any;
}

const Dashboard: React.FC<DashboardProps> = ({ trades = [], stats = {} }) => {
    // Validación segura de props
    const safeTrades = Array.isArray(trades) ? trades : [];
    const safeStats = stats || {};

    if (safeTrades.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Dashboard vacío</h3>
                <p className="text-gray-500">Agrega operaciones para ver métricas detalladas</p>
            </div>
        );
    }

    // Calcular métricas con validación
    const totalTrades = safeTrades.length;
    const winningTrades = safeTrades.filter(t => (Number(t.pnl) || 0) > 0).length;
    const losingTrades = safeTrades.filter(t => (Number(t.pnl) || 0) < 0).length;
    const totalPnL = safeTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // Últimos trades
    const recentTrades = [...safeTrades]
        .sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime())
        .slice(0, 5);

    // Mejores y peores trades
    const bestTrades = [...safeTrades]
        .filter(trade => (Number(trade.pnl) || 0) > 0)  // Solo operaciones ganadoras
        .sort((a, b) => (Number(b.pnl) || 0) - (Number(a.pnl) || 0))
        .slice(0, 3);

    const worstTrades = [...safeTrades]
        .filter(trade => (Number(trade.pnl) || 0) < 0)  // Solo operaciones perdedoras
        .sort((a, b) => (Number(a.pnl) || 0) - (Number(b.pnl) || 0))
        .slice(0, 3);

    // Distribución por símbolo
    const symbolDistribution = safeTrades.reduce((acc: Record<string, number>, trade) => {
        const symbol = trade.symbol || 'Unknown';
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
    }, {});

    // Distribución por tipo
    const typeDistribution = {
        LONG: safeTrades.filter(t => t.tradeType === 'LONG').length,
        SHORT: safeTrades.filter(t => t.tradeType === 'SHORT').length
    };

    // Métricas de rendimiento
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const summary = safeStats.summary || {};
    const avgWin = Number(summary.avgWin) || 0;
    const avgLoss = Number(summary.avgLoss) || 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin) / Math.abs(avgLoss) : avgWin;

    return (
        <div className="space-y-6">
            {/* Header del Dashboard */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">📊 Dashboard de Rendimiento</h2>
                <p className="text-blue-100">Visión general de tu actividad de trading</p>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-2xl text-blue-600">📈</span>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Total Operaciones</div>
                            <div className="text-2xl font-bold text-gray-800">{totalTrades}</div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl shadow-lg ${totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center mr-4 ${totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <span className={`text-2xl ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalPnL >= 0 ? '💰' : '💸'}
                            </span>
                        </div>
                        <div>
                            <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                P&L Total
                            </div>
                            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                ${totalPnL.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center">
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-2xl text-purple-600">🎯</span>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Win Rate</div>
                            <div className="text-2xl font-bold text-gray-800">{winRate.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center">
                        <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-2xl text-yellow-600">⚡</span>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Avg P&L</div>
                            <div className={`text-2xl font-bold ${avgPnL >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                ${avgPnL.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por Tipo */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Distribución por Tipo</h3>
                    <div className="flex items-center justify-center h-48">
                        <div className="relative w-48 h-48">
                            {/* Gráfico de dona simple */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{totalTrades}</div>
                                    <div className="text-sm text-gray-500">Operaciones</div>
                                </div>
                            </div>

                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="20"
                                    strokeDasharray={`${totalTrades > 0 ? (typeDistribution.LONG / totalTrades) * 283 : 0} 283`}
                                />
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="none"
                                    stroke="#EF4444"
                                    strokeWidth="20"
                                    strokeDasharray={`${totalTrades > 0 ? (typeDistribution.SHORT / totalTrades) * 283 : 0} 283`}
                                    strokeDashoffset={`${totalTrades > 0 ? -(typeDistribution.LONG / totalTrades) * 283 : 0}`}
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="flex justify-center space-x-8 mt-6">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">LONG: {typeDistribution.LONG}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">SHORT: {typeDistribution.SHORT}</span>
                        </div>
                    </div>
                </div>

                {/* Top Activos */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">🎯 Activos Más Operados</h3>
                    <div className="space-y-4">
                        {Object.entries(symbolDistribution)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .slice(0, 5)
                            .map(([symbol, count]: any) => {
                                const percentage = totalTrades > 0 ? (count / totalTrades) * 100 : 0;
                                return (
                                    <div key={symbol} className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{symbol}</span>
                                            <span className="text-gray-600">{count} ops ({(percentage || 0).toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Mejores y Peores Operaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mejores Operaciones */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">🏆 Mejores Operaciones</h3>
                    <div className="space-y-4">
                        {bestTrades.map((trade, index) => {
                            const pnlValue = Number(trade.pnl) || 0;
                            return (
                                <div key={trade.id || index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="text-2xl mr-3">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </div>
                                        <div>
                                            <div className="font-medium">{trade.symbol || 'N/A'}</div>
                                            <div className="text-sm text-gray-600">
                                                {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'Sin fecha'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-green-600 font-bold text-lg">
                                        +${pnlValue.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Peores Operaciones */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">📉 Peores Operaciones</h3>
                    <div className="space-y-4">
                        {worstTrades.map((trade, index) => {
                            const pnlValue = Number(trade.pnl) || 0;
                            return (
                                <div key={trade.id || index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="text-2xl mr-3">
                                            {index === 0 ? '😞' : index === 1 ? '😟' : '😕'}
                                        </div>
                                        <div>
                                            <div className="font-medium">{trade.symbol || 'N/A'}</div>
                                            <div className="text-sm text-gray-600">
                                                {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'Sin fecha'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-red-600 font-bold text-lg">
                                        ${pnlValue.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Operaciones Recientes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">🕒 Operaciones Recientes</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 text-gray-600 font-medium">Fecha</th>
                                <th className="text-left py-3 text-gray-600 font-medium">Activo</th>
                                <th className="text-left py-3 text-gray-600 font-medium">Tipo</th>
                                <th className="text-left py-3 text-gray-600 font-medium">Entrada</th>
                                <th className="text-left py-3 text-gray-600 font-medium">Salida</th>
                                <th className="text-left py-3 text-gray-600 font-medium">P&L</th>
                                <th className="text-left py-3 text-gray-600 font-medium">Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTrades.map((trade) => {
                                const pnlValue = Number(trade.pnl) || 0;
                                const entryPrice = Number(trade.entryPrice) || 0;
                                const exitPrice = Number(trade.exitPrice) || 0;

                                return (
                                    <tr key={trade.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3">
                                            {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-3 font-medium">{trade.symbol || 'N/A'}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${trade.tradeType === 'LONG'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {trade.tradeType || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3">${entryPrice.toFixed(4)}</td>
                                        <td className="py-3">${exitPrice.toFixed(4)}</td>
                                        <td className={`py-3 font-medium ${pnlValue >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            ${pnlValue.toFixed(2)}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${pnlValue >= 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {pnlValue >= 0 ? 'GANANCIA' : 'PÉRDIDA'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights y Recomendaciones */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">💡 Insights y Recomendaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-lg font-medium text-blue-600 mb-2">🎯 Estrategia</div>
                        <p className="text-gray-600">
                            {winRate > 70
                                ? "Excelente desempeño! Mantén tu estrategia actual."
                                : winRate > 50
                                    ? "Rendimiento positivo. Analiza tus mejores operaciones."
                                    : "Considera revisar tu estrategia de entrada/salida."}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-lg font-medium text-green-600 mb-2">💰 Gestión de Riesgo</div>
                        <p className="text-gray-600">
                            {profitFactor > 2
                                ? "Excelente ratio ganancia/pérdida. ¡Sigue así!"
                                : profitFactor > 1.5
                                    ? "Ratio aceptable. Podrías mejorar tu risk/reward."
                                    : "Considera mejorar tu gestión de riesgo."}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-lg font-medium text-purple-600 mb-2">📊 Diversificación</div>
                        <p className="text-gray-600">
                            {Object.keys(symbolDistribution).length > 3
                                ? "Buena diversificación de activos."
                                : "Considera diversificar en más activos para reducir riesgo."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;