export interface Collection {
    id: number | string;
    title: string;
    subtitle: string;
    image: string;
    backgroundColor?: string | null;
    slug?: string;
    imageFit?: "contain" | "cover";
  }
  
  export const collections: Collection[] = [
    {
      id: 1,
      title: "Heritage",
      slug: "heritage",
      subtitle:
        "Timeless Persian-inspired hand-knotted masterpieces.",
      image: "/api/media/media-default-heritage",
    },
    {
      id: 2,
      title: "Contemporary",
      slug: "contemporary",
      subtitle:
        "Modern minimalism woven by master artisans.",
      image: "/api/media/media-default-contemporary",
    },
    {
      id: 3,
      title: "Bespoke",
      slug: "bespoke",
      subtitle:
        "Custom rugs created exclusively for luxury interiors.",
      image: "/api/media/media-default-bespoke",
      imageFit: "cover",
    },
  ];
