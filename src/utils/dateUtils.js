// src/utils/dateUtils.js
// A comprehensive date parsing utility to handle various date formats in receipts

/**
 * Parse various date formats commonly found in receipts and bills
 * @param {string} dateStr - The date string to parse
 * @param {boolean} assumeCurrentYear - Whether to assume current year for ambiguous dates
 * @returns {Date} - Parsed date or current date if parsing fails
 */
export const parseBillDate = (dateStr, assumeCurrentYear = true) => {
    if (!dateStr) {
      console.log('Empty date string, using current date');
      return new Date();
    }
    
    // Remove any non-date characters
    dateStr = String(dateStr).trim();
    console.log(`Attempting to parse date: "${dateStr}"`);
    
    const currentYear = new Date().getFullYear();
    
    try {
      // Special handling for receipt date format "25/04/04" (DD/MM/YY)
      // This is the format used in Real Atlantic Superstore receipt
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
        const parts = dateStr.split('/');
        
        // We need to determine if this is DD/MM/YY or MM/DD/YY
        // For receipt data, DD/MM/YY is more common internationally
        const firstNum = parseInt(parts[0], 10);
        const secondNum = parseInt(parts[1], 10);
        const yearPart = parts[2];
        
        // If first number is > 12, it must be day (DD/MM/YY)
        if (firstNum > 12 && secondNum <= 12) {
          const day = firstNum;
          const month = secondNum - 1; // JS months are 0-indexed
          
          // Important: For recent receipts, assume current year if the date would be in the past
          let year;
          if (assumeCurrentYear) {
            // For two-digit years, interpret based on current year
            year = parseInt('20' + yearPart, 10);
            const tempDate = new Date(year, month, day);
            
            // If the resulting date is more than 1 year in the past, assume it's current year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            if (tempDate < oneYearAgo) {
              year = currentYear;
              console.log(`Adjusted year to current year (${currentYear}) for date that would be too old`);
            }
          } else {
            year = parseInt('20' + yearPart, 10);
          }
          
          const date = new Date(year, month, day);
          console.log(`Parsed in DD/MM/YY format: ${date.toISOString()}`);
          return date;
        }
        // If second number is > 12, it must be day (MM/DD/YY)
        else if (secondNum > 12 && firstNum <= 12) {
          const month = firstNum - 1;
          const day = secondNum;
          
          // Similar year handling as above
          let year;
          if (assumeCurrentYear) {
            year = parseInt('20' + yearPart, 10);
            const tempDate = new Date(year, month, day);
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            if (tempDate < oneYearAgo) {
              year = currentYear;
              console.log(`Adjusted year to current year (${currentYear}) for date that would be too old`);
            }
          } else {
            year = parseInt('20' + yearPart, 10);
          }
          
          const date = new Date(year, month, day);
          console.log(`Parsed in MM/DD/YY format: ${date.toISOString()}`);
          return date;
        }
        // Ambiguous case: both numbers <= 12
        else {
          // For receipts, we'll assume DD/MM/YY as it's more common internationally
          const day = firstNum;
          const month = secondNum - 1;
          
          // Year handling
          let year;
          if (assumeCurrentYear) {
            year = parseInt('20' + yearPart, 10);
            const tempDate = new Date(year, month, day);
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            if (tempDate < oneYearAgo) {
              year = currentYear;
              console.log(`Adjusted year to current year (${currentYear}) for date that would be too old`);
            }
          } else {
            year = parseInt('20' + yearPart, 10);
          }
          
          const date = new Date(year, month, day);
          console.log(`Parsed ambiguous date as DD/MM/YY format: ${date.toISOString()}`);
          return date;
        }
      }
      
      // Format: "25/01/14 15:14:16" (DD/MM/YY HH:MM:SS)
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}$/)) {
        const datePart = dateStr.split(' ')[0];
        const parts = datePart.split('/');
        // Assume 20xx for year
        const year = parseInt('20' + parts[2], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[0], 10);
        const date = new Date(year, month, day);
        console.log(`Parsed DD/MM/YY HH:MM:SS format: ${date.toISOString()}`);
        return date;
      }
      
      // Format: "2025-03-19" (YYYY-MM-DD) - ISO format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        console.log(`Parsed YYYY-MM-DD format: ${date.toISOString()}`);
        return date;
      }
      
      // Format: "25/04/2025" (DD/MM/YYYY)
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        const year = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[0], 10);
        const date = new Date(year, month, day);
        console.log(`Parsed DD/MM/YYYY format: ${date.toISOString()}`);
        return date;
      }
      
      // Format: "04/25/2025" (MM/DD/YYYY) - US format
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        
        // If first number is > 12, it must be day (DD/MM/YYYY)
        if (parseInt(parts[0], 10) > 12) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          console.log(`Parsed as DD/MM/YYYY format: ${date.toISOString()}`);
          return date;
        } else {
          // Assume MM/DD/YYYY
          const year = parseInt(parts[2], 10);
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          const date = new Date(year, month, day);
          console.log(`Parsed MM/DD/YYYY format: ${date.toISOString()}`);
          return date;
        }
      }
      
      // Try direct parsing as a fallback
      const directDate = new Date(dateStr);
      if (!isNaN(directDate.getTime())) {
        console.log(`Parsed with direct Date constructor: ${directDate.toISOString()}`);
        return directDate;
      }
      
      // If we reach here, couldn't parse the date, return today
      console.warn('Failed to parse date:', dateStr);
      return new Date();
    } catch (e) {
      console.warn('Exception parsing date:', dateStr, e);
      return new Date(); // Default to today
    }
  };
  
  /**
   * Calculate and return date range for the last N days
   * @param {number} days - Number of days to go back
   * @returns {Object} - { startDate, endDate }
   */
  export const getDateRangeForLastDays = (days) => {
    const endDate = new Date(); // Current date
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return { startDate, endDate };
  };
  
  /**
   * Get start and end dates for weeks
   * @param {number} weeksAgo - Number of weeks ago (0 = current week)
   * @returns {Object} - { startDate, endDate }
   */
  export const getWeekDateRange = (weeksAgo) => {
    const today = new Date();
    
    // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    const currentDayOfWeek = today.getDay();
    
    // Calculate days to go back to get to Sunday of the current week
    const daysToLastSunday = currentDayOfWeek;
    
    // Calculate start date (Sunday of the target week)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToLastSunday - (7 * weeksAgo));
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate end date (Saturday of the target week)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };
  
  /**
   * Format a date range for display
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {string} - Formatted date range
   */
  export const formatDateRange = (startDate, endDate) => {
    try {
      const options = { month: 'short', day: 'numeric' };
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    } catch (e) {
      console.error('Error formatting date range:', e);
      return 'Invalid Date Range';
    }
  };
  
  /**
   * Format a date as month and year
   * @param {Date} date - Date to format
   * @returns {string} - Formatted month and year
   */
  export const formatMonthYear = (date) => {
    try {
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      console.error('Error formatting month:', e);
      return 'Invalid Date';
    }
  };