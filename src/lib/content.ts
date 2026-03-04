import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "src/content");

export interface PostMeta {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
  tags?: string[];
}

export interface ProjectMeta {
  title: string;
  description: string;
  slug: string;
  tags?: string[];
  featured?: boolean;
}

export function getBlogPosts(): PostMeta[] {
  const dir = path.join(contentDir, "blog");

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return {
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
        slug: file.replace(".mdx", ""),
        tags: data.tags,
      } as PostMeta;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(slug: string) {
  const filePath = path.join(contentDir, "blog", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      slug,
      tags: data.tags,
    } as PostMeta,
    content,
  };
}

export function getProjects(): ProjectMeta[] {
  const dir = path.join(contentDir, "projects");

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);
    return {
      title: data.title,
      description: data.description,
      slug: file.replace(".mdx", ""),
      tags: data.tags,
      featured: data.featured,
    } as ProjectMeta;
  });
}
