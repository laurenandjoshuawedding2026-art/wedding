import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // You can fetch specific guest data here if you want personalized OG titles
  return {
    title: "You're Invited | Lauren & Joshua Wedding",
    description: "Please join us as we celebrate our special day.",
    openGraph: {
      title: "Lauren & Joshua Wedding Invitation",
      description: "We can't wait to celebrate with you!",
      images: [
        {
          url: "/invite-og.jpg", // Resolves to your-domain.com/invite-og.jpg
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}