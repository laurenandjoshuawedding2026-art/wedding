"use server";

import { client } from "@/app/lib/sanity";
import { revalidatePath } from "next/cache";

export async function submitWish(guestName: string, message: string) {
  try {
    await client.create({
      _type: 'wish',
      guestName: guestName,
      message: message,
      createdAt: new Date().toISOString(),
    });

    // Revalidate paths if you want the wishes to appear immediately on a public "Wall of Love" page
    // For now, we'll just revalidate the invite page, though wishes won't be displayed there.
    revalidatePath(`/invite/[slug]`, "page");
    
    return { success: true };
  } catch (error) {
    console.error("Wish submission failed:", error);
    return { success: false, error: (error as Error).message };
  }
}