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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log("Received request data:", {
      hasSheetId: !!requestData.sheetId,
      hasToken: !!requestData.token,
      sheetIdType: typeof requestData.sheetId,
      tokenType: typeof requestData.token
    });

    const { sheetId, token } = requestData as SmartsheetRequest;

    // Enhanced validation
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

    // Validate sheet ID format (should be a number)
    if (isNaN(Number(sheetId))) {
      return new Response(
        JSON.stringify({ error: "Invalid sheet ID format. Sheet ID should be a number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Making request to Smartsheet API for sheet ID: ${sheetId}`);

    // Make request to Smartsheet API
    const response = await fetch(`https://api.smartsheet.com/2.0/sheets/${sheetId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Smartsheet API error response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      // Enhanced error response with more details
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch data from Smartsheet", 
          status: response.status,
          statusText: response.statusText,
          details: errorData,
          message: errorData.message || "Unknown error occurred"
        }),
        {
          status: response.status,
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        type: error.name,
        message: error.message,
        details: error.stack
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
    console.log("Invalid data structure received from Smartsheet:", data);
    return [];
  }

  // Create a map of column IDs to column names
  const columnMap = data.columns.reduce((map: Record<string, string>, column: any) => {
    map[column.id] = column.title;
    return map;
  }, {});

  // Process each row into a WorkflowItem
  return data.rows.map((row: any) => {
    const item: Record<string, string> = {};
    
    // Map each cell to the appropriate field in our data model
    row.cells.forEach((cell: any) => {
      const columnName = columnMap[cell.columnId];
      item[columnName] = cell.value || '';
    });

    // Ensure all required fields exist
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