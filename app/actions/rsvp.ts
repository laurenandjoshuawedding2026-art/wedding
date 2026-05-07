"use server";

import { client } from "@/app/lib/sanity";
import { revalidatePath } from "next/cache";

export async function submitRSVP(guestId: string, status: "attending" | "declined", count: number, guestName: string, dietaryRestrictions?: string) {
  try {
    await client
      .patch(guestId)
      .set({
        name: guestName,
        RSVP_status: status,
        attending_count: status === "attending" ? count : 0,
        dietary_restrictions: dietaryRestrictions || "",
      })
      .commit();

    revalidatePath(`/invite/[slug]`, "page");
    return { success: true };
  } catch (error) {
    console.error("RSVP failed:", error);
    return { success: false };
  }
}