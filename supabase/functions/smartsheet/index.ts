import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SmartsheetRequest {
  sheetId: string;
  token: string;
}

// Rate limiting storage (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper function to check rate limits
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Helper function to sanitize input
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>\"'&]/g, '');
}

// Helper function for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body with size limit check
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 10) { // 10KB limit
      return new Response(
        JSON.stringify({ error: "Request too large" }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData = await req.json();
    
    // Don't log sensitive data - only log presence and types
    console.log("Request received:", {
      hasSheetId: !!requestData.sheetId,
      hasToken: !!requestData.token,
      sheetIdType: typeof requestData.sheetId,
      tokenType: typeof requestData.token,
      timestamp: new Date().toISOString()
    });

    const { sheetId, token } = requestData as SmartsheetRequest;

    // Enhanced validation with sanitization
    if (!sheetId) {
      return new Response(
        JSON.stringify({ error: "Sheet ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Smartsheet API token is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize and validate inputs
    const sanitizedSheetId = sanitizeString(sheetId);
    const sanitizedToken = sanitizeString(token);

    // Validate sheet ID format (should be a number)
    if (!/^\d{10,20}$/.test(sanitizedSheetId)) {
      return new Response(
        JSON.stringify({ error: "Invalid sheet ID format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate token format (basic check)
    if (sanitizedToken.length < 10 || sanitizedToken.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Making request to Smartsheet API for sheet ID: ${sanitizedSheetId.substring(0, 4)}****`);

    // Make request to Smartsheet API with timeout
    const response = await fetchWithTimeout(`https://api.smartsheet.com/2.0/sheets/${sanitizedSheetId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sanitizedToken}`,
        "Content-Type": "application/json",
        "User-Agent": "SmartsheetProxy/1.0"
      },
    }, 30000);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: "Unable to parse error response" };
      }

      // Log error details but don't expose them to client
      console.error("Smartsheet API error:", {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });

      // Return generic error messages based on status codes
      let clientMessage = "Failed to fetch data from Smartsheet";
      switch (response.status) {
        case 401:
          clientMessage = "Authentication failed";
          break;
        case 403:
          clientMessage = "Access denied";
          break;
        case 404:
          clientMessage = "Resource not found";
          break;
        case 429:
          clientMessage = "Rate limit exceeded";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          clientMessage = "Service temporarily unavailable";
          break;
      }

      return new Response(
        JSON.stringify({ 
          error: clientMessage,
          status: response.status
        }),
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Successfully retrieved data from Smartsheet API");
    
    // Process the Smartsheet data to match our WorkflowItem structure
    const processedData = processSmartsheetData(data);

    return new Response(
      JSON.stringify(processedData),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff"
        },
      }
    );
  } catch (error) {
    // Log detailed error internally but return generic message
    console.error("Internal error:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to process Smartsheet data into our WorkflowItem format
function processSmartsheetData(data: any) {
  if (!data || !data.rows || !data.columns) {
    console.log("Invalid data structure received from Smartsheet");
    return [];
  }

  // Create a map of column IDs to column names
  const columnMap = data.columns.reduce((map: Record<string, string>, column: any) => {
    if (column && column.id && column.title) {
      map[column.id] = sanitizeString(column.title);
    }
    return map;
  }, {});

  // Process each row into a WorkflowItem
  return data.rows.map((row: any) => {
    const item: Record<string, string> = {};
    
    // Map each cell to the appropriate field in our data model
    if (row.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell: any) => {
        const columnName = columnMap[cell.columnId];
        if (columnName) {
          // Sanitize cell values
          let cellValue = '';
          if (cell.value !== null && cell.value !== undefined) {
            cellValue = String(cell.value).trim();
            // Additional sanitization for specific data types
            if (cell.columnType === 'DATE') {
              cellValue = cellValue.replace(/[<>\"'&]/g, '');
            } else {
              cellValue = sanitizeString(cellValue);
            }
          }
          item[columnName] = cellValue;
        }
      });
    }

    // Ensure all required fields exist with sanitized empty values
    const requiredFields = [
      "Health", "Format", "Grade/Level", "Unit", "Week", "Component",
      "Activity", "Workflow", "Assigned to:", "WW Status", "Progress",
      "Predecessors", "Reporting Status", "Duration", "Scheduled Start Date",
      "Scheduled End Date", "Comments", "Completion Date", "Variance",
      "Baseline Start", "Baseline Finish", "% Complete", "% Remaining",
      "% Allocation", "Read"
    ];

    requiredFields.forEach(field => {
      if (!item[field]) {
        item[field] = '';
      }
    });

    return item;
  });
}