import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    const { action, rideId, customerId } = await req.json();

    if (action === "process_ride_request") {
      // Check for active drivers
      const { data: activeDrivers } = await supabase
        .from("driver_profiles")
        .select("user_id, id")
        .eq("is_active", true);

      if (!activeDrivers || activeDrivers.length === 0) {
        // No drivers available - cancel ride and notify customer
        await supabase
          .from("rides")
          .update({
            status: "cancelled",
            cancelled_reason: "No drivers available at this time",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", rideId);

        return new Response(
          JSON.stringify({
            success: false,
            message: "No drivers are currently available. Your ride has been cancelled and you will be refunded.",
            action: "no_drivers",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Get the ride details
      const { data: ride } = await supabase
        .from("rides")
        .select("*, declined_by_drivers")
        .eq("id", rideId)
        .single();

      if (!ride) {
        return new Response(
          JSON.stringify({ error: "Ride not found" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Filter out drivers who have declined
      const declinedByDrivers = ride.declined_by_drivers || [];
      const availableDrivers = activeDrivers.filter(
        (driver) => !declinedByDrivers.includes(driver.user_id)
      );

      if (availableDrivers.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "All available drivers have declined. Looking for more drivers...",
            action: "all_declined",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Assign to first available driver
      const selectedDriver = availableDrivers[0];
      await supabase
        .from("rides")
        .update({
          assigned_driver_id: selectedDriver.user_id,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", rideId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Driver assigned successfully",
          driverId: selectedDriver.user_id,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (action === "check_wait_time") {
      const { data: ride } = await supabase
        .from("rides")
        .select("created_at, status, total_amount")
        .eq("id", rideId)
        .single();

      if (!ride || ride.status !== "requested") {
        return new Response(
          JSON.stringify({ message: "Ride not active" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const createdAt = new Date(ride.created_at);
      const now = new Date();
      const waitMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

      if (waitMinutes > 10) {
        // Offer 15% discount or cancellation
        const discountAmount = ride.total_amount * 0.15;
        const newAmount = ride.total_amount - discountAmount;

        return new Response(
          JSON.stringify({
            action: "offer_discount",
            waitMinutes: Math.floor(waitMinutes),
            message: `We apologize for the wait. We can offer you a 15% discount (saving $${discountAmount.toFixed(2)}) or cancel your ride with a full refund.`,
            originalAmount: ride.total_amount,
            discountedAmount: newAmount,
            discountPercent: 15,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          action: "continue_waiting",
          waitMinutes: Math.floor(waitMinutes),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (action === "apply_discount") {
      const { discountedAmount } = await req.json();
      
      await supabase
        .from("rides")
        .update({
          total_amount: discountedAmount,
          discount_applied: true,
          discount_reason: "Wait time exceeded 10 minutes",
        })
        .eq("id", rideId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Discount applied successfully",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (action === "cancel_with_refund") {
      await supabase
        .from("rides")
        .update({
          status: "cancelled",
          cancelled_reason: "Customer requested cancellation due to wait time",
          cancelled_at: new Date().toISOString(),
          refund_issued: true,
        })
        .eq("id", rideId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Ride cancelled and refund issued",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in AI coordinator:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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