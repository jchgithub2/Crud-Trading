import React, { useState, useEffect } from 'react';
import { Trade, TradeFormData } from '../types/trade';

interface TradeFormProps {
    trade?: Trade | null;
    onSubmit: (tradeData: TradeFormData) => Promise<void>;
    onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ trade, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<TradeFormData>({
        symbol: '',
        tradeType: 'LONG',
        entryPrice: 0,
        exitPrice: 0,
        quantity: 0,
        entryDate: new Date().toISOString().split('T')[0],
        exitDate: new Date().toISOString().split('T')[0],
        marketCondition: '',
        timeframe: '',
        strategy: '',
        notes: '',
        tags: [],
        emotionalState: '',
        confidence: 5,
        rating: 3
    });

    const [tagsInput, setTagsInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (trade) {
            setFormData({
                symbol: trade.symbol,
                tradeType: trade.tradeType,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                quantity: trade.quantity,
                entryDate: trade.entryDate.split('T')[0],
                exitDate: trade.exitDate.split('T')[0],
                marketCondition: trade.marketCondition || '',
                timeframe: trade.timeframe || '',
                strategy: trade.strategy || '',
                notes: trade.notes || '',
                tags: trade.tags || [],
                emotionalState: trade.emotionalState || '',
                confidence: trade.confidence || 5,
                rating: trade.rating || 3
            });
            setTagsInput(trade.tags?.join(', ') || '');
        }
    }, [trade]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'entryPrice' || name === 'exitPrice' || name === 'quantity' || name === 'confidence' || name === 'rating') {
            setFormData({
                ...formData,
                [name]: parseFloat(value) || 0
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTagsInput(value);
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        setFormData({ ...formData, tags });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculatePnL = () => {
        const pnl = (formData.exitPrice - formData.entryPrice) * formData.quantity;
        const pnlPercentage = formData.entryPrice > 0
            ? ((formData.exitPrice - formData.entryPrice) / formData.entryPrice) * 100
            : 0;

        return {
            pnl: formData.tradeType === 'LONG' ? pnl : -pnl,
            pnlPercentage: formData.tradeType === 'LONG' ? pnlPercentage : -pnlPercentage
        };
    };

    const pnlData = calculatePnL();

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {trade ? '📝 Editar Operación' : '➕ Nueva Operación'}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna 1 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Símbolo/Activo *
                            </label>
                            <input
                                type="text"
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: BTC/USDT, AAPL, EUR/USD"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Operación *
                            </label>
                            <select
                                name="tradeType"
                                value={formData.tradeType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="LONG">LONG (Compra)</option>
                                <option value="SHORT">SHORT (Venta)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio de Entrada *
                            </label>
                            <input
                                type="number"
                                name="entryPrice"
                                value={formData.entryPrice}
                                onChange={handleInputChange}
                                step="0.0001"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio de Salida *
                            </label>
                            <input
                                type="number"
                                name="exitPrice"
                                value={formData.exitPrice}
                                onChange={handleInputChange}
                                step="0.0001"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                step="0.0001"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Columna 2 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Entrada *
                            </label>
                            <input
                                type="date"
                                name="entryDate"
                                value={formData.entryDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Salida *
                            </label>
                            <input
                                type="date"
                                name="exitDate"
                                value={formData.exitDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condición del Mercado
                            </label>
                            <select
                                name="marketCondition"
                                value={formData.marketCondition}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Trending">Tendencia</option>
                                <option value="Ranging">Rango</option>
                                <option value="Volatile">Volátil</option>
                                <option value="Sideways">Lateral</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timeframe
                            </label>
                            <input
                                type="text"
                                name="timeframe"
                                value={formData.timeframe}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: 1H, 4H, 1D"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estrategia
                            </label>
                            <input
                                type="text"
                                name="strategy"
                                value={formData.strategy}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Breakout, Scalping, Swing"
                            />
                        </div>
                    </div>
                </div>

                {/* Tags y Emociones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (separados por coma)
                        </label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={handleTagsChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="bitcoin, trend, breakout"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ej: bitcoin, swing-trade, breakout, scalping</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado Emocional
                        </label>
                        <select
                            name="emotionalState"
                            value={formData.emotionalState}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Confident">Confiado</option>
                            <option value="Patient">Paciente</option>
                            <option value="Nervous">Nervioso</option>
                            <option value="Excited">Emocionado</option>
                            <option value="Calm">Tranquilo</option>
                            <option value="Frustrated">Frustrado</option>
                            <option value="Optimistic">Optimista</option>
                        </select>
                    </div>
                </div>

                {/* Confianza y Rating */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confianza (1-10): <span className="font-bold">{formData.confidence}</span>
                        </label>
                        <input
                            type="range"
                            name="confidence"
                            min="1"
                            max="10"
                            value={formData.confidence}
                            onChange={handleInputChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>1 (Baja)</span>
                            <span>5 (Media)</span>
                            <span>10 (Alta)</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating de la Operación (1-5)
                        </label>
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className={`text-3xl ${star <= (formData.rating || 0) ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400`}
                                >
                                    ★
                                </button>
                            ))}
                            <span className="ml-2 text-gray-600">
                                {formData.rating === 1 && 'Muy mala'}
                                {formData.rating === 2 && 'Mala'}
                                {formData.rating === 3 && 'Regular'}
                                {formData.rating === 4 && 'Buena'}
                                {formData.rating === 5 && 'Excelente'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas y Observaciones
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notas sobre la operación, lecciones aprendidas, qué funcionó bien, qué mejorar..."
                    />
                </div>

                {/* Previsualización de P&L */}
                <div className={`p-4 rounded-lg border-2 ${pnlData.pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-medium text-gray-700">P&L Estimado:</span>
                            <div className="text-2xl font-bold mt-1">
                                <span className={pnlData.pnl >= 0 ? 'text-green-700' : 'text-red-700'}>
                                    {pnlData.pnl >= 0 ? '📈' : '📉'} ${pnlData.pnl.toFixed(2)}
                                </span>
                                <span className={`ml-2 text-lg ${pnlData.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ({pnlData.pnlPercentage.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Operación:</span> {formData.tradeType === 'LONG' ? 'Compra' : 'Venta'}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Cantidad:</span> {formData.quantity}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Diferencia:</span> ${(formData.exitPrice - formData.entryPrice).toFixed(4)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            <>
                                {trade ? '💾 Actualizar Operación' : '✅ Crear Operación'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TradeForm;