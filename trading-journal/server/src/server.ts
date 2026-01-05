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

// FUNCIÓN CRÍTICA: Convertir datos de MySQL a formato frontend
const formatTradeFromDB = (trade: any) => {
  // Convertir tags de string CSV a array
  let tagsArray: string[] = [];
  if (trade.tags) {
    if (typeof trade.tags === 'string') {
      tagsArray = trade.tags.split(',').filter((tag: string) => tag.trim() !== '');
    } else if (Array.isArray(trade.tags)) {
      tagsArray = trade.tags;
    }
  }

  // Formatear fechas a ISO string
  const formatDateToISO = (dateValue: any): string | null => {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  return {
    id: trade.id,
    symbol: trade.symbol,
    tradeType: trade.trade_type,
    entryPrice: Number(trade.entry_price),      // CONVERTIR A NÚMERO
    exitPrice: Number(trade.exit_price),        // CONVERTIR A NÚMERO
    quantity: Number(trade.quantity),
    pnl: Number(trade.pnl),                     // CONVERTIR A NÚMERO
    pnlPercentage: Number(trade.pnl_percentage), // CONVERTIR A NÚMERO
    entryDate: formatDateToISO(trade.entry_date),
    exitDate: formatDateToISO(trade.exit_date),
    marketCondition: trade.market_condition,
    timeframe: trade.timeframe,
    strategy: trade.strategy,
    notes: trade.notes,
    tags: tagsArray,                           // ARRAY, NO STRING CSV
    emotionalState: trade.emotional_state,
    confidence: trade.confidence ? Number(trade.confidence) : null,
    rating: trade.rating ? Number(trade.rating) : null,
    // Campos opcionales para compatibilidad
    createdAt: trade.created_at ? formatDateToISO(trade.created_at) : null,
    updatedAt: trade.updated_at ? formatDateToISO(trade.updated_at) : null
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

// 3. OBTENER TODOS LOS TRADES - CORREGIDO
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

    const [trades]: any = await pool.execute(query, params);

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

    // CONVERTIR CADA TRADE AL FORMATO CORRECTO
    const formattedTrades = trades.map(formatTradeFromDB);

    res.json({
      success: true,
      count: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      },
      data: formattedTrades  // DATOS CONVERTIDOS
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener operaciones'
    });
  }
});

// 4. OBTENER UN TRADE ESPECÍFICO - CORREGIDO
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

    // CONVERTIR EL TRADE AL FORMATO CORRECTO
    const formattedTrade = formatTradeFromDB(rows[0]);

    res.json({
      success: true,
      data: formattedTrade  // DATO CONVERTIDO
    });
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener operación'
    });
  }
});

// 5. CREAR NUEVO TRADE - MEJORADO
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

    // Asegurar que los números sean números
    const entryPrice = parseFloat(tradeData.entryPrice);
    const exitPrice = parseFloat(tradeData.exitPrice);
    const quantity = parseFloat(tradeData.quantity);

    // Calcular P&L
    const { pnl, pnlPercentage } = calculatePnL(
      entryPrice,
      exitPrice,
      quantity,
      tradeData.tradeType || 'LONG'
    );

    // Procesar tags correctamente
    let tagsValue = null;
    if (tradeData.tags) {
      if (Array.isArray(tradeData.tags)) {
        tagsValue = tradeData.tags.join(',');
      } else if (typeof tradeData.tags === 'string') {
        tagsValue = tradeData.tags;
      }
    }

    // Preparar datos para MySQL
    const newTrade = {
      id: uuidv4(),
      symbol: tradeData.symbol,
      trade_type: tradeData.tradeType || 'LONG',
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity: quantity,
      pnl: pnl,
      pnl_percentage: pnlPercentage,
      entry_date: tradeData.entryDate
        ? new Date(tradeData.entryDate).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' '),
      exit_date: tradeData.exitDate
        ? new Date(tradeData.exitDate).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' '),
      market_condition: tradeData.marketCondition || null,
      timeframe: tradeData.timeframe || null,
      strategy: tradeData.strategy || null,
      notes: tradeData.notes || null,
      tags: tagsValue,
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

    // Devolver el trade creado en formato frontend
    const createdTrade = formatTradeFromDB(newTrade);

    res.status(201).json({
      success: true,
      message: '✅ Operación registrada exitosamente',
      data: createdTrade
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

// 6. ACTUALIZAR TRADE - MEJORADO
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
      const entryPrice = tradeData.entryPrice ? parseFloat(tradeData.entryPrice) : existingTrade.entry_price;
      const exitPrice = tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : existingTrade.exit_price;
      const quantity = tradeData.quantity ? parseFloat(tradeData.quantity) : existingTrade.quantity;
      const tradeType = tradeData.tradeType || existingTrade.trade_type;

      const { pnl, pnlPercentage } = calculatePnL(entryPrice, exitPrice, quantity, tradeType);
      updatedPnL = pnl;
      updatedPnLPercentage = pnlPercentage;
    }

    // Procesar tags
    let tagsValue = existingTrade.tags;
    if (tradeData.tags !== undefined) {
      if (Array.isArray(tradeData.tags)) {
        tagsValue = tradeData.tags.join(',');
      } else if (typeof tradeData.tags === 'string') {
        tagsValue = tradeData.tags;
      } else if (tradeData.tags === null) {
        tagsValue = null;
      }
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
      tags: tagsValue,
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

    // Devolver el trade actualizado en formato frontend
    const updatedTrade = {
      ...updateData,
      id: id
    };
    const formattedTrade = formatTradeFromDB(updatedTrade);

    res.json({
      success: true,
      message: '✅ Operación actualizada exitosamente',
      data: formattedTrade
    });

  } catch (error: any) {
    console.error('Error updating trade:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar operación'
    });
  }
});

// 7. ELIMINAR TRADE (sin cambios necesarios)
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

// 8. ESTADÍSTICAS AVANZADAS - CORREGIDO
app.get('/api/stats', async (req, res) => {
  try {
    // Obtener todos los trades
    const [trades]: any = await pool.execute('SELECT * FROM trades');

    // CONVERTIR TODOS LOS TRADES
    const formattedTrades = trades.map(formatTradeFromDB);

    if (formattedTrades.length === 0) {
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

    const winningTrades = formattedTrades.filter((t: any) => t.pnl > 0);
    const losingTrades = formattedTrades.filter((t: any) => t.pnl < 0);

    const stats = {
      summary: {
        totalTrades: formattedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalPnL: formattedTrades.reduce((sum: number, t: any) => sum + t.pnl, 0),
        winRate: formattedTrades.length > 0
          ? (winningTrades.length / formattedTrades.length) * 100
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
        bestTrade: formattedTrades.length > 0 ? Math.max(...formattedTrades.map((t: any) => t.pnl)) : 0,
        worstTrade: formattedTrades.length > 0 ? Math.min(...formattedTrades.map((t: any) => t.pnl)) : 0,
        largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map((t: any) => t.pnl)) : 0,
        largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map((t: any) => t.pnl)) : 0
      },
      bySymbol: formattedTrades.reduce((acc: any, trade: any) => {
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

// 9. DASHBOARD DATA - CORREGIDO
app.get('/api/dashboard', async (req, res) => {
  try {
    const [recentTrades]: any = await pool.execute(
      'SELECT * FROM trades ORDER BY entry_date DESC LIMIT 5'
    );

    const [allTrades]: any = await pool.execute('SELECT * FROM trades');

    // CONVERTIR LOS TRADES
    const formattedRecentTrades = recentTrades.map(formatTradeFromDB);
    const formattedAllTrades = allTrades.map(formatTradeFromDB);

    const dashboardData = {
      recentTrades: formattedRecentTrades,
      overview: {
        totalTrades: formattedAllTrades.length,
        totalPnL: formattedAllTrades.reduce((sum: number, t: any) => sum + t.pnl, 0),
        winRate: formattedAllTrades.length > 0
          ? (formattedAllTrades.filter((t: any) => t.pnl > 0).length / formattedAllTrades.length) * 100
          : 0
      },
      topSymbols: Object.entries(
        formattedAllTrades.reduce((acc: any, trade: any) => {
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

🔧 PARA FRONTEND:
   Todos los números vienen como números (no strings)
   Las fechas vienen en formato ISO
   Los tags vienen como array (no CSV)
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