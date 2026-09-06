export interface Collection {
    id: number | string;
    title: string;
    subtitle: string;
    image: string;
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
      image: "/images/collection-1.jpg",
    },
    {
      id: 2,
      title: "Contemporary",
      slug: "contemporary",
      subtitle:
        "Modern minimalism woven by master artisans.",
      image: "/images/collection-2.png",
    },
    {
      id: 3,
      title: "Bespoke",
      slug: "bespoke",
      subtitle:
        "Custom rugs created exclusively for luxury interiors.",
      image: "/images/collection-3.jpg",
      imageFit: "cover",
    },
  ];
