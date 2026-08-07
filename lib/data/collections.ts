export interface Collection {
    id: number;
    title: string;
    subtitle: string;
    image: string;
  }
  
  export const collections: Collection[] = [
    {
      id: 1,
      title: "Heritage",
      subtitle:
        "Timeless Persian-inspired hand-knotted masterpieces.",
      image: "/images/collection-1.jpg",
    },
    {
      id: 2,
      title: "Contemporary",
      subtitle:
        "Modern minimalism woven by master artisans.",
      image: "/images/collection-2.jpg",
    },
    {
      id: 3,
      title: "Bespoke",
      subtitle:
        "Custom rugs created exclusively for luxury interiors.",
      image: "/images/collection-3.jpg",
    },
  ];