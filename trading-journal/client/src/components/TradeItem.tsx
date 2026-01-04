import React from 'react';
import { Trade } from '../types/trade';

interface TradeItemProps {
    trade: Trade;
    onEdit: (trade: Trade) => void;
    onDelete: (id: string) => void;
}

const TradeItem: React.FC<TradeItemProps> = ({ trade, onEdit, onDelete }) => {
    // Valores seguros con conversión a número
    const pnlValue = Number(trade.pnl) || 0;
    const pnlPercentage = Number(trade.pnlPercentage) || 0;
    const entryPrice = Number(trade.entryPrice) || 0;
    const exitPrice = Number(trade.exitPrice) || 0;
    const quantity = Number(trade.quantity) || 0;
    const safeTags = Array.isArray(trade.tags) ? trade.tags : [];

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sin fecha';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${trade.tradeType === 'LONG'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {trade.tradeType === 'LONG' ? '📈 LONG' : '📉 SHORT'}
                        </span>
                        <span className="font-bold text-lg text-gray-800">{trade.symbol || 'N/A'}</span>
                    </div>
                    <div className={`text-lg font-bold ${pnlValue >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {pnlValue >= 0 ? '▲' : '▼'} ${pnlValue.toFixed(2)}
                        <span className="text-sm ml-2">({pnlPercentage.toFixed(2)}%)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <div className="text-sm text-gray-500">Entrada</div>
                        <div className="font-medium">${entryPrice.toFixed(4)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Salida</div>
                        <div className="font-medium">${exitPrice.toFixed(4)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Cantidad</div>
                        <div className="font-medium">{quantity.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Fecha</div>
                        <div className="font-medium">{formatDate(trade.entryDate)}</div>
                    </div>
                </div>

                {safeTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {safeTags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center space-x-4">
                        {trade.strategy && (
                            <span className="text-sm text-gray-600">
                                <span className="font-medium">Estrategia:</span> {trade.strategy}
                            </span>
                        )}
                        {trade.timeframe && (
                            <span className="text-sm text-gray-600">
                                <span className="font-medium">TF:</span> {trade.timeframe}
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => onEdit(trade)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => onDelete(trade.id || '')}
                            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeItem;