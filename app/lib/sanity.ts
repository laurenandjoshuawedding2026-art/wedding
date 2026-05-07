import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion, token } from "@/sanity/env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for mutations and real-time lookup
  token,
});

export const findGuestByNameQuery = `*[_type == "guest" && name match $name][0]`;
export const guestBySlugQuery = `*[_type == "guest" && slug.current == $slug][0]`;
export const allWishesQuery = `*[_type == "wish"] | order(createdAt desc)`;