import { Injectable, NotFoundException } from "@nestjs/common";
import { PublicContentRepository } from "../data-access/public-content.repository";

type NavigationNode = {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  description: string | null;
  target: string | null;
  children: NavigationNode[];
};

@Injectable()
export class PublicContentService {
  constructor(private readonly publicContentRepository: PublicContentRepository) {}

  async getSiteSettings(key = "default") {
    const settings = await this.publicContentRepository.getSiteSetting(key);

    if (!settings) {
      throw new NotFoundException(`Site settings not found for key "${key}".`);
    }

    return settings;
  }

  async getNavigationMenu(key = "primary") {
    const menu = await this.publicContentRepository.getNavigationMenu(key);

    if (!menu) {
      throw new NotFoundException(`Navigation menu not found for key "${key}".`);
    }

    const nodeMap = new Map<string, NavigationNode>();
    const roots: NavigationNode[] = [];

    for (const item of menu.items) {
      nodeMap.set(item.id, {
        id: item.id,
        itemKey: item.itemKey,
        label: item.label,
        href: item.href,
        description: item.description,
        target: item.target,
        children: []
      });
    }

    for (const item of menu.items) {
      const node = nodeMap.get(item.id)!;

      if (item.parentId) {
        const parent = nodeMap.get(item.parentId);

        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return {
      id: menu.id,
      key: menu.key,
      name: menu.name,
      location: menu.location,
      items: roots
    };
  }

  async getMarketingPage(slug: string) {
    const page = await this.publicContentRepository.getMarketingPageBySlug(slug);

    if (!page) {
      throw new NotFoundException(`Marketing page not found for slug "${slug}".`);
    }

    return page;
  }

  listStaffProfileGroups() {
    return this.publicContentRepository.listStaffProfileGroups();
  }

  listSuccessStories() {
    return this.publicContentRepository.listSuccessStories();
  }

  listFreeMaterials() {
    return this.publicContentRepository.listFreeMaterialCategories();
  }

  async getCountdownPage(slug: string) {
    const page = await this.publicContentRepository.getCountdownPageBySlug(slug);

    if (!page) {
      throw new NotFoundException(`Countdown page not found for slug "${slug}".`);
    }

    return page;
  }
}
