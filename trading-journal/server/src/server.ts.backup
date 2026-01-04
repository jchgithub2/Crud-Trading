import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { testConnection } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== FUNCIONES DE AYUDA ==========
const calculatePnL = (entry: number, exit: number, quantity: number, tradeType: string) => {
  const pnl = (exit - entry) * quantity;
  const pnlPercentage = entry > 0 ? ((exit - entry) / entry) * 100 : 0;

  return {
    pnl: tradeType === 'LONG' ? pnl : -pnl,
    pnlPercentage: tradeType === 'LONG' ? pnlPercentage : -pnlPercentage
  };
};

// ========== RUTAS DE LA API ==========

// 1. RAIZ - Información del API
app.get('/', (req, res) => {
  res.json({
    message: '💰 Trading Journal API v2.0',
    version: '2.0.0',
    status: 'online',
    mode: 'MySQL Database (XAMPP)',
    timestamp: new Date().toISOString(),
    database: 'Connected to MySQL via XAMPP'
  });
});

// 2. HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const [tradesCount]: any = await pool.execute('SELECT COUNT(*) as count FROM trades');

    res.json({
      status: 'healthy',
      service: 'Trading Journal API',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      tradesCount: tradesCount[0].count,
      mode: 'mysql-xampp'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database error'
    });
  }
});

// 3. OBTENER TODOS LOS TRADES
app.get('/api/trades', async (req, res) => {
  try {
    const { page = '1', limit = '20', symbol, tradeType } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM trades WHERE 1=1';
    const params: any[] = [];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }

    if (tradeType) {
      query += ' AND trade_type = ?';
      params.push(tradeType);
    }

    query += ' ORDER BY entry_date DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [trades] = await pool.execute(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM trades WHERE 1=1';
    const countParams: any[] = [];

    if (symbol) {
      countQuery += ' AND symbol = ?';
      countParams.push(symbol);
    }

    if (tradeType) {
      countQuery += ' AND trade_type = ?';
      countParams.push(tradeType);
    }

    const [countResult]: any = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      count: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      },
      data: trades
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener operaciones'
    });
  }
});

// 4. OBTENER UN TRADE ESPECÍFICO
app.get('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.execute('SELECT * FROM trades WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Operación no encontrada'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener operación'
    });
  }
});

// 5. CREAR NUEVO TRADE
app.post('/api/trades', async (req, res) => {
  try {
    const tradeData = req.body;
    const { v4: uuidv4 } = require('uuid');

    // Validaciones
    const requiredFields = ['symbol', 'entryPrice', 'exitPrice', 'quantity'];
    const missingFields = requiredFields.filter(field => !tradeData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      });
    }

    // Calcular P&L
    const { pnl, pnlPercentage } = calculatePnL(
      tradeData.entryPrice,
      tradeData.exitPrice,
      tradeData.quantity,
      tradeData.tradeType || 'LONG'
    );

    // Preparar datos para MySQL
    const newTrade = {
      id: uuidv4(),
      symbol: tradeData.symbol,
      trade_type: tradeData.tradeType || 'LONG',
      entry_price: parseFloat(tradeData.entryPrice),
      exit_price: parseFloat(tradeData.exitPrice),
      quantity: parseFloat(tradeData.quantity),
      pnl: pnl,
      pnl_percentage: pnlPercentage,
      entry_date: tradeData.entryDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
      exit_date: tradeData.exitDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
      market_condition: tradeData.marketCondition || null,
      timeframe: tradeData.timeframe || null,
      strategy: tradeData.strategy || null,
      notes: tradeData.notes || null,
      tags: tradeData.tags ? (Array.isArray(tradeData.tags) ? tradeData.tags.join(',') : tradeData.tags) : null,
      emotional_state: tradeData.emotionalState || null,
      confidence: tradeData.confidence ? parseInt(tradeData.confidence) : null,
      rating: tradeData.rating ? parseInt(tradeData.rating) : null
    };

    // Insertar en MySQL
    const query = `
      INSERT INTO trades (
        id, symbol, trade_type, entry_price, exit_price, quantity, 
        pnl, pnl_percentage, entry_date, exit_date, market_condition, 
        timeframe, strategy, notes, tags, emotional_state, confidence, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      newTrade.id, newTrade.symbol, newTrade.trade_type, newTrade.entry_price,
      newTrade.exit_price, newTrade.quantity, newTrade.pnl, newTrade.pnl_percentage,
      newTrade.entry_date, newTrade.exit_date, newTrade.market_condition,
      newTrade.timeframe, newTrade.strategy, newTrade.notes, newTrade.tags,
      newTrade.emotional_state, newTrade.confidence, newTrade.rating
    ];

    await pool.execute(query, params);

    res.status(201).json({
      success: true,
      message: '✅ Operación registrada exitosamente',
      data: newTrade
    });

  } catch (error: any) {
    console.error('Error creating trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 6. ACTUALIZAR TRADE
app.put('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tradeData = req.body;

    // Verificar que existe
    const [existingRows]: any = await pool.execute('SELECT * FROM trades WHERE id = ?', [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Operación no encontrada'
      });
    }

    const existingTrade = existingRows[0];

    // Recalcular P&L si se actualizan precios
    let updatedPnL = existingTrade.pnl;
    let updatedPnLPercentage = existingTrade.pnl_percentage;

    if (tradeData.entryPrice || tradeData.exitPrice || tradeData.quantity || tradeData.tradeType) {
      const entryPrice = tradeData.entryPrice || existingTrade.entry_price;
      const exitPrice = tradeData.exitPrice || existingTrade.exit_price;
      const quantity = tradeData.quantity || existingTrade.quantity;
      const tradeType = tradeData.tradeType || existingTrade.trade_type;

      const { pnl, pnlPercentage } = calculatePnL(entryPrice, exitPrice, quantity, tradeType);
      updatedPnL = pnl;
      updatedPnLPercentage = pnlPercentage;
    }

    // Preparar datos para actualización
    const updateData = {
      symbol: tradeData.symbol || existingTrade.symbol,
      trade_type: tradeData.tradeType || existingTrade.trade_type,
      entry_price: tradeData.entryPrice ? parseFloat(tradeData.entryPrice) : existingTrade.entry_price,
      exit_price: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : existingTrade.exit_price,
      quantity: tradeData.quantity ? parseFloat(tradeData.quantity) : existingTrade.quantity,
      pnl: updatedPnL,
      pnl_percentage: updatedPnLPercentage,
      entry_date: tradeData.entryDate || existingTrade.entry_date,
      exit_date: tradeData.exitDate || existingTrade.exit_date,
      market_condition: tradeData.marketCondition !== undefined ? tradeData.marketCondition : existingTrade.market_condition,
      timeframe: tradeData.timeframe !== undefined ? tradeData.timeframe : existingTrade.timeframe,
      strategy: tradeData.strategy !== undefined ? tradeData.strategy : existingTrade.strategy,
      notes: tradeData.notes !== undefined ? tradeData.notes : existingTrade.notes,
      tags: tradeData.tags !== undefined ? (Array.isArray(tradeData.tags) ? tradeData.tags.join(',') : tradeData.tags) : existingTrade.tags,
      emotional_state: tradeData.emotionalState !== undefined ? tradeData.emotionalState : existingTrade.emotional_state,
      confidence: tradeData.confidence !== undefined ? parseInt(tradeData.confidence) : existingTrade.confidence,
      rating: tradeData.rating !== undefined ? parseInt(tradeData.rating) : existingTrade.rating
    };

    // Query de actualización
    const query = `
      UPDATE trades SET
        symbol = ?, trade_type = ?, entry_price = ?, exit_price = ?, quantity = ?,
        pnl = ?, pnl_percentage = ?, entry_date = ?, exit_date = ?, market_condition = ?,
        timeframe = ?, strategy = ?, notes = ?, tags = ?, emotional_state = ?,
        confidence = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      updateData.symbol, updateData.trade_type, updateData.entry_price, updateData.exit_price,
      updateData.quantity, updateData.pnl, updateData.pnl_percentage, updateData.entry_date,
      updateData.exit_date, updateData.market_condition, updateData.timeframe, updateData.strategy,
      updateData.notes, updateData.tags, updateData.emotional_state, updateData.confidence,
      updateData.rating, id
    ];

    await pool.execute(query, params);

    res.json({
      success: true,
      message: '✅ Operación actualizada exitosamente',
      data: { id, ...updateData }
    });

  } catch (error: any) {
    console.error('Error updating trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar operación'
    });
  }
});

// 7. ELIMINAR TRADE
app.delete('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.execute('DELETE FROM trades WHERE id = ?', [id]);
    const affectedRows = result.affectedRows;

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Operación no encontrada'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar operación'
    });
  }
});

// 8. ESTADÍSTICAS AVANZADAS
app.get('/api/stats', async (req, res) => {
  try {
    // Obtener todos los trades
    const [trades]: any = await pool.execute('SELECT * FROM trades');

    if (trades.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            profitFactor: 0
          },
          performance: {
            bestTrade: 0,
            worstTrade: 0,
            largestWin: 0,
            largestLoss: 0
          },
          bySymbol: {}
        }
      });
    }

    const winningTrades = trades.filter((t: any) => t.pnl > 0);
    const losingTrades = trades.filter((t: any) => t.pnl < 0);

    const stats = {
      summary: {
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalPnL: trades.reduce((sum: number, t: any) => sum + t.pnl, 0),
        winRate: trades.length > 0
          ? (winningTrades.length / trades.length) * 100
          : 0,
        avgWin: winningTrades.length > 0
          ? winningTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / winningTrades.length
          : 0,
        avgLoss: losingTrades.length > 0
          ? losingTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / losingTrades.length
          : 0,
        profitFactor: losingTrades.length > 0
          ? Math.abs(winningTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) /
            losingTrades.reduce((sum: number, t: any) => sum + t.pnl, 0))
          : winningTrades.reduce((sum: number, t: any) => sum + t.pnl, 0)
      },
      performance: {
        bestTrade: trades.length > 0 ? Math.max(...trades.map((t: any) => t.pnl)) : 0,
        worstTrade: trades.length > 0 ? Math.min(...trades.map((t: any) => t.pnl)) : 0,
        largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map((t: any) => t.pnl)) : 0,
        largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map((t: any) => t.pnl)) : 0
      },
      bySymbol: trades.reduce((acc: any, trade: any) => {
        if (!acc[trade.symbol]) {
          acc[trade.symbol] = { trades: 0, pnl: 0, wins: 0 };
        }
        acc[trade.symbol].trades++;
        acc[trade.symbol].pnl += trade.pnl;
        if (trade.pnl > 0) acc[trade.symbol].wins++;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// 9. DASHBOARD DATA
app.get('/api/dashboard', async (req, res) => {
  try {
    const [recentTrades]: any = await pool.execute(
      'SELECT * FROM trades ORDER BY entry_date DESC LIMIT 5'
    );

    const [allTrades]: any = await pool.execute('SELECT * FROM trades');

    const dashboardData = {
      recentTrades,
      overview: {
        totalTrades: allTrades.length,
        totalPnL: allTrades.reduce((sum: number, t: any) => sum + t.pnl, 0),
        winRate: allTrades.length > 0
          ? (allTrades.filter((t: any) => t.pnl > 0).length / allTrades.length) * 100
          : 0
      },
      topSymbols: Object.entries(
        allTrades.reduce((acc: any, trade: any) => {
          acc[trade.symbol] = (acc[trade.symbol] || 0) + trade.pnl;
          return acc;
        }, {})
      )
        .map(([symbol, pnl]) => ({ symbol, pnl }))
        .sort((a: any, b: any) => b.pnl - a.pnl)
        .slice(0, 3)
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos del dashboard'
    });
  }
});

// ========== INICIAR SERVIDOR ==========
const startServer = async () => {
  try {
    // Probar conexión a MySQL
    const dbConnected = await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║           💰 TRADING JOURNAL API v2.0               ║
║         Con MySQL (XAMPP) - Datos Persistentes      ║
╚══════════════════════════════════════════════════════╝

✅ SERVICIO: http://localhost:${PORT}
${dbConnected ? '✅ MYSQL: Conectado a XAMPP' : '❌ MYSQL: Error de conexión'}
📊 DATABASE: ${process.env.DB_NAME || 'trading_journal'}
🔌 HOST: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}
👤 USER: ${process.env.DB_USER || 'root'}

📡 ENDPOINTS:
   • GET    /                 → Información del API
   • GET    /api/health       → Estado + conexión DB
   • GET    /api/trades       → Listar operaciones
   • POST   /api/trades       → Crear operación
   • PUT    /api/trades/:id   → Actualizar operación
   • DELETE /api/trades/:id   → Eliminar operación
   • GET    /api/stats        → Estadísticas
   • GET    /api/dashboard    → Dashboard

🔧 Para desarrollo frontend:
   El frontend React puede conectarse a: http://localhost:${PORT}
      `);
    });

    // Manejo de cierre limpio
    process.on('SIGINT', () => {
      console.log('\n💰 Apagando servidor Trading Journal...');
      server.close(() => {
        console.log('✅ Servidor detenido correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
  }
};

startServer();