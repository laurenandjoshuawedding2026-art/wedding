import { Metadata } from "next";
import { client } from "@/app/lib/sanity";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const settings = await client.fetch(`*[_type == "eventSettings"][0]{ "ogImage": inviteOgImage.asset->url }`);

  return {
    title: "You're Invited | Lauren & Joshua Wedding",
    description: "Please join us as we celebrate our special day.",
    openGraph: {
      title: "Lauren & Joshua Wedding Invitation",
      description: "We can't wait to celebrate with you!",
      images: settings?.ogImage ? [{
        url: settings.ogImage,
        width: 1200,
        height: 630,
      }] : [],
    },
  };
}

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}