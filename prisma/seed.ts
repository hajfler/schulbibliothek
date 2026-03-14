import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Schulhaus Dorf
  const school = await prisma.school.upsert({
    where: { slug: "schulhaus-dorf" },
    update: {},
    create: {
      name: "Schulhaus Dorf",
      slug: "schulhaus-dorf",
      description: "Schulbibliothek des Schulhauses Dorf",
      address: "Schulstrasse 1, 8305 Dietlikon",
      color: "#007AFF",
    },
  });

  console.log("Created school:", school.name);

  // Sample books
  const books = [
    {
      isbn: "978-3-7891-4028-4",
      title: "Die Schule der magischen Tiere",
      author: "Margit Auer",
      publishingHouse: "Carlsen",
      typePublication: "BOOK" as const,
      format: "HARDCOVER" as const,
      publishedDate: "2013",
      pageCount: 144,
      language: "de",
      totalCopies: 3,
      coverUrl: "https://covers.openlibrary.org/b/isbn/9783789140284-L.jpg",
      schoolId: school.id,
    },
    {
      isbn: "978-3-551-55565-8",
      title: "Gregs Tagebuch",
      author: "Jeff Kinney",
      publishingHouse: "Wimpy Kid",
      typePublication: "BOOK" as const,
      format: "HARDCOVER" as const,
      publishedDate: "2008",
      pageCount: 224,
      language: "de",
      totalCopies: 5,
      coverUrl: "https://covers.openlibrary.org/b/isbn/9783551555658-L.jpg",
      schoolId: school.id,
    },
    {
      isbn: "978-3-7891-4066-6",
      title: "Die Schule der magischen Tiere 2",
      author: "Margit Auer",
      publishingHouse: "Carlsen",
      typePublication: "BOOK" as const,
      format: "HARDCOVER" as const,
      publishedDate: "2014",
      pageCount: 160,
      language: "de",
      totalCopies: 2,
      schoolId: school.id,
    },
    {
      title: "Was ist was: Dinosaurier",
      author: "Various Authors",
      publishingHouse: "Tessloff",
      typePublication: "REFERENCE" as const,
      format: "HARDCOVER" as const,
      publishedDate: "2020",
      pageCount: 48,
      language: "de",
      totalCopies: 1,
      schoolId: school.id,
    },
    {
      title: "Asterix bei den Schweizern",
      author: "René Goscinny",
      publishingHouse: "Egmont",
      typePublication: "COMIC" as const,
      format: "HARDCOVER" as const,
      publishedDate: "1970",
      pageCount: 48,
      language: "de",
      totalCopies: 2,
      schoolId: school.id,
    },
  ];

  for (const book of books) {
    await prisma.book.create({ data: book });
  }

  console.log(`Created ${books.length} sample books`);
  console.log("\nDatabase seeded successfully!");
  console.log("\nNext steps:");
  console.log("1. Set up Azure AD app registration");
  console.log("2. Configure .env with your credentials");
  console.log("3. Log in with your Microsoft 365 account");
  console.log("4. Manually set your user role to ADMIN via database:");
  console.log("   UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.ch';");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
