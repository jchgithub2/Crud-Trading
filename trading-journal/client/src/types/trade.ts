export interface Trade {
    id: string;
    symbol: string;
    tradeType: 'LONG' | 'SHORT';
    entryPrice: number | string;
    exitPrice: number | string;
    quantity: number | string;
    pnl: number | string;
    pnlPercentage: number | string;
    entryDate: string;
    exitDate: string;
    marketCondition?: string;
    timeframe?: string;
    strategy?: string;
    notes?: string;
    tags: string[];
    emotionalState?: string;
    confidence?: number;
    rating?: number;
    createdAt: string;
    updatedAt: string;
}

export interface TradeFormData {
    symbol: string;
    tradeType: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    entryDate: string;
    exitDate: string;
    marketCondition?: string;
    timeframe?: string;
    strategy?: string;
    notes?: string;
    tags?: string[];
    emotionalState?: string;
    confidence?: number;
    rating?: number;
}

export interface TradeStats {
    summary: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        totalPnL: number;
        winRate: number;
        avgWin: number;
        avgLoss: number;
        profitFactor: number;
    };
    performance: {
        bestTrade: number;
        worstTrade: number;
        largestWin: number;
        largestLoss: number;
    };
    bySymbol?: Record<string, any>;
}