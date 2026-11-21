import { connectToDatabase } from "@/lib/db/connect";
import { projects as legacyProjects, type Project } from "@/lib/projects";
import { services as legacyServices } from "@/lib/services";
import { ManagedService, PortfolioProject } from "@/models/business";

async function seedExistingPublicContent() {
  await Promise.all([
    ...legacyProjects.map((project, index) =>
      PortfolioProject.updateOne(
        { slug: project.id },
        {
          $setOnInsert: {
            title: project.name,
            slug: project.id,
            category: project.category,
            shortDescription: project.description,
            description: project.caseStudy || project.description,
            coverImageUrl: "",
            galleryImageUrls: [],
            technologyStack: project.technologyStack,
            completionYear: project.year,
            projectType: project.projectType,
            liveUrl: project.liveUrl,
            featured: project.featured,
            published: true,
            sortOrder: index,
            visual: project.visual,
          },
        },
        { upsert: true },
      ),
    ),
    ...legacyServices.map((service) =>
      ManagedService.updateOne(
        { _id: service.id },
        {
          $setOnInsert: {
            _id: service.id,
            name: service.name,
            shortDescription: service.description,
            description: service.description,
            iconId: service.iconId,
            displayOrder: Number(service.number),
            visible: true,
          },
        },
        { upsert: true },
      ),
    ),
  ]);
}

export async function listManagedServices() {
  await connectToDatabase();
  await seedExistingPublicContent();
  return ManagedService.find({}).sort({ displayOrder: 1 }).lean().exec();
}

export async function listPortfolioProjects() {
  await connectToDatabase();
  await seedExistingPublicContent();
  return PortfolioProject.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean().exec();
}

export async function getPublishedPortfolioProjects(): Promise<Project[]> {
  try {
    const records = await listPortfolioProjects();
    return records
      .filter((record) => record.published)
      .map((record) => ({
        id: record.slug,
        name: record.title,
        category: record.category,
        description: record.shortDescription,
        technologyStack: record.technologyStack,
        stackLabel: "Technology",
        projectType: record.projectType,
        year: record.completionYear,
        featured: record.featured,
        visual: record.visual,
        liveUrl: record.liveUrl || undefined,
        caseStudy: record.description,
        coverImageUrl: record.coverImageUrl || undefined,
      }));
  } catch (error) {
    console.error(
      "Published portfolio content could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return legacyProjects;
  }
}

export async function getPublishedServices() {
  try {
    const records = await listManagedServices();
    return records
      .filter((record) => record.visible)
      .map((record) => ({
        id: record._id,
        number: String(record.displayOrder).padStart(2, "0"),
        name: record.name,
        description: record.description,
        iconId: record.iconId,
        marker: `Capability / ${String(record.displayOrder).padStart(2, "0")}`,
      }));
  } catch (error) {
    console.error(
      "Published services could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return legacyServices.map((service) => ({
      id: service.id,
      number: service.number,
      name: service.name,
      description: service.description,
      iconId: service.iconId,
      marker: service.marker,
    }));
  }
}
