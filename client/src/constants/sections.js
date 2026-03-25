export const STORE_SECTIONS = [
  {
    slug: "men-clothing",
    title: "Men Clothing",
    description: "Tailored polos, structured jackets, and modern silhouettes.",
    searchCategory: "clothing",
  },
  {
    slug: "perfumes",
    title: "Perfumes",
    description: "Signature scents crafted with rare notes and lasting character.",
    searchCategory: "perfumes",
  },
  {
    slug: "accessories",
    title: "Accessories",
    description: "Belts, eyewear, and finishing details that define presence.",
    searchCategory: "accessories",
  },
];

export const getSectionBySlug = (slug) =>
  STORE_SECTIONS.find((section) => section.slug === slug) || null;
