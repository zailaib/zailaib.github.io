import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '../src/content/posts');
const OUTPUT_FILE = path.join(__dirname, '../src/generated/sidebar.json');

async function getPosts() {
  const posts = [];
  const categories = await fs.readdir(POSTS_DIR);
  
  for (const category of categories) {
    const categoryPath = path.join(POSTS_DIR, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      const postFiles = await fs.readdir(categoryPath);
      
      for (const postFile of postFiles) {
        if (postFile.endsWith('.md')) {
          const content = await fs.readFile(path.join(categoryPath, postFile), 'utf-8');
          const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)[1];
          const data = {};
          
          frontmatter.split('\n').forEach(line => {
            const [key, ...values] = line.split(':');
            if (key && values.length) {
              data[key.trim()] = values.join(':').trim().replace(/^['"]|['"]$/g, '');
            }
          });
          
          posts.push({
            title: data.title,
            slug: `${category}/${postFile.replace('.md', '')}`,
            date: data.date,
            tags: data.tags
          });
        }
      }
    }
  }
  
  return posts;
}

async function generateSidebarData() {
  const posts = await getPosts();
  const postsByCategory = posts.reduce((acc, post) => {
    const category = post.slug.split('/')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(post);
    return acc;
  }, {});

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(postsByCategory, null, 2)
  );
}

generateSidebarData().catch(console.error);
