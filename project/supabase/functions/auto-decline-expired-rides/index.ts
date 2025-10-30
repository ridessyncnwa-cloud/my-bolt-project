import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find all rides that have timed out (5 minutes passed) and still in requested status
    const { data: expiredRides, error: fetchError } = await supabase
      .from("rides")
      .select("id, customer_id, total_amount, created_at")
      .eq("status", "requested")
      .lt("timeout_at", new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredRides || expiredRides.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired rides found",
          processed: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Found ${expiredRides.length} expired rides to process`);

    // Process each expired ride
    const results = [];
    for (const ride of expiredRides) {
      try {
        // Update ride status to cancelled with refund
        const { error: updateError } = await supabase
          .from("rides")
          .update({
            status: "cancelled",
            cancelled_reason: "No driver accepted within 5 minutes - automatic timeout",
            cancelled_at: new Date().toISOString(),
            refund_amount: ride.total_amount,
            refund_reason: "Automatic timeout - no driver accepted",
            refunded_at: new Date().toISOString(),
          })
          .eq("id", ride.id);

        if (updateError) {
          console.error(`Failed to update ride ${ride.id}:`, updateError);
          results.push({
            rideId: ride.id,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Successfully cancelled and refunded ride ${ride.id}`);
          results.push({
            rideId: ride.id,
            success: true,
            refundAmount: ride.total_amount,
          });
        }
      } catch (error) {
        console.error(`Error processing ride ${ride.id}:`, error);
        results.push({
          rideId: ride.id,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${expiredRides.length} expired rides`,
        processed: expiredRides.length,
        succeeded: successCount,
        failed: failCount,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in auto-decline function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});