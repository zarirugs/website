export interface Project {
    id: number;
    title: string;
    location: string;
    image: string;
  }
  
  export const projects: Project[] = [
    {
      id: 1,
      title: "Luxury Residence",
      location: "Dubai",
      image: "/images/project-1.jpg",
    },
    {
      id: 2,
      title: "Boutique Hotel",
      location: "London",
      image: "/images/project-2.jpg",
    },
    {
      id: 3,
      title: "Private Villa",
      location: "Mumbai",
      image: "/images/project-3.jpg",
    },
  ];