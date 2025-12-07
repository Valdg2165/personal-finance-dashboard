import csv from 'csv-parser';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import crypto from 'crypto';

// Generate hash for deduplication
export const generateImportHash = (transaction) => {
  const hashString = `${transaction.date}|${transaction.amount}|${transaction.description}`.toLowerCase();
  return crypto.createHash('md5').update(hashString).digest('hex');
};

// Parse CSV file
export const parseCSV = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(fileBuffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Parse Excel file with exceljs (safer alternative)
export const parseExcel = async (fileBuffer) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const worksheet = workbook.worksheets[0];
    const data = [];
    
    // Get headers from first row
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value);
    });
    
    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.value;
      });
      
      data.push(rowData);
    });
    
    return data;
  } catch (error) {
    throw new Error('Failed to parse Excel file: ' + error.message);
  }
};

// Normalize Revolut CSV format
export const normalizeRevolutTransaction = (row) => {
  // Revolut format: Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance
  const amount = parseFloat(row.Amount || row.amount || 0);
  const fee = parseFloat(row.Fee || row.fee || 0);
  const netAmount = amount - fee;

  return {
    date: new Date(row['Completed Date'] || row['Started Date'] || row.Date || row.date),
    description: row.Description || row.description || 'Unknown',
    amount: Math.abs(netAmount),
    type: netAmount >= 0 ? 'income' : 'expense',
    currency: row.Currency || row.currency || 'EUR',
    merchant: {
      name: row.Description || row.description || 'Unknown'
    },
    rawData: row
  };
};

// Generic transaction normalizer (for other bank formats)
export const normalizeGenericTransaction = (row) => {
  // Try to detect common column names
  const dateField = row.Date || row.date || row['Transaction Date'] || row.datetime;
  const descField = row.Description || row.description || row.Label || row.label;
  const amountField = parseFloat(row.Amount || row.amount || row.Value || row.value || 0);
  
  return {
    date: new Date(dateField),
    description: descField || 'Unknown',
    amount: Math.abs(amountField),
    type: amountField >= 0 ? 'income' : 'expense',
    currency: row.Currency || row.currency || 'EUR',
    merchant: {
      name: descField || 'Unknown'
    },
    rawData: row
  };
};

// Auto-detect bank format
export const detectBankFormat = (headers) => {
  const headerStr = headers.join('|').toLowerCase();
  
  if (headerStr.includes('completed date') || headerStr.includes('started date')) {
    return 'revolut';
  }
  
  return 'generic';
};
