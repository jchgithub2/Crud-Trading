import React from 'react';
import TradeItem from './TradeItem';
import { Trade } from '../types/trade';

interface TradeListProps {
    trades: Trade[];
    onEdit: (trade: Trade) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onEdit, onDelete, onCreate }) => {
    // Validación segura del array
    const safeTrades = Array.isArray(trades) ? trades : [];

    if (safeTrades.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No hay operaciones registradas</h3>
                <p className="text-gray-500 mb-6">Comienza registrando tu primera operación de trading</p>
                <button
                    onClick={onCreate}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    ➕ Registrar Primera Operación
                </button>
            </div>
        );
    }

    // Calcular estadísticas rápidas CON VALIDACIÓN
    const totalPnL = safeTrades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
    const winningTrades = safeTrades.filter(trade => (Number(trade.pnl) || 0) > 0).length;
    const winRate = safeTrades.length > 0 ? (winningTrades / safeTrades.length) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📊 Mis Operaciones</h2>
                    <button
                        onClick={onCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                    >
                        <span>➕</span>
                        <span>Nueva Operación</span>
                    </button>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Total Operaciones</div>
                        <div className="text-2xl font-bold text-gray-800">{safeTrades.length}</div>
                    </div>
                    <div className={`p-4 rounded-lg ${totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                        <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            P&L Total
                        </div>
                        <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                            ${(Number(totalPnL) || 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Win Rate</div>
                        <div className="text-2xl font-bold text-gray-800">{(Number(winRate) || 0).toFixed(1)}%</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-sm text-yellow-600 font-medium">Operaciones Ganadoras</div>
                        <div className="text-2xl font-bold text-gray-800">{winningTrades}</div>
                    </div>
                </div>
            </div>

            {/* Lista de operaciones */}
            <div className="space-y-4">
                {safeTrades.map((trade) => (
                    <TradeItem
                        key={trade.id}
                        trade={trade}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Resumen final */}
            <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                    <div className="text-gray-600">
                        Mostrando {safeTrades.length} operaciones
                    </div>
                    <div className="text-sm text-gray-500">
                        Última actualización: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeList;